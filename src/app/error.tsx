"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red/20 bg-red/10">
        <AlertTriangle size={24} className="text-red" />
      </div>
      <h2 className="font-head text-xl tracking-wider text-bright">
        Something went wrong
      </h2>
      <p className="max-w-sm font-mono text-[10px] text-pd-muted">
        An unexpected error occurred. Try refreshing or click below to retry.
      </p>
      <button
        onClick={reset}
        className="mt-2 flex items-center gap-2 rounded border border-teal bg-teal-dim px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-teal transition-colors hover:bg-teal/20"
      >
        <RotateCcw size={12} />
        Try again
      </button>
    </div>
  );
}
