import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/research/upload
 *
 * Accepts a file upload (multipart/form-data) and returns extracted text.
 * In dev mode, returns mock-extracted content. In production, this would use
 * a document parsing service (e.g., pdf.js, Textract, or Claude vision).
 *
 * Supported file types: PDF, DOCX, TXT, CSV, images (PNG/JPG for OCR)
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SUPPORTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit" },
        { status: 413 }
      );
    }

    if (!SUPPORTED_TYPES.has(file.type) && !file.name.endsWith(".txt")) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Supported: PDF, DOCX, TXT, CSV, PNG, JPG`,
        },
        { status: 415 }
      );
    }

    // In dev mode: extract text content from text-based files,
    // generate mock extraction for binary files
    let extractedText = "";

    if (file.type === "text/plain" || file.type === "text/csv") {
      extractedText = await file.text();
    } else {
      // Mock extraction for PDFs, DOCX, images
      extractedText = generateMockExtraction(file.name, file.type);
    }

    return NextResponse.json({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      extractedText,
    });
  } catch (err) {
    console.error("[Research Upload] Error:", err);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

function generateMockExtraction(name: string, type: string): string {
  const lower = name.toLowerCase();

  if (lower.includes("loi") || lower.includes("letter")) {
    return `[Extracted from ${name}]\n\nLetter of Intent — Property Acquisition\n\nSubject Property: Commercial parcel, approximately 3.5 acres\nProposed Use: Last-mile distribution facility\nTarget Price Range: $1.2M – $1.8M\nZoning Requirements: M-1 or M-2 (Industrial/Light Industrial)\nAccess Requirements: Within 2 miles of interstate access\nTimeline: 90-day due diligence period\n\nAdditional Notes: Preference for parcels with existing utility infrastructure. Environmental Phase I clearance required.`;
  }

  if (lower.includes("site") || lower.includes("plan")) {
    return `[Extracted from ${name}]\n\nSite Requirements Summary\n\nMinimum Lot Size: 5 acres\nPreferred Zoning: C-2, MU-1, or PUD\nBuilding Coverage: 35-45%\nParking: 4 spaces per 1,000 SF\nSetbacks: 50ft front, 25ft side\nUtilities: Municipal water + sewer required\nFlood Zone: Must be outside FEMA 100-year\n\nPreferred Locations: Gwinnett County, Peachtree Corners area, near I-85 corridor`;
  }

  if (lower.includes("market") || lower.includes("report")) {
    return `[Extracted from ${name}]\n\nMarket Analysis — Northeast Atlanta Submarket\n\nVacancy Rate: 4.2% (industrial), 8.7% (office)\nAsking Rent: $7.50/SF NNN (industrial), $22/SF FSG (office)\nCap Rate Range: 5.5% – 7.0%\nAbsorption: +320,000 SF (trailing 12 months)\n\nKey Drivers: Proximity to I-85/I-985 interchange, Gwinnett County's pro-development zoning policies, growing population base.`;
  }

  if (type.startsWith("image/")) {
    return `[OCR extracted from ${name}]\n\nParcel survey showing irregular lot boundaries. Approximate dimensions: 450ft x 380ft. Notable features: existing concrete pad (approx 5,000 SF), curb cut on primary road frontage, mature tree line along eastern boundary.`;
  }

  return `[Extracted from ${name}]\n\nDocument contains property-related information including ownership details, site specifications, and development parameters. Key terms identified: commercial development, zoning compliance, environmental clearance, utility access.`;
}
