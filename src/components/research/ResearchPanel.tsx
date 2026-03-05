"use client";

/**
 * ResearchPanel — the main Research Mode interface.
 *
 * A chat-forward panel where users describe properties they're looking for,
 * upload relevant documents (LOIs, site plans, market reports), and get
 * matched to viable parcels displayed on the map.
 *
 * Layout:
 *   ┌─────────────────────────────┐
 *   │  Header (Research Mode)     │
 *   ├─────────────────────────────┤
 *   │  Attachments bar (if any)   │
 *   ├─────────────────────────────┤
 *   │  Chat messages              │
 *   │    - user messages           │
 *   │    - assistant messages      │
 *   │    - inline result cards     │
 *   │                             │
 *   ├─────────────────────────────┤
 *   │  Input bar + upload button  │
 *   └─────────────────────────────┘
 */

import { useCallback, useRef, useState, useEffect } from "react";
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Paperclip,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { ResearchMessage, ResearchParcelResult } from "@/lib/types";
import ResearchAttachments from "./ResearchAttachments";
import ResearchResultCard from "./ResearchResultCard";

interface ResearchPanelProps {
  onFlyTo: (lng: number, lat: number, zoom?: number) => void;
}

export default function ResearchPanel({ onFlyTo }: ResearchPanelProps) {
  const researchSession = useAppStore((s) => s.researchSession);
  const setResearchActive = useAppStore((s) => s.setResearchActive);
  const addResearchMessage = useAppStore((s) => s.addResearchMessage);
  const setResearchCriteria = useAppStore((s) => s.setResearchCriteria);
  const setResearchResults = useAppStore((s) => s.setResearchResults);
  const setResearchLoading = useAppStore((s) => s.setResearchLoading);
  const setResearchError = useAppStore((s) => s.setResearchError);
  const resetResearch = useAppStore((s) => s.resetResearch);
  const selectParcel = useAppStore((s) => s.selectParcel);

  const [inputValue, setInputValue] = useState("");
  const [statusText, setStatusText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [researchSession.messages, statusText]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = inputValue.trim();
      if (!text || researchSession.loading) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Add user message
      const userMsg: ResearchMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      addResearchMessage(userMsg);
      setInputValue("");
      setResearchLoading(true);
      setResearchError(null);
      setStatusText("Thinking...");

      try {
        const conversationHistory = [
          ...researchSession.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user" as const, content: text },
        ];

        const res = await fetch("/api/research/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: conversationHistory,
            attachments: researchSession.attachments.map((a) => ({
              name: a.name,
              extractedText: a.extractedText,
            })),
            criteria: researchSession.criteria,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setResearchError("Request failed. Please try again.");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";
        let messageResults: ResearchParcelResult[] = [];

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const { event, data } = JSON.parse(line.slice(6));
              if (event === "status") setStatusText(data);
              if (event === "criteria") setResearchCriteria(data);
              if (event === "results") {
                messageResults = data;
                setResearchResults(data);
                // Fly to first result
                if (data.length > 0) {
                  onFlyTo(data[0].coordinates[0], data[0].coordinates[1], 13);
                }
              }
              if (event === "message") {
                assistantText += data;
              }
              if (event === "error") setResearchError(data);
              if (event === "done") {
                setResearchLoading(false);
                setStatusText("");
              }
            } catch {
              // skip malformed
            }
          }
        }

        // Add complete assistant message
        if (assistantText) {
          const assistantMsg: ResearchMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: assistantText,
            parcelResults:
              messageResults.length > 0 ? messageResults : undefined,
            timestamp: Date.now(),
          };
          addResearchMessage(assistantMsg);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResearchError("Connection error. Please try again.");
        }
      } finally {
        setResearchLoading(false);
        setStatusText("");
      }
    },
    [
      inputValue,
      researchSession.loading,
      researchSession.messages,
      researchSession.attachments,
      researchSession.criteria,
      addResearchMessage,
      setResearchLoading,
      setResearchError,
      setResearchCriteria,
      setResearchResults,
      onFlyTo,
    ]
  );

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    setResearchActive(false);
  }, [setResearchActive]);

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort();
    resetResearch();
    setResearchActive(true);
    setStatusText("");
  }, [resetResearch, setResearchActive]);

  const handleResultClick = useCallback(
    (result: ResearchParcelResult) => {
      onFlyTo(result.coordinates[0], result.coordinates[1], 16);
      selectParcel(result.apn);
    },
    [onFlyTo, selectParcel]
  );

  const hasMessages = researchSession.messages.length > 0;

  return (
    <div className="absolute right-0 top-0 z-30 flex h-full w-full max-w-[400px] flex-col border-l border-line bg-ink/97 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-teal/20 bg-teal-dim px-4 py-3">
        <Sparkles size={13} className="shrink-0 text-teal" />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal">
            Research Mode
          </div>
          <div className="font-mono text-[7px] text-mid">
            Describe what you&apos;re looking for
          </div>
        </div>
        {hasMessages && (
          <button
            onClick={handleNewChat}
            className="flex h-6 items-center rounded border border-line2 px-2 font-mono text-[8px] uppercase tracking-wider text-mid transition-colors hover:border-teal hover:text-teal"
          >
            New
          </button>
        )}
        <button
          onClick={handleClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-line2 text-mid hover:text-bright transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Attachments bar */}
      <ResearchAttachments />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages && !researchSession.loading ? (
          /* Empty state */
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-teal/20 bg-teal-dim">
                <MessageSquare size={20} className="text-teal" />
              </div>
              <p className="text-center font-mono text-[10px] leading-relaxed text-mid max-w-[280px]">
                Describe the property you&apos;re looking for — type, size,
                location, budget, or use case. Upload documents like LOIs, site
                plans, or market reports to refine the search.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-muted">
                Try something like
              </p>
              {EXAMPLE_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInputValue(q);
                  }}
                  className="w-full rounded border border-line2 bg-ink3 px-3 py-2.5 text-left font-mono text-[9px] text-mid transition-colors hover:border-teal/30 hover:text-bright"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation */
          <div className="flex flex-col gap-1 p-3">
            {researchSession.messages.map((msg) => (
              <div key={msg.id}>
                {/* Message bubble */}
                <div
                  className={`mb-2 rounded-lg px-3 py-2.5 ${
                    msg.role === "user"
                      ? "ml-8 bg-teal-dim border border-teal/20"
                      : "mr-4 bg-ink3 border border-line2"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {msg.role === "assistant" && (
                      <Sparkles size={8} className="text-teal" />
                    )}
                    <span className="font-mono text-[7px] uppercase tracking-wider text-muted">
                      {msg.role === "user" ? "You" : "Atlas Research"}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] leading-relaxed text-text whitespace-pre-wrap">
                    {renderMarkdown(msg.content)}
                  </div>
                </div>

                {/* Inline result cards */}
                {msg.parcelResults && msg.parcelResults.length > 0 && (
                  <div className="mb-3 space-y-1.5 ml-1">
                    <p className="font-mono text-[7px] uppercase tracking-wider text-teal px-1">
                      {msg.parcelResults.length} matching properties
                    </p>
                    {msg.parcelResults.map((result) => (
                      <ResearchResultCard
                        key={result.apn}
                        result={result}
                        onClick={handleResultClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {researchSession.loading && statusText && (
              <div className="flex items-center gap-2 px-3 py-2">
                <Loader2
                  size={10}
                  className="shrink-0 animate-spin text-teal"
                />
                <span className="font-mono text-[8px] text-teal/70 animate-pulse">
                  {statusText}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {researchSession.error && (
        <div className="shrink-0 border-t border-red/20 bg-red/5 px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={10} className="shrink-0 text-red" />
            <span className="font-mono text-[8px] text-red">
              {researchSession.error}
            </span>
          </div>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-line px-3 py-3"
      >
        <div className="flex gap-2">
          <FileUploadButton />
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe the property you need..."
            className="flex-1 rounded border border-line2 bg-ink3 px-3 py-2 font-mono text-[10px] text-bright placeholder:text-muted focus:border-teal/60 focus:outline-none"
            disabled={researchSession.loading}
          />
          <button
            type="submit"
            disabled={researchSession.loading || !inputValue.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-teal/40 bg-teal-dim text-teal transition-colors hover:bg-teal/20 disabled:opacity-40"
          >
            {researchSession.loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── File Upload Button ─────────────────────────────────────────────────────

function FileUploadButton() {
  const addResearchAttachment = useAppStore((s) => s.addResearchAttachment);
  const researchLoading = useAppStore((s) => s.researchSession.loading);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/research/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          console.error("Upload failed:", err.error);
          return;
        }

        const data = await res.json();
        addResearchAttachment({
          id: data.id,
          name: data.name,
          type: data.type,
          size: data.size,
          extractedText: data.extractedText,
        });
      } catch (err) {
        console.error("Upload error:", err);
      } finally {
        setUploading(false);
        // Reset input so same file can be uploaded again
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [addResearchAttachment]
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.csv,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || researchLoading}
        title="Upload document (PDF, DOCX, TXT, CSV, images)"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-line2 text-mid transition-colors hover:border-teal/30 hover:text-teal disabled:opacity-40"
      >
        {uploading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Paperclip size={13} />
        )}
      </button>
    </>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  // Simple bold markdown rendering: **text** → <strong>text</strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-bright font-medium">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

const EXAMPLE_PROMPTS = [
  "Looking for 2-5 acre commercial parcels near I-85 for a distribution center",
  "Mixed-use development site, at least 4 acres, walkable area with good traffic",
  "Industrial land under $1M in Gwinnett County for a warehouse build-out",
  "Retail-zoned parcels near Peachtree Corners, 1-3 acres",
];
