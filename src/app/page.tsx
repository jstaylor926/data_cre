import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="space-y-4 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Pocket Developer
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl">
            A comprehensive commercial real estate intelligence platform, evolving from core parcel mapping
            to advanced AI site selection and specialized data center infrastructure analysis.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Phase 1 */}
          <Card className="flex flex-col border-primary/20 shadow-md">
            <CardHeader>
              <div className="text-primary text-sm font-semibold mb-2">CURRENT</div>
              <CardTitle>Phase 1<br />The Foundation</CardTitle>
              <CardDescription>LandGlide Replication & Core Map</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-zinc-600 dark:text-zinc-400 space-y-4">
              <p>
                Interactive parcel map with vector overlays, rich parcel detail panels, GPS tracking,
                address search, and intelligent LLC owner piercing. Includes ability to save and organize collections.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
                <li>Interactive Parcel Map</li>
                <li>Detail Panel</li>
                <li>LLC Owner Lookup</li>
                <li>Saved Properties</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/phase-1">Launch Phase 1</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Phase 2 */}
          <Card className="flex flex-col border-violet/20 shadow-md">
            <CardHeader>
              <div className="text-violet text-sm font-semibold mb-2">ACTIVE</div>
              <CardTitle>Phase 2<br />AI Site Analysis</CardTitle>
              <CardDescription>Development Intelligence & RAG</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-zinc-600 dark:text-zinc-400 space-y-4">
              <p>
                Transforms raw parcel data into actionable intelligence. Features AI-driven development scoring,
                zoning interpretation, automated comparable sales, and deal history.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
                <li>AI Site Score Card</li>
                <li>Zoning Intelligence</li>
                <li>Comparable Sales</li>
                <li>Deal History RAG</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/phase-2">Launch Phase 2</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Phase 3 */}
          <Card className="flex flex-col border-orange-400/20 shadow-md">
            <CardHeader>
              <div className="text-orange-400 text-sm font-semibold mb-2">NEW</div>
              <CardTitle>Phase 3<br />Data Center Mode</CardTitle>
              <CardDescription>Infrastructure & Risk Scoring</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-zinc-600 dark:text-zinc-400 space-y-4">
              <p>
                Specialized tooling for data center developers. Overlays and scores power infrastructure,
                fiber latency, water availability, and environmental risks with live HIFLD + FEMA data.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
                <li>Power & Substation Scoring</li>
                <li>Fiber & IX Latency</li>
                <li>Water & Cooling Demand</li>
                <li>FEMA DISQUALIFIED Mechanic</li>
                <li>Side-by-Side Comparison + AI Rec</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Link href="/phase-3">Launch Phase 3</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Phase 4 */}
          <Card className="flex flex-col opacity-90">
            <CardHeader>
              <div className="text-muted-foreground text-sm font-semibold mb-2">UPCOMING</div>
              <CardTitle>Phase 4<br />Firm Intel Platform</CardTitle>
              <CardDescription>Proprietary Models & Deploy</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-zinc-600 dark:text-zinc-400 space-y-4">
              <p>
                Enterprise scale deployment. Proprietary ML deal scoring trained on client-specific
                outcomes with a white-label multi-tenant architecture.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
                <li>Custom ML Scoring</li>
                <li>Enterprise White-label</li>
                <li>Multi-Tenant Auth</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
