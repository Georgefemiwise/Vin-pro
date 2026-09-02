"use client";

import { useState, useCallback } from "react";
import VinInput from "@/components/VinInput";
import ScanModal from "@/components/ScanModal";
import Results from "@/components/Results";
import History, { HistoryItem } from "@/components/History";
import ThemeToggle from "@/components/ThemeToggle";
import { normalizeVin, validateVin } from "@/lib/vin";
import { decodeVin, resultToMap } from "@/lib/vpic";

const HISTORY_KEY = "vin-history";
const EXAMPLES = [
  { vin: "1HGCM82633A004352", label: "2003 Honda Accord" },
  { vin: "WBAJB1C51JB375743", label: "2018 BMW 330i" },
  { vin: "1FTFW1ET5DFC10312", label: "2013 Ford F-150" },
  { vin: "JN1AZ4EH5FM730167", label: "2015 Nissan 370Z" },
];

function loadHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); } catch { return []; }
}

/* Minimal skeleton rows */
function Skeleton() {
  return (
    <div style={{ marginTop: 36 }}>
      {[160, 100, 220, 140, 180, 120, 200, 160].map((w, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="skel" style={{ width: 110 }} />
          <div className="skel" style={{ width: w * 0.6 }} />
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const [vin, setVin] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

  const decode = useCallback(async (raw: string) => {
    const norm = normalizeVin(raw);
    const v = validateVin(norm);
    if (!v.valid) { setError(v.message); return; }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res  = await decodeVin(norm);
      const map  = resultToMap(res.Results);
      if (map["Error Code"] && map["Error Code"] !== "0") {
        throw new Error(map["Error Text"] || "NHTSA could not decode this VIN.");
      }
      setData(map);
      setVin(norm);

      const label = [map["Model Year"], map["Make"], map["Model"]].filter(Boolean).join(" ");
      const entry: HistoryItem = { vin: norm, title: label, timestamp: Date.now() };
      setHistory(prev => {
        const next = [entry, ...prev.filter(h => h.vin !== norm)].slice(0, 10);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleVin(detected: string) {
    setVin(detected);
    setScanOpen(false);
    decode(detected);
  }

  function handleHistorySelect(v: string) {
    setVin(v);
    decode(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "32px 20px 80px" }}>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>VIN Decoder</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: "var(--muted)" }}>powered by NHTSA</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Input */}
      <VinInput
        value={vin}
        onChange={v => { setVin(v); setError(null); }}
        onDecode={() => decode(vin)}
        onOpenScan={() => setScanOpen(true)}
        loading={loading}
      />

      {/* Error */}
      {error && (
        <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", fontSize: 13, color: "#dc2626", lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <Skeleton />}

      {/* Results */}
      {data && !loading && <Results data={data} vin={vin} />}

      {/* Empty state: examples */}
      {!data && !loading && !error && (
        <div style={{ marginTop: 36 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Try an example</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EXAMPLES.map(e => (
              <button
                key={e.vin}
                className="btn-outline"
                style={{ fontSize: 12, padding: "7px 13px" }}
                onClick={() => { setVin(e.vin); decode(e.vin); }}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <History
        items={history}
        onSelect={handleHistorySelect}
        onClear={() => {
          setHistory([]);
          try { localStorage.removeItem(HISTORY_KEY); } catch {}
        }}
      />

      {/* Scan modal */}
      {scanOpen && <ScanModal onVin={handleVin} onClose={() => setScanOpen(false)} />}
    </div>
  );
}
