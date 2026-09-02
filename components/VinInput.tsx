"use client";
import { validateVin, vinSection, normalizeVin } from "@/lib/vin";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onDecode: () => void;
  onOpenScan: () => void;
  loading: boolean;
};

const SECTION_LABEL: Record<string, string> = {
  wmi: "WMI (1–3) · manufacturer",
  vds: "VDS (4–8) · descriptor",
  check: "check digit (9)",
  vis: "VIS (10–17) · serial",
};

export default function VinInput({ value, onChange, onDecode, onOpenScan, loading }: Props) {
  const v = validateVin(value);
  const borderClass = value.length === 0 ? "" : v.valid ? "valid" : value.length === 17 ? "invalid" : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(normalizeVin(e.target.value));
  }

  return (
    <div>
      {/* Input row */}
      <div style={{ position: "relative" }}>
        <input
          className={`vin-input ${borderClass}`}
          type="text"
          maxLength={17}
          value={value}
          onChange={handleChange}
          onKeyDown={e => e.key === "Enter" && onDecode()}
          placeholder="Enter VIN number"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="characters"
          aria-label="VIN number"
        />
        {/* character counter */}
        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            fontWeight: 600,
            color: v.valid ? "var(--green)" : value.length === 17 ? "var(--red)" : "var(--muted)",
          }}
        >
          {value.length}/17{v.valid ? " ✓" : ""}
        </span>
      </div>

      {/* Validation message */}
      {value.length > 0 && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: v.valid ? "var(--green)" : value.length === 17 ? "var(--red)" : "var(--muted)",
          }}
        >
          {v.message}
        </div>
      )}

      {/* VIN breakdown — only when 17 valid chars */}
      {value.length === 17 && v.valid && (
        <div>
          <div className="vin-breakdown">
            {value.split("").map((char, i) => {
              const sec = vinSection(i);
              return (
                <span key={i} className={`vin-char ${sec}`} title={`Pos ${i + 1} · ${SECTION_LABEL[sec]}`}>
                  {char}
                </span>
              );
            })}
          </div>
          <div className="vin-legend">
            <span><span style={{ color: "#6366f1" }}>■</span> WMI</span>
            <span><span style={{ color: "#16a34a" }}>■</span> VDS</span>
            <span><span style={{ color: "#d97706" }}>■</span> Check</span>
            <span><span style={{ color: "#db2777" }}>■</span> VIS</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          className="btn-primary"
          style={{ flex: 1 }}
          disabled={loading || !v.valid}
          onClick={onDecode}
        >
          {loading ? "Decoding…" : "Decode VIN"}
        </button>
        <button
          className="btn-outline"
          disabled={loading}
          onClick={onOpenScan}
          title="Scan or upload a VIN photo"
        >
          📷 Scan / Upload
        </button>
      </div>
    </div>
  );
}
