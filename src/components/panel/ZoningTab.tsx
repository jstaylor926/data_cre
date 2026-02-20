"use client";

import { useAppStore } from "@/store/useAppStore";
import { MOCK_ZONING_SUMMARY } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { Send } from "lucide-react";

export default function ZoningTab() {
  const zoningSummary = useAppStore((s) => s.zoningSummary);
  const setZoningSummary = useAppStore((s) => s.setZoningSummary);
  const chatHistory = useAppStore((s) => s.chatHistory);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!zoningSummary) setZoningSummary(MOCK_ZONING_SUMMARY);
  }, [zoningSummary, setZoningSummary]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    addChatMessage({ role: "user", content: inputValue });
    setInputValue("");
    
    // Simulate AI response
    setTimeout(() => {
      addChatMessage({
        role: "ai",
        content: "Yes — drive-through restaurants are a permitted by-right use in C-2. No variance or CUP required. You'll need to meet the 30-ft front setback and satisfy the parking ratio of 1 space per 3 seats plus stacking lane requirements.",
        warning: "⚠ Stacking lane min. 150 ft per Gwinnett §505.3"
      });
    }, 1000);
  };

  if (!zoningSummary) return null;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Zone Hero */}
      <div className="rounded-lg border border-line2 bg-ink3 p-3">
        <div className="font-head text-3xl tracking-wider text-teal leading-none mb-0.5">
          {zoningSummary.code}
        </div>
        <div className="font-body text-[12px] text-mid mb-3">
          {zoningSummary.name}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {zoningSummary.flags.map((flag, i) => (
            <span
              key={i}
              className={`rounded border px-2 py-0.5 font-mono text-[8px] tracking-wide ${
                flag.type === "permitted" ? "bg-green-dim text-green border-green/20" :
                flag.type === "conditional" ? "bg-amber-dim text-amber border-amber/20" :
                "bg-red-dim text-red border-red/20"
              }`}
            >
              {flag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Standards */}
      <div>
        <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.12em] text-pd-muted">
          Key Standards
        </div>
        <div className="space-y-1.5">
          {zoningSummary.standards.map((std, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-text">
              <div className="mt-1.5 h-1 w-1 rounded-full bg-mid flex-shrink-0" />
              <span>{std.label}: {std.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Chat */}
      <div className="flex flex-col gap-2.5 rounded-lg border border-line2 bg-ink3 p-3 mt-2">
        <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[90%] rounded-lg p-2.5 ${
                msg.role === "user"
                  ? "self-end bg-violet-dim border border-violet/25 text-violet"
                  : "self-start bg-ink4 border border-line2 text-text"
              }`}
            >
              {msg.role === "ai" && (
                <div className="mb-1 font-mono text-[8px] uppercase tracking-wider text-violet">
                  Zoning AI · Grounded in Ordinance
                </div>
              )}
              <p className="font-mono text-[9px] leading-relaxed">
                {msg.content}
              </p>
              {msg.warning && (
                <div className="mt-1.5 inline-flex items-center rounded border border-amber/25 bg-amber-dim px-1.5 py-0.5 font-mono text-[8px] text-amber">
                  {msg.warning}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-2 flex gap-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about this zoning…"
            className="h-8 flex-1 rounded border border-line2 bg-ink px-2.5 font-mono text-[9px] text-text placeholder:text-pd-muted focus:outline-none focus:border-violet"
          />
          <button
            onClick={handleSend}
            className="flex h-8 w-8 items-center justify-center rounded bg-violet text-ink"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
