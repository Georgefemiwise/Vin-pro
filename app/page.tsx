"use client";

import { AlertCircle, CarFront, ChevronRight, FileScan, Loader2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ScanButton from "@/components/ScanButton";
import ThemeToggle from "@/components/ThemeToggle";
import VinInput from "@/components/VinInput";
import History, { HistoryItem } from "@/components/History";
import Results from "@/components/Results";
import Skeleton from "@/components/Skeleton";
import { decodeVin, resultToMap } from "@/lib/vpic";
import { normalizeVin, validateVin } from "@/lib/vin";
import { recognizeVin } from "@/lib/ocr";

const HISTORY_KEY = "vin-decoder-pro-history";
const examples = [
  "1HGCM82633A004352",
  "1G1JC5244R7252367",
];
export default function Home() {
  const [vin, setVin] = useState("");
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(stored)) setHistory(stored.slice(0, 10));
    } catch {}
  }, []);

  function saveHistory(next: HistoryItem[]) {
    setHistory(next.slice(0, 10));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next.slice(0, 10)));
  }

  async function handleDecode(target = vin) {
  const normalized = normalizeVin(target);
  const validation = validateVin(normalized);

  setVin(normalized);
  setError("");
  setData(null);

  if (!validation.valid) {
    setError(validation.message);
    return;
  }

  setLoading(true);

  try {
    console.log(
      "[VIN Decoder] Decoding:",
      normalized
    );

    const response = await decodeVin(normalized);

    console.log(
      "[VIN Decoder] Raw response:",
      response
    );

    const map = resultToMap(
      response.Results ?? []
    );

    console.log(
      "[VIN Decoder] Final vehicle data:",
      map
    );

    if (Object.keys(map).length === 0) {
      throw new Error(
        "NHTSA returned a response, but no vehicle fields contained data."
      );
    }

    if (
      map["Error Code"] &&
      map["Error Code"] !== "0"
    ) {
      throw new Error(
        map["Error Text"] ||
          "NHTSA could not decode this VIN."
      );
    }

    setData(map);

    const title = [
      map["Model Year"],
      map["Make"],
      map["Model"],
    ]
      .filter(Boolean)
      .join(" ");

    const newHistoryItem = {
      vin: normalized,
      title: title || "Decoded vehicle",
      timestamp: Date.now(),
    };

    saveHistory([
      newHistoryItem,
      ...history.filter(
        (item) => item.vin !== normalized
      ),
    ]);
  } catch (error) {
    console.error(
      "[VIN Decoder] Decode error:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Unable to decode VIN. Please check your connection and try again."
    );
  } finally {
    setLoading(false);
  }
    }
  async function handleScan(file: File) {
    setScanning(true);
    setOcrProgress(0);
    setError("");
    setData(null);
    try {
      const result = await recognizeVin(file, setOcrProgress);
      setVin(result.vin);
      const validation = validateVin(result.vin);
      if (!validation.valid) throw new Error(`VIN detected (${result.vin}), but its validation failed. Please confirm the photo.`);
      await handleDecode(result.vin);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the VIN from that image.");
    } finally {
      setScanning(false);
      setOcrProgress(0);
    }
  }

  const validation = useMemo(() => validateVin(vin), [vin]);

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: "var(--accent-strong)" }}>
            <CarFront size={19} />
          </div>
          <span className="font-bold tracking-tight">VIN Decoder Pro</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-7 sm:px-6 lg:grid-cols-[390px_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:pt-12">
        <aside>
          <div className="mb-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "var(--border)" }}>
              <Sparkles size={13} style={{ color: "var(--accent)" }} /> Instant vehicle intelligence
            </div>
            <h1 className="text-4xl font-bold tracking-[-.04em] sm:text-5xl">Decode any VIN.<br /><span style={{ color: "var(--accent)" }}>Know the car.</span></h1>
            <p className="mt-4 max-w-md text-sm leading-6 muted">Scan a VIN plate or enter the 17-character number. VIN Decoder Pro reads the vehicle data directly from NHTSA vPIC.</p>
          </div>

          <div className="panel p-4 sm:p-5">
            <ScanButton scanning={scanning} onFile={handleScan} />
            <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-widest muted"><span className="h-px flex-1" style={{ background: "var(--border)" }} />or<span className="h-px flex-1" style={{ background: "var(--border)" }} /></div>
            <VinInput value={vin} onChange={(v) => { setVin(v); setError(""); }} onDecode={() => handleDecode()} />

            {scanning && (
              <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 text-sm font-semibold"><Loader2 size={15} className="animate-spin" /> Reading your VIN photo…</div>
                <div className="mt-2 text-xs muted">Keep the VIN plate flat, sharp and well lit.</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(ocrProgress * 100)}%`, background: "var(--accent)" }} />
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="mt-4 flex gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="mt-0.5 shrink-0" size={17} />
                <div><div className="font-semibold">Couldn’t complete that</div><div className="mt-0.5 text-xs leading-5 opacity-90">{error}</div></div>
              </div>
            )}

            <History items={history} onSelect={(v) => { setVin(v); handleDecode(v); }} onClear={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] muted">
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}><FileScan className="mx-auto mb-1.5" size={16} />OCR scan</div>
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}><ShieldCheck className="mx-auto mb-1.5" size={16} />NHTSA data</div>
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}><RotateCcw className="mx-auto mb-1.5" size={16} />Local history</div>
          </div>
        </aside>

        <section className="min-w-0">
          {loading ? (
            <Skeleton />
          ) : data ? (
            <Results data={data} vin={vin} />
          ) : (
            <div className="panel flex min-h-[520px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--panel-solid)" }}>
                <CarFront size={29} style={{ color: "var(--accent)" }} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Your vehicle details will appear here</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 muted">Start with the camera or enter a VIN manually. For the best scan, point your camera straight at the VIN plate.</p>
              <div className="mt-8 w-full max-w-md">
                <div className="mb-3 text-left text-xs font-semibold uppercase tracking-wider muted">Try an example</div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {examples.map((example) => (
                    <button key={example} onClick={() => { setVin(example); handleDecode(example); }} className="focus-ring flex items-center justify-between rounded-xl border px-3 py-3 text-left font-mono text-[11px] transition hover:-translate-y-0.5" style={{ borderColor: "var(--border)" }}>
                      <span>{example}</span><ChevronRight size={14} className="shrink-0 muted" />
                    </button>
                  ))}
                </div>
              </div>
              {!validation.valid && vin && <p className="mt-5 text-xs muted">Complete the VIN to enable decoding.</p>}
            </div>
          )}
        </section>
      </div>

      <footer className="mx-auto max-w-6xl border-t px-4 py-6 text-center text-xs muted sm:px-6 lg:px-8">
        VIN Decoder Pro is a client-side tool. Vehicle data is supplied by NHTSA vPIC; OCR runs locally in your browser.
      </footer>
    </main>
  );
}
