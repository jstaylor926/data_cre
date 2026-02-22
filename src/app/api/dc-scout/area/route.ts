/**
 * POST /api/dc-scout/area
 *
 * Tier 2: Find and rank the best specific parcels within a given bbox.
 * Fetches parcels + area substations once, quick-scores all candidates
 * by proximity math, then fires full dc-score only on the top 5.
 *
 * Body: { bbox: [west, south, east, north], mw: number }
 * Returns: SSE stream of ranked candidates
 */

import { getAnthropicClient, HAIKU } from "@/lib/claude";
import { fetchSubstationsNear } from "@/lib/hifld";
import { computeDCScore, effectiveRadius, buildEnvFlags } from "@/lib/dc-scoring";
import type { RankedCandidate, DCInfrastructure } from "@/lib/types";

const PARCEL_API =
  "https://services.arcgis.com/FPVzDMFGKaEQWcaJ/arcgis/rest/services/Gwinnett_County_Parcels/FeatureServer/0/query";

// Minimum acreage to be a viable data center site
const MIN_ACRES = 5;
// Zoning codes that could support a data center (industrial / commercial)
const VIABLE_ZONING = ["M1", "M2", "BG", "OI", "OP", "LI", "HI", "IND", "C2", "C3"];

function haversineMiles(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function polygonCentroid(rings: number[][][]): [number, number] {
  const coords = rings[0];
  const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  return [lng, lat];
}

// Quick score a parcel based on loaded substations (pure math, no API calls)
function quickScore(
  centroid: [number, number],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  substations: any[],
  mw: number
): number {
  const radius = effectiveRadius(mw);
  const inRange = substations
    .map((s) => ({ ...s, dist: haversineMiles(centroid[0], centroid[1], s.lng, s.lat) }))
    .filter((s) => s.dist <= radius)
    .sort((a, b) => a.dist - b.dist);

  if (inRange.length === 0) return 5;

  const nearest = inRange[0];
  let score = 0;

  // Distance component (0–40)
  const d = nearest.dist;
  if (d <= 0.5) score += 40;
  else if (d <= 1) score += 36;
  else if (d <= 2) score += 30;
  else if (d <= 3) score += 25;
  else if (d <= 5) score += 20;
  else if (d <= 8) score += 14;
  else score += 8;

  // Voltage component (0–40)
  const v = nearest.voltage;
  if (v >= 500) score += 40;
  else if (v >= 345) score += 35;
  else if (v >= 230) score += 28;
  else if (v >= 115) score += 20;
  else score += 10;

  // Count bonus (0–20)
  score += Math.min(20, inRange.length * 4);

  return Math.min(100, score);
}

export async function POST(request: Request) {
  let bbox: [number, number, number, number];
  let mw: number;

  try {
    const body = await request.json();
    bbox = body.bbox;
    mw = Math.max(0.1, Math.min(500, Number(body.mw ?? 10)));
    if (!Array.isArray(bbox) || bbox.length !== 4) {
      return new Response("bbox must be [west, south, east, north]", { status: 400 });
    }
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const [west, south, east, north] = bbox;
  const centerLng = (west + east) / 2;
  const centerLat = (south + north) / 2;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`)
        );
      };

      try {
        // Step 1 — fetch parcels in bbox from Gwinnett ArcGIS
        send("status", "Fetching parcels in area…");
        const params = new URLSearchParams({
          where: `CALCULATEDACREAGE >= ${MIN_ACRES}`,
          geometry: JSON.stringify({ xmin: west, ymin: south, xmax: east, ymax: north }),
          geometryType: "esriGeometryEnvelope",
          inSR: "4326",
          spatialRel: "esriSpatialRelIntersects",
          outFields: "PIN,ADDRESS,CALCULATEDACREAGE,ZONING,ZONING_DESC",
          returnGeometry: "true",
          outSR: "4326",
          resultRecordCount: "100",
          f: "json",
        });

        const parcelRes = await fetch(`${PARCEL_API}?${params}`, { cache: "no-store" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let features: any[] = [];
        if (parcelRes.ok) {
          const parcelJson = await parcelRes.json();
          features = parcelJson?.features ?? [];
        }

        // Filter to viable zoning if we have enough results
        const viableFeatures = features.filter((f) => {
          const zoning = (f.attributes?.ZONING ?? "").toUpperCase();
          return VIABLE_ZONING.some((z) => zoning.includes(z));
        });
        const candidates = viableFeatures.length >= 5 ? viableFeatures : features;

        send("status", `Found ${candidates.length} candidate parcels. Loading power data…`);

        // Step 2 — fetch area substations ONCE
        const radius = effectiveRadius(mw);
        const areaSubstations = await fetchSubstationsNear(
          centerLng, centerLat, radius + 5  // add buffer
        ).catch(() => []);

        send("status", `Scoring ${candidates.length} parcels against ${areaSubstations.length} substations…`);

        // Step 3 — quick-score every parcel (pure math)
        const scored = candidates
          .map((f) => {
            const rings = f.geometry?.rings ?? f.geometry?.coordinates;
            if (!rings?.length) return null;
            const centroid = polygonCentroid(rings);
            const qs = quickScore(centroid, areaSubstations, mw);
            return {
              apn: f.attributes?.PIN ?? "",
              address: f.attributes?.ADDRESS ?? "Unknown Address",
              acres: f.attributes?.CALCULATEDACREAGE ?? null,
              zoning: f.attributes?.ZONING ?? null,
              centroid,
              quickScore: qs,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null && x.apn !== "")
          .sort((a, b) => b.quickScore - a.quickScore)
          .slice(0, 10);

        // Emit quick results immediately so map can show pins
        const quickResults: RankedCandidate[] = scored.map((s, i) => ({
          rank: i + 1,
          ...s,
          dcScore: null,
          infrastructure: null,
        }));
        send("quick_results", quickResults);

        // Step 4 — full dc-score on top 5
        send("status", "Running full infrastructure analysis on top 5 sites…");

        const top5 = scored.slice(0, 5);
        const fullScored = await Promise.all(
          top5.map(async (candidate, i): Promise<RankedCandidate> => {
            try {
              const res = await fetch(
                `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/parcel/${encodeURIComponent(candidate.apn)}/dc-score?mw=${mw}`,
                { cache: "no-store" }
              );
              if (!res.ok) throw new Error("dc-score failed");
              const infra: DCInfrastructure = await res.json();
              const dcScore = computeDCScore(infra, mw);
              return { rank: i + 1, ...candidate, dcScore, infrastructure: infra };
            } catch {
              // Fall back to a score built from area subs
              const nearSubs = areaSubstations
                .map((s) => ({
                  ...s,
                  dist: haversineMiles(candidate.centroid[0], candidate.centroid[1], s.lng, s.lat),
                }))
                .sort((a, b) => a.dist - b.dist);

              const fallbackInfra: DCInfrastructure = {
                substations: nearSubs.slice(0, 5).map((s) => ({
                  id: s.id,
                  name: s.name,
                  voltage: s.voltage,
                  operator: s.operator,
                  coordinates: [s.lng, s.lat] as [number, number],
                  distance: s.dist,
                })),
                nearestTxVoltage: null,
                floodZone: null,
                floodZoneSubtype: null,
                envFlags: buildEnvFlags(null, null),
                fiberCarriers: [],
                tieDistance: haversineMiles(
                  candidate.centroid[0], candidate.centroid[1], -84.3963, 33.7567
                ),
                waterCapacity: null,
                utilityTerritory: nearSubs[0]?.operator ?? null,
              };
              const dcScore = computeDCScore(fallbackInfra, mw);
              return { rank: i + 1, ...candidate, dcScore, infrastructure: fallbackInfra };
            }
          })
        );

        // Re-rank by full dc score
        fullScored.sort((a, b) => {
          const aScore = a.dcScore?.composite ?? 0;
          const bScore = b.dcScore?.composite ?? 0;
          return bScore - aScore;
        });
        fullScored.forEach((c, i) => { c.rank = i + 1; });

        // Merge: replace top-5 quick results with full-scored
        const finalResults: RankedCandidate[] = [
          ...fullScored,
          ...quickResults.slice(5),
        ];
        send("full_results", finalResults);

        // Step 5 — brief AI summary of top 3
        const top3 = fullScored.slice(0, 3).filter((c) => c.dcScore);
        if (top3.length > 0) {
          send("status", "Generating area summary…");
          const summaryPrompt = `You are a data center site consultant. Briefly summarize the top ${top3.length} parcel candidates found in this area for a ${mw}MW build. Plain text, 2 sentences max per site, total under 120 words.

${top3
  .map(
    (c, i) =>
      `Site ${i + 1}: ${c.address} (${c.acres?.toFixed(1)} acres, ${c.zoning})
Score: ${c.dcScore!.disqualified ? "DISQUALIFIED" : `${c.dcScore!.composite}/100`} · Power: ${c.dcScore!.power}/40 · Fiber: ${c.dcScore!.fiber}/30`
  )
  .join("\n\n")}`;

          const aiClient = getAnthropicClient();
          const aiStream = await aiClient.messages.stream({
            model: HAIKU,
            max_tokens: 200,
            messages: [{ role: "user", content: summaryPrompt }],
          });

          for await (const chunk of aiStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              send("summary_chunk", chunk.delta.text);
            }
          }
        }

        send("done", null);
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        send("error", msg);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
