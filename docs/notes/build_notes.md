Good instinct to pause here. Let me think through what's actually going to trip you up once you start writing code — not the theoretical stuff, but the things that cause real problems mid-build.

**Licensing & Legal Clarity Before Line One**

The Regrid data license is the one that matters most. Their county extracts come with specific usage terms — some tiers allow you to display parcel boundaries to end users, others restrict it to internal use only. If you buy the wrong tier, you build the entire Phase 1 demo on data you can't legally show DeThomas. Read the license before you purchase, and confirm in writing that your use case (displaying parcels in a SaaS product to paying clients) is covered. Same applies to the Georgia SOS scraper — scraping a government site for commercial use is legally gray. It works, but if it becomes a core feature you're selling, you want to understand the terms of use on ecorp.sos.ga.gov.

**DeThomas Data Handling Agreement**

Before they hand you 20 years of deal documents for the RAG pipeline, you need a data processing agreement in place. This isn't just legal hygiene — it's the thing their internal counsel will ask about before they share anything sensitive. The agreement should cover: who owns the data (they do), who can access it (only their org via RLS), where it's stored (Supabase region, encrypted at rest), what happens if the relationship ends (data export + deletion within 30 days), and whether you can use anonymized patterns from their data to improve the platform for other clients. Get this drafted alongside the main services agreement, not after.

**Mapbox Cost Modeling at Scale**

The free tier covers development easily, but the pricing model shifts once you have multiple users loading map tiles simultaneously. Mapbox charges per "map load" — each time a user initializes the map component, that's a load. If DeThomas has 10 users opening the app 5 times a day, that's 1,500 loads/month. Still free tier. But if you get a second client and usage grows to 15K+ loads/month, you're looking at $250–$500/month just for maps. Model this before you set your $3,500/month price — make sure it has headroom for the variable costs that scale with usage.

**Offline / Field Reality**

DeThomas developers are walking sites in Gwinnett County, not sitting in an office with perfect WiFi. Cell coverage in parts of suburban Atlanta is spottier than you'd expect, especially on construction sites and undeveloped parcels — which is exactly where they'll be using the app. For Phase 1, the PWA service worker should cache the most recently viewed map tiles and parcel data so the app doesn't show a blank screen when signal drops. You don't need full offline mode yet, but you need graceful degradation. Test on a real phone, on a real site visit, with spotty signal. If it doesn't work there, the demo fails regardless of how good the features are.

**Parcel Data Freshness vs. Cost**

The Regrid extract is a point-in-time snapshot. Parcel ownership changes, sales happen, rezoning occurs. If DeThomas is looking at a parcel and the owner name is 6 months stale, that's a trust-breaking moment. You need a refresh strategy. Options: quarterly re-purchase of county extracts (~$600–$900/year), or upgrade to Regrid's live API for real-time lookups at ~$0.01–$0.05 per query. For the pilot, quarterly refresh is fine. But document this limitation in the proposal so DeThomas knows the data has a freshness window and doesn't lose confidence the first time they find a stale record.

**Your Own IP Protection**

You mentioned the financial advisor conversation about entity structure. Before you write code, confirm: the LLC is formed, the code lives in a repo owned by the LLC (not your personal GitHub), and any contract with DeThomas explicitly states you retain platform IP while they own their data. If you write code under your personal name and later try to assign it to a business entity, that's a mess. If DeThomas's contract doesn't clearly delineate IP, their lawyer could argue the setup fee bought them ownership of the platform. Get this right before the first commit, not after.

**Supabase Tier Limits That Will Bite You**

The free tier has a 500MB database limit. A single county's parcel data with PostGIS geometry is roughly 200–400MB. You'll hit the free tier wall before you finish ingesting Gwinnett County. Start on Pro ($25/month) from day one — don't build on free and discover migration pain mid-development. Also, the Pro tier includes 8GB of database storage, which covers all four phases through Georgia-wide coverage. The pgvector index for deal document embeddings adds roughly 50–100MB per 1,000 documents, which is well within limits.

**Authentication Flow for Field Use**

Supabase Auth works, but think about the field workflow. A developer walks up to a site, pulls out their phone, opens the app. If the session has expired (Supabase default is 1 hour for JWT, refresh token lasts longer), they hit a login screen while standing in a field. That's friction. Configure the refresh token lifetime to 30+ days and implement silent refresh in the service worker so the app is always ready when they open it. Also consider whether DeThomas wants SSO (they probably use Google Workspace) — Supabase supports it, but it's a configuration step you should plan for, not discover during the pilot.

**Testing with Real Users, Not Just Real Data**

Before the DeThomas demo, do a ride-along. Ask if you can join one of their site visits and watch how they currently evaluate a parcel. What do they look at first? What do they pull up on their phone? What questions do they ask out loud? The answers will change your UI priorities. You might discover that the parcel detail panel needs to show traffic count before zoning, or that they always check Google Street View before anything else. One afternoon in the field with them is worth more than a week of building assumptions.