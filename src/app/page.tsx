"use client";

import Link from "next/link";
import { 
  Map as MapIcon, 
  Brain, 
  Zap, 
  Briefcase, 
  ChevronRight, 
  CheckCircle2,
  Layers,
  Search,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-ink text-text selection:bg-pd-teal selection:text-ink">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-ink/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-pd-teal text-ink font-bold">A</div>
          <span className="font-head text-xl tracking-wider text-bright">ATLAS CRE</span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-pd-muted hover:text-pd-teal transition-colors">Features</a>
          <a href="#pricing" className="text-sm font-medium text-pd-muted hover:text-pd-teal transition-colors">Pricing</a>
          <Link href="/map" className="text-sm font-semibold text-pd-teal hover:text-pd-teal/80 transition-colors">Sign In</Link>
          <Button asChild className="bg-pd-teal hover:bg-pd-teal/90 text-ink font-bold px-6">
            <Link href="/map">LAUNCH APP</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-6 py-24 text-center md:py-40">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-pd-teal/5 blur-[120px]" />
          <div className="absolute top-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-pd-amber/5 blur-[100px]" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-pd-teal/30 bg-pd-teal/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-pd-teal mb-8">
          <Zap size={14} className="fill-pd-teal" />
          Next-Gen CRE Intelligence
        </div>
        
        <h1 className="max-w-4xl font-head text-6xl leading-[0.9] tracking-tight text-bright md:text-8xl lg:text-9xl">
          THE FUTURE OF <br />
          <span className="text-pd-teal">SITE SELECTION</span>
        </h1>
        
        <p className="mt-8 max-w-2xl font-barlow text-lg text-pd-muted md:text-xl">
          Atlas CRE transforms raw parcel data into actionable development intelligence. 
          Analyze zoning, infrastructure, and financial potential in real-time.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="h-14 bg-pd-teal hover:bg-pd-teal/90 text-ink font-bold px-10 text-lg group">
            <Link href="/map" className="flex items-center gap-2">
              START MAPPING
              <ChevronRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-14 border-line2 bg-ink2 hover:bg-ink3 text-bright px-10 text-lg">
            VIEW DEMO
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 py-24 bg-ink2/50 border-y border-line">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="font-head text-4xl text-bright tracking-wider uppercase mb-4">Core Intelligence</h2>
            <div className="h-1 w-20 bg-pd-teal mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<MapIcon className="text-pd-teal" />}
              title="Advanced Mapping"
              description="High-fidelity parcel maps with ownership, zoning, and tax data for Gwinnett County."
            />
            <FeatureCard 
              icon={<Brain className="text-pd-teal" />}
              title="AI Zoning"
              description="Natural language interpretation of complex zoning ordinances powered by Claude AI."
            />
            <FeatureCard 
              icon={<Zap className="text-pd-amber" />}
              title="Infrastructure"
              description="Real-time infrastructure scoring for power, fiber, and water capacity."
            />
            <FeatureCard 
              icon={<Briefcase className="text-pd-teal" />}
              title="Firm Intel"
              description="Proprietary deal lifecycle management and scoring trained on firm-wide outcomes."
            />
          </div>
        </div>
      </section>

      {/* Pricing/Tiers */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="font-head text-4xl text-bright tracking-wider uppercase mb-4">Membership Tiers</h2>
            <p className="text-pd-muted font-barlow max-w-xl mx-auto">Select the intelligence level that matches your development workflow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard 
              tier="Free"
              price="$0"
              description="Perfect for basic parcel research and scouting."
              features={["Standard Parcel Mapping", "Basic Ownership Data", "Public Zoning Info", "Save up to 5 properties"]}
            />
            <PricingCard 
              tier="Pro"
              price="$199"
              description="The standard for professional land developers."
              isPopular
              features={["All Free features", "AI Zoning Interpretation", "Automated Comps", "Unlimited Saved Properties", "Infrastructure Layers"]}
            />
            <PricingCard 
              tier="Enterprise"
              price="Custom"
              description="Proprietary intelligence for institutional firms."
              features={["All Pro features", "Firm Intel Dashboard", "Custom ML Scoring", "Multi-tenant CRM", "White-label Support"]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-line bg-ink px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-pd-teal text-ink font-bold text-[10px]">A</div>
            <span className="font-head text-lg tracking-wider text-bright">ATLAS CRE</span>
          </div>
          <div className="flex gap-8 font-mono text-[10px] text-pd-muted uppercase tracking-widest">
            <a href="#" className="hover:text-pd-teal">Privacy Policy</a>
            <a href="#" className="hover:text-pd-teal">Terms of Service</a>
            <a href="#" className="hover:text-pd-teal">Contact Support</a>
          </div>
          <p className="font-barlow text-xs text-pd-muted">
            &copy; 2026 DeThomas Development. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group relative flex flex-col p-8 rounded-xl bg-ink2 border border-line2 hover:border-pd-teal/50 transition-all hover:-translate-y-1">
      <div className="h-12 w-12 rounded-lg bg-ink3 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-head text-2xl text-bright mb-3 tracking-wide">{title}</h3>
      <p className="text-sm text-pd-muted font-barlow leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ tier, price, description, features, isPopular }: { tier: string, price: string, description: string, features: string[], isPopular?: boolean }) {
  return (
    <div className={`relative flex flex-col p-8 rounded-2xl border ${isPopular ? 'border-pd-teal bg-ink2 shadow-[0_0_40px_-15px_rgba(0,212,200,0.3)]' : 'border-line2 bg-ink2/50'} `}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pd-teal text-ink font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">
          Most Popular
        </div>
      )}
      <div className="mb-8">
        <h3 className="font-head text-2xl text-bright tracking-wide mb-1">{tier}</h3>
        <p className="text-xs text-pd-muted font-barlow h-10">{description}</p>
        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-4xl font-head text-bright">{price}</span>
          {price !== 'Custom' && <span className="text-pd-muted text-sm">/mo</span>}
        </div>
      </div>
      
      <div className="space-y-4 mb-10 flex-1">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-pd-teal shrink-0 mt-0.5" />
            <span className="text-xs text-text font-barlow">{feature}</span>
          </div>
        ))}
      </div>

      <Button asChild className={`w-full font-bold h-12 ${isPopular ? 'bg-pd-teal hover:bg-pd-teal/90 text-ink' : 'bg-ink3 hover:bg-ink4 border border-line2 text-bright'}`}>
        <Link href="/map">GET STARTED</Link>
      </Button>
    </div>
  );
}
