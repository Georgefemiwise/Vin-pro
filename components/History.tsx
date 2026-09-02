"use client";

export type HistoryItem = { vin: string; title: string; timestamp: number };

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60)   return "just now";
  const m = Math.round(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24)   return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

type Props = {
  items: HistoryItem[];
  onSelect: (vin: string) => void;
  onClear: () => void;
};

export default function History({ items, onSelect, onClear }: Props) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Recent lookups</span>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={onClear}>Clear</button>
      </div>
      {items.map(item => (
        <button key={item.vin} className="history-row" onClick={() => onSelect(item.vin)}>
          <div>
            <div className="history-label">{item.title || "Unknown vehicle"}</div>
            <div className="history-vin">{item.vin}</div>
          </div>
          <div className="history-time">{timeAgo(item.timestamp)}</div>
        </button>
      ))}
    </div>
  );
}
