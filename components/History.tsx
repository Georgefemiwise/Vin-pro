"use client";

import { Clock3, Trash2 } from "lucide-react";

export type HistoryItem = { vin: string; title: string; timestamp: number };

export default function History({ items, onSelect, onClear }: { items: HistoryItem[]; onSelect: (vin: string) => void; onClear: () => void }) {
  if (!items.length) return null;
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold"><Clock3 size={16} /> Recent scans</div>
        <button onClick={onClear} className="focus-ring rounded-lg p-1.5 text-xs muted hover:text-red-500" aria-label="Clear VIN history"><Trash2 size={14} /></button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <button key={`${item.vin}-${item.timestamp}`} onClick={() => onSelect(item.vin)} className="focus-ring flex w-full items-center justify-between rounded-xl border p-3 text-left transition hover:-translate-y-0.5" style={{ borderColor: "var(--border)" }}>
            <div className="min-w-0">
              <div className="truncate font-mono text-xs font-semibold tracking-wider">{item.vin}</div>
              <div className="mt-0.5 truncate text-xs muted">{item.title || "Decoded vehicle"}</div>
            </div>
            <span className="ml-3 shrink-0 text-[11px] muted">{new Date(item.timestamp).toLocaleDateString()}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
