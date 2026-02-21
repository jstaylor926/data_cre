import Link from "next/link";
import { MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line2 bg-ink3">
        <MapPinOff size={24} className="text-pd-muted" />
      </div>
      <h2 className="font-head text-xl tracking-wider text-bright">
        Page not found
      </h2>
      <p className="max-w-sm font-mono text-[10px] text-pd-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded border border-teal bg-teal-dim px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-teal transition-colors hover:bg-teal/20"
      >
        Back to Home
      </Link>
    </div>
  );
}
