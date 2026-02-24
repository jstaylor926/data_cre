"use client";

export default function MapHUD() {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex gap-3 text-[10px] font-mono text-zinc-500">
      <span>Gwinnett County, GA</span>
      <span>|</span>
      <span>Pocket Developer v0.2</span>
    </div>
  );
}
