"use client";

import { Check, CircleAlert, Copy, Search } from "lucide-react";
import { useState } from "react";
import { normalizeVin, validateVin } from "@/lib/vin";

export default function VinInput({
  value,
  onChange,
  onDecode,
}: {
  value: string;
  onChange: (value: string) => void;
  onDecode: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const validation = validateVin(value);

  async function copy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="vin" className="text-sm font-semibold">VIN</label>
        <span className="text-xs tabular-nums muted">{normalizeVin(value).length}/17</span>
      </div>
      <div className="relative">
        <input
          id="vin"
          value={value}
          maxLength={20}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && validation.valid) onDecode();
          }}
          placeholder="e.g. 1HGCM82633A004352"
          className="focus-ring h-16 w-full rounded-2xl border bg-white px-4 pr-24 font-mono text-[15px] tracking-[.13em] outline-none transition placeholder:font-sans placeholder:tracking-normal dark:bg-white/[.035]"
          style={{ borderColor: validation.complete && !validation.valid ? "#ef4444" : "var(--border)" }}
          aria-describedby="vin-help"
        />
        <button type="button" onClick={copy} disabled={!value} className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 muted hover:text-[var(--text)] disabled:opacity-30" aria-label="Copy VIN">
          {copied ? <Check size={17} /> : <Copy size={17} />}
        </button>
      </div>
      <div id="vin-help" className="mt-2 flex min-h-5 items-center gap-1.5 text-xs">
        {validation.complete && !validation.valid ? <CircleAlert size={14} className="text-red-500" /> : validation.valid ? <Check size={14} className="text-emerald-500" /> : null}
        <span className={validation.complete && !validation.valid ? "text-red-500" : validation.valid ? "text-emerald-600 dark:text-emerald-400" : "muted"}>{validation.message}</span>
      </div>
      <button
        type="button"
        disabled={!validation.valid}
        onClick={onDecode}
        className="focus-ring mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border font-semibold transition hover:bg-black/[.03] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/[.04]"
        style={{ borderColor: "var(--border)" }}
      >
        <Search size={17} /> Decode VIN
      </button>
    </div>
  );
}
