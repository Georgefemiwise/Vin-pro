"use client";

import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { useRef } from "react";

export default function ScanButton({ scanning, onFile }: { scanning: boolean; onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Take or upload a VIN photo"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.currentTarget.value = "";
        }}
      />
      <button
        type="button"
        disabled={scanning}
        onClick={() => inputRef.current?.click()}
        className="focus-ring group relative flex min-h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 sm:min-h-14"
        style={{ background: "linear-gradient(135deg, var(--accent-strong), #7c3aed)" }}
      >
        <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
        {scanning ? <Loader2 className="animate-spin" size={21} /> : <Camera size={21} />}
        <span>{scanning ? "Reading VIN…" : "Scan VIN"}</span>
        {!scanning && <ImagePlus size={17} className="opacity-70" />}
      </button>
    </>
  );
}
