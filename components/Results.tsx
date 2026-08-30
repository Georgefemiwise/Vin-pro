use client";

import { CheckCircle2, Copy, ExternalLink, Share2 } from "lucide-react";
import { useState } from "react";
import { prettyLabel } from "@/lib/vpic";

const sections: { title: string; keys: string[] }[] = [
  { title: "Overview", keys: ["VIN", "Model Year", "Make", "Manufacturer", "Model", "Series", "Trim", "Vehicle Type", "Plant Country"] },
  { title: "Engine & Performance", keys: ["Engine Number of Cylinders", "Displacement (L)", "Displacement (CC)", "Engine Model", "Fuel Type - Primary", "Fuel Type - Secondary", "Transmission Style", "Transmission Speeds", "Drive Type", "Engine Configuration", "Turbo", "Valve Train Design", "Engine Manufacturer"] },
  { title: "Body & Chassis", keys: ["Body Class", "Doors", "Seats", "Gross Vehicle Weight Rating From", "Gross Vehicle Weight Rating To", "Wheel Base (inches)", "Track Width (inches)", "Curb Weight (pounds)", "Brake System Type", "Bed Type", "Cab Type"] },
  { title: "Safety Features", keys: ["Other Restraint System Info", "Curtain Air Bag Locations", "Seat Belt Type", "Front Air Bag Locations", "Side Air Bag Locations", "Anti-lock Braking System (ABS)", "Electronic Stability Control (ESC)", "Traction Control"] },
  { title: "Manufacturer & Plant", keys: ["Manufacturer", "Plant City", "Plant State", "Plant Country", "Plant Company Name", "Plant Street", "Plant Postal Code"] },
  { title: "Other Specs", keys: ["Series2", "Trim2", "Vehicle Descriptor", "Transmission Style", "Adaptive Cruise Control", "Keyless Ignition", "Daytime Running Light (DRL)", "Entertainment System", "Top Speed (MPH)", "Note", "Error Code", "Error Text"] },
];

function pick(map: Record<string, string>, key: string) {
  return map[key];
}

export default function Results({ data, vin }: { data: Record<string, string>; vin: string }) {
  const [copied, setCopied] = useState(false);

  const title = [data["Model Year"], data["Make"], data["Model"]].filter(Boolean).join(" ") || "Vehicle details";
  const keyFacts = [
    ["Year / Make / Model", title],
    ["Engine", data["Engine Model"] || [data["Engine Number of Cylinders"], data["Displacement (L)"] ? `${data["Displacement (L)"]} L` : ""].filter(Boolean).join(" • ")],
    ["Fuel", data["Fuel Type - Primary"]],
    ["Drive", data["Drive Type"]],
  ].filter(([, value]) => value);

  async function copyVin() {
    await navigator.clipboard.writeText(vin);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  async function share() {
    const text = `VIN Decoder Pro\n${title}\nVIN: ${vin}\n${data["Fuel Type - Primary"] ? `Fuel: ${data["Fuel Type - Primary"]}\n` : ""}${data["Drive Type"] ? `Drive: ${data["Drive Type"]}` : ""}`;
    if (navigator.share) await navigator.share({ title: "VIN Decoder Pro", text });
    else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  }

  return (
    <div className="space-y-5">
      <div className="panel overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400" style={{ borderColor: "var(--border)" }}>
              <CheckCircle2 size={13} /> Decoded by NHTSA vPIC
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="rounded-lg border px-2.5 py-1 font-mono text-xs tracking-wider" style={{ borderColor: "var(--border)" }}>{vin}</code>
              <button onClick={copyVin} className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs muted hover:text-[var(--text)]"><Copy size={13} /> {copied ? "Copied" : "Copy"}</button>
              <button onClick={share} className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs muted hover:text-[var(--text)]"><Share2 size={13} /> Share</button>
            </div>
          </div>
          <a href={`https://vpic.nhtsa.dot.gov/`} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1 text-xs font-medium muted hover:text-[var(--text)]">
            NHTSA vPIC <ExternalLink size={13} />
          </a>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {keyFacts.map(([label, value]) => (
            <div key={label} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--panel-solid) 65%, transparent)" }}>
              <div className="text-[11px] font-medium uppercase tracking-wider muted">{label}</div>
              <div className="mt-1.5 text-sm font-semibold leading-snug">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {sections.map((section) => {
        const entries = section.keys
          .map((key) => [key, pick(data, key)] as const)
          .filter(([, value]) => value);
        if (!entries.length) return null;
        return (
          <section key={section.title} className="panel p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">{section.title}</h3>
              <span className="text-xs muted">{entries.length} fields</span>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              {entries.map(([key, value]) => (
                <div key={key} className="grid grid-cols-[minmax(0,42%)_1fr] gap-4 border-b py-3 last:border-0 sm:px-2" style={{ borderColor: "var(--border)" }}>
                  <dt className="text-xs leading-5 muted">{prettyLabel(key)}</dt>
                  <dd className="break-words text-right text-sm font-medium leading-5">{value}</dd>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}