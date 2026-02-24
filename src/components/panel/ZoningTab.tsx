"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Send,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { ENTITLEMENT_COLORS } from "@/lib/constants";
import {
  MOCK_ZONING_EXTRACTIONS,
  calculateNetUsableAcres,
} from "@/lib/zoning-standards";
import type { ZoningExtraction, EntitlementStatus } from "@/lib/types";
import { formatAcres } from "@/lib/formatters";

const STATUS_CONFIG: Record<
  EntitlementStatus,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  BY_RIGHT: { label: "By-Right", icon: CheckCircle2, color: "text-green-400" },
  CUP_REQUIRED: {
    label: "CUP Required",
    icon: AlertTriangle,
    color: "text-amber-400",
  },
  PROHIBITED: { label: "Prohibited", icon: XCircle, color: "text-red-400" },
  UNCLEAR: { label: "Unclear", icon: HelpCircle, color: "text-zinc-400" },
};

export default function ZoningTab() {
  const selectedParcel = useAppStore((s) => s.selectedParcel);
  const [extraction, setExtraction] = useState<ZoningExtraction | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!selectedParcel?.zoning) {
      setExtraction(null);
      return;
    }
    // Use mock data or fetch from Claude API
    const mock =
      MOCK_ZONING_EXTRACTIONS[selectedParcel.zoning] ?? null;
    if (mock) {
      const netAcres = calculateNetUsableAcres(
        selectedParcel.acres ?? 0,
        mock.setbacks,
        mock.maxLotCoverage
      );
      setExtraction({ ...mock, netUsableAcres: netAcres });
    } else {
      setExtraction(null);
    }
  }, [selectedParcel]);

  const handleChat = async () => {
    if (!chatInput.trim() || !selectedParcel?.zoning) return;
    const question = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatLoading(true);

    try {
      const res = await fetch(
        `/api/parcel/${selectedParcel.apn}/zoning-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, zoning_code: selectedParcel.zoning }),
        }
      );
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer ?? "No response" },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Could not reach the AI." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!selectedParcel) return null;

  if (!extraction) {
    return (
      <div className="text-zinc-500 text-xs py-8 text-center">
        No zoning data available for zone &ldquo;{selectedParcel.zoning}&rdquo;
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[extraction.entitlementStatus];
  const StatusIcon = statusConf.icon;

  return (
    <div className="space-y-4 mt-3">
      {/* Traffic Light */}
      <div
        className="rounded-lg p-4 border"
        style={{
          borderColor:
            ENTITLEMENT_COLORS[extraction.entitlementStatus] + "40",
          backgroundColor:
            ENTITLEMENT_COLORS[extraction.entitlementStatus] + "10",
        }}
      >
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${statusConf.color}`} />
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              {statusConf.label}
            </p>
            <p className="text-xs text-zinc-400">
              Zone: {selectedParcel.zoning} &middot; Data Center Entitlement
            </p>
          </div>
        </div>
      </div>

      {/* Zoning Parameters Grid */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          Zoning Parameters
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900 rounded p-2.5 border border-zinc-800">
            <p className="text-[10px] text-zinc-500">Max Height</p>
            <p className="text-sm font-semibold text-zinc-100">
              {extraction.maxHeightFeet ? `${extraction.maxHeightFeet} ft` : "N/A"}
            </p>
          </div>
          <div className="bg-zinc-900 rounded p-2.5 border border-zinc-800">
            <p className="text-[10px] text-zinc-500">Max Lot Coverage</p>
            <p className="text-sm font-semibold text-zinc-100">
              {extraction.maxLotCoverage ? `${extraction.maxLotCoverage}%` : "N/A"}
            </p>
          </div>
          <div className="bg-zinc-900 rounded p-2.5 border border-zinc-800">
            <p className="text-[10px] text-zinc-500">Noise Limit</p>
            <p className="text-sm font-semibold text-zinc-100">
              {extraction.noiseLimitsDBA ? `${extraction.noiseLimitsDBA} dBA` : "N/A"}
            </p>
          </div>
          <div className="bg-zinc-900 rounded p-2.5 border border-zinc-800">
            <p className="text-[10px] text-zinc-500">Net Usable</p>
            <p className="text-sm font-semibold text-zinc-100">
              {extraction.netUsableAcres != null
                ? formatAcres(extraction.netUsableAcres)
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Setbacks */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          Setbacks
        </p>
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-zinc-500">Front:</span>{" "}
            <span className="text-zinc-200">
              {extraction.setbacks.front ? `${extraction.setbacks.front} ft` : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Side:</span>{" "}
            <span className="text-zinc-200">
              {extraction.setbacks.side ? `${extraction.setbacks.side} ft` : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Rear:</span>{" "}
            <span className="text-zinc-200">
              {extraction.setbacks.rear ? `${extraction.setbacks.rear} ft` : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Permitted / Conditional / Prohibited Uses */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          Use Classification
        </p>
        {extraction.permittedUses.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] text-green-400 mb-1">Permitted</p>
            <div className="flex flex-wrap gap-1">
              {extraction.permittedUses.map((u) => (
                <Badge
                  key={u}
                  variant="outline"
                  className="text-[10px] border-green-500/30 text-green-400"
                >
                  {u}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {extraction.conditionalUses.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] text-amber-400 mb-1">Conditional (CUP)</p>
            <div className="flex flex-wrap gap-1">
              {extraction.conditionalUses.map((u) => (
                <Badge
                  key={u}
                  variant="outline"
                  className="text-[10px] border-amber-500/30 text-amber-400"
                >
                  {u}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {extraction.prohibitedUses.length > 0 && (
          <div>
            <p className="text-[10px] text-red-400 mb-1">Prohibited</p>
            <div className="flex flex-wrap gap-1">
              {extraction.prohibitedUses.map((u) => (
                <Badge
                  key={u}
                  variant="outline"
                  className="text-[10px] border-red-500/30 text-red-400"
                >
                  {u}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fatal Flaws */}
      {extraction.fatalFlaws.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            Fatal Flaws
          </p>
          <div className="space-y-1.5">
            {extraction.fatalFlaws.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded p-2 border border-red-500/20"
              >
                <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zoning Chat (Accordion) */}
      <div className="border-t border-zinc-800 pt-3">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 w-full"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${chatOpen ? "rotate-180" : ""}`}
          />
          Ask Follow-up Questions (AI)
        </button>
        {chatOpen && (
          <div className="mt-3 space-y-2">
            {/* Messages */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`text-xs rounded p-2 ${
                    m.role === "user"
                      ? "bg-teal-600/10 text-teal-300 border border-teal-500/20"
                      : "bg-zinc-900 text-zinc-300 border border-zinc-800"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing...
                </div>
              )}
            </div>
            {/* Input */}
            <div className="flex gap-2">
              <Input
                placeholder="e.g., What are the noise limits?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                className="text-xs bg-zinc-900 border-zinc-700"
              />
              <Button
                size="icon"
                className="h-8 w-8 bg-teal-600 hover:bg-teal-700"
                onClick={handleChat}
                disabled={chatLoading}
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
