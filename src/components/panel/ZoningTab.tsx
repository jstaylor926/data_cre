"use client";

import { useRef, useEffect, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useZoningSummary } from "@/hooks/useZoningSummary";

export default function ZoningTab() {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const chatHistory = useAppStore((s) => s.chatHistory);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const zoningSummary = useZoningSummary(selectedAPN);

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when chat grows
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSend = async () => {
    const msg = inputValue.trim();
    if (!msg || !selectedAPN || isSending) return;

    addChatMessage({ role: "user", content: msg });
    setInputValue("");
    setIsSending(true);

    // Build history for API (pairs of user/assistant)
    const history: Array<{ role: "user" | "assistant"; content: string }> = [];
    for (const m of chatHistory) {
      history.push({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      });
    }
    // Current message is the last user turn
    history.push({ role: "user", content: msg });

    try {
      const res = await fetch(`/api/parcel/${encodeURIComponent(selectedAPN)}/zoning-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: history.slice(0, -1) }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      // Add placeholder AI message that we'll update
      addChatMessage({ role: "ai", content: "" });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) aiText += parsed.text;
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      // Replace the placeholder with full text
      // Since we can't update a specific message in the array directly,
      // we use the store's addChatMessage — the placeholder will show empty
      // until the stream is complete. Replace approach: use a local streaming state.
      // Note: In production you'd want a streaming-aware store update.
      // For now, the final message is shown after stream completes.
      // The empty placeholder message has already been added; we now clear
      // chat and re-add everything with the final AI text.

      // Check for ⚠ warning line in response
      const warningMatch = aiText.match(/⚠[^\n]*/);
      const warning = warningMatch ? warningMatch[0] : undefined;
      const cleanContent = aiText.trim();

      // Since addChatMessage appended an empty placeholder, we need to
      // remove it and add the real one. The cleanest way without store
      // surgery is to just let the last message be the real one.
      // We added an empty "" message above — update via a workaround:
      // just append the final message (empty one stays but is invisible).
      // TODO: upgrade store to support streaming updates.
      addChatMessage({ role: "ai", content: cleanContent, warning });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      const isKeyError = msg.includes("ANTHROPIC_API_KEY");
      addChatMessage({
        role: "ai",
        content: isKeyError
          ? "AI chat requires an Anthropic API key. Add ANTHROPIC_API_KEY to .env.local."
          : `Error: ${msg}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!zoningSummary) {
    return (
      <div className="flex flex-col gap-3 animate-pulse p-2">
        <div className="h-16 rounded-lg bg-ink3" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-ink3" />
          ))}
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-violet">
            Zoning AI
          </span>
          <span className="font-mono text-[7px] text-pd-muted">· Grounded in Gwinnett UDO</span>
        </div>

        {chatHistory.length === 0 && (
          <p className="font-mono text-[9px] text-pd-muted italic">
            Ask anything about this zoning — permitted uses, setbacks, CUP requirements…
          </p>
        )}

        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
          {chatHistory.map((msg, i) => {
            // Skip empty placeholder messages from streaming
            if (!msg.content) return null;
            return (
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
                    Zoning AI
                  </div>
                )}
                <p className="font-mono text-[9px] leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                {msg.warning && (
                  <div className="mt-1.5 inline-flex items-center rounded border border-amber/25 bg-amber-dim px-1.5 py-0.5 font-mono text-[8px] text-amber">
                    {msg.warning}
                  </div>
                )}
              </div>
            );
          })}
          {isSending && (
            <div className="self-start flex items-center gap-1.5 rounded-lg bg-ink4 border border-line2 px-3 py-2">
              <Loader2 size={10} className="animate-spin text-violet" />
              <span className="font-mono text-[9px] text-pd-muted">Analyzing ordinance…</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="mt-1 flex gap-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about this zoning…"
            disabled={isSending}
            className="h-8 flex-1 rounded border border-line2 bg-ink px-2.5 font-mono text-[9px] text-text placeholder:text-pd-muted focus:outline-none focus:border-violet disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !inputValue.trim()}
            className="flex h-8 w-8 items-center justify-center rounded bg-violet text-ink disabled:opacity-50"
          >
            {isSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}
