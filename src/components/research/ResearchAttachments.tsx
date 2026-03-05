"use client";

import { X, FileText, FileImage, FileSpreadsheet, File } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/**
 * ResearchAttachments — shows uploaded files as removable chips
 * above the chat area. Displayed only when attachments exist.
 */
export default function ResearchAttachments() {
  const attachments = useAppStore((s) => s.researchSession.attachments);
  const removeResearchAttachment = useAppStore(
    (s) => s.removeResearchAttachment
  );

  if (attachments.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-line/50 bg-ink2/50 px-3 py-2">
      <div className="mb-1 font-mono text-[7px] uppercase tracking-[0.14em] text-muted">
        Uploaded documents ({attachments.length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {attachments.map((att) => {
          const Icon = getFileIcon(att.type);
          const sizeLabel = formatFileSize(att.size);

          return (
            <div
              key={att.id}
              className="group flex items-center gap-1.5 rounded border border-line2 bg-ink3 px-2 py-1 transition-colors hover:border-teal/30"
            >
              <Icon size={10} className="shrink-0 text-teal" />
              <span className="max-w-[120px] truncate font-mono text-[8px] text-text">
                {att.name}
              </span>
              <span className="font-mono text-[7px] text-muted">
                {sizeLabel}
              </span>
              <button
                onClick={() => removeResearchAttachment(att.id)}
                className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red/20 hover:text-red"
              >
                <X size={8} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getFileIcon(type: string) {
  if (type === "application/pdf") return FileText;
  if (type.startsWith("image/")) return FileImage;
  if (type === "text/csv") return FileSpreadsheet;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
