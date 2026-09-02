"use client";
import { useState } from "react";

/* ── All sections with correct DecodeVin Variable names ───────────────── */
const SECTIONS = [
  {
    title: "Vehicle",
    rows: [
      ["Model Year",   "Year"],
      ["Make",         "Make"],
      ["Model",        "Model"],
      ["Trim",         "Trim"],
      ["Series",       "Series"],
      ["Body Class",   "Body style"],
      ["Vehicle Type", "Vehicle type"],
      ["Doors",        "Doors"],
      ["Number of Seats",  "Seats"],
      ["Number of Wheels", "Wheels"],
      ["Windows",      "Windows"],
    ],
  },
  {
    title: "Engine & drivetrain",
    rows: [
      ["Engine Model",                          "Engine model"],
      ["Engine Number of Cylinders",            "Cylinders"],
      ["Displacement (L)",                      "Displacement (L)"],
      ["Displacement (CC)",                     "Displacement (cc)"],
      ["Displacement (CI)",                     "Displacement (ci)"],
      ["Engine Horsepower",                     "Horsepower"],
      ["Engine Power (kW)",                     "Power (kW)"],
      ["Engine Configuration",                  "Configuration"],
      ["Engine Manufacturer",                   "Engine maker"],
      ["Valve Train Design",                    "Valve train"],
      ["Cooling Type",                          "Cooling"],
      ["Engine Stroke Cycles",                  "Stroke cycles"],
      ["Fuel Type - Primary",                   "Fuel type"],
      ["Fuel Type - Secondary",                 "Secondary fuel"],
      ["Fuel Delivery / Fuel Injection Type",   "Fuel injection"],
      ["Drive Type",                            "Drive type"],
      ["Transmission Style",                    "Transmission"],
      ["Transmission Speeds",                   "Gears"],
      ["Turbo",                                 "Turbo"],
      ["Other Engine Info",                     "Other engine info"],
    ],
  },
  {
    title: "Electric & hybrid",
    rows: [
      ["Electrification Level",      "Electrification level"],
      ["EV Drive Unit",              "EV drive unit"],
      ["Battery (kWh) From",         "Battery capacity (kWh)"],
      ["Battery (kWh) To",           "Battery capacity to"],
      ["Battery Type",               "Battery type"],
      ["Battery Info",               "Battery info"],
      ["Charger Level",              "Charger level"],
      ["Charger Power (kW)",         "Charger power (kW)"],
    ],
  },
  {
    title: "Dimensions & chassis",
    rows: [
      ["Gross Vehicle Weight Rating From", "GVWR from"],
      ["Gross Vehicle Weight Rating To",   "GVWR to"],
      ["Curb Weight (pounds)",             "Curb weight (lbs)"],
      ["Wheel Base (inches) From",         "Wheelbase (in)"],
      ["Wheel Base (inches) To",           "Wheelbase to (in)"],
      ["Wheel Size Front (inches)",        "Front wheel size"],
      ["Wheel Size Rear (inches)",         "Rear wheel size"],
      ["Axles",                            "Axles"],
      ["Axle Configuration",               "Axle config"],
      ["Brake System Type",                "Brake type"],
      ["Brake System Description",         "Brake description"],
      ["Steering Location",                "Steering"],
      ["Bed Type",                         "Bed type"],
      ["Bed Length (inches)",              "Bed length (in)"],
      ["Cab Type",                         "Cab type"],
    ],
  },
  {
    title: "Safety",
    rows: [
      ["Anti-lock Braking System (ABS)",                          "ABS"],
      ["Electronic Stability Control (ESC)",                      "ESC"],
      ["Traction Control",                                        "Traction control"],
      ["Forward Collision Warning (FCW)",                         "Forward collision warning"],
      ["Lane Departure Warning (LDW)",                            "Lane departure warning"],
      ["Lane Keeping Assistance (LKA) System",                    "Lane keeping assist"],
      ["Blind Spot Warning (BSW)",                                "Blind spot monitor"],
      ["Backup Camera",                                           "Backup camera"],
      ["Park Assist",                                             "Park assist"],
      ["Adaptive Cruise Control (ACC)",                           "Adaptive cruise"],
      ["Daytime Running Light (DRL)",                             "Daytime running lights"],
      ["Headlamp Light Source",                                   "Headlamp source"],
      ["Semiautomatic Headlamp Beam Switching",                   "Auto beam switching"],
      ["Adaptive Headlights",                                     "Adaptive headlights"],
      ["Tire Pressure Monitoring System (TPMS) Type",             "TPMS"],
      ["Automatic Pedestrian Alerting Sound (for Hybrid and EV only)", "Pedestrian alert sound"],
      ["Event Data Recorder (EDR)",                               "EDR"],
      ["Keyless Ignition",                                        "Keyless ignition"],
      ["Top Speed (MPH)",                                         "Top speed (mph)"],
      ["Active Safety System Note",                               "Safety note"],
    ],
  },
  {
    title: "Airbags & restraints",
    rows: [
      ["Front Air Bag Locations",       "Front airbags"],
      ["Side Air Bag Locations",        "Side airbags"],
      ["Knee Air Bag Locations",        "Knee airbags"],
      ["Curtain Air Bag Locations",     "Curtain airbags"],
      ["Seat Cushion Air Bag Locations","Seat cushion airbags"],
      ["Seat Belts Type",               "Seatbelt type"],
      ["Pretensioner",                  "Pretensioner"],
      ["Other Restraint System Info",   "Other restraints"],
    ],
  },
  {
    title: "Manufacturer & plant",
    rows: [
      ["Manufacturer",        "Manufacturer"],
      ["Plant City",          "Plant city"],
      ["Plant State",         "Plant state"],
      ["Plant Country",       "Plant country"],
      ["Plant Company Name",  "Plant company"],
      ["Destination Market",  "Destination market"],
    ],
  },
  {
    title: "Other",
    rows: [
      ["Entertainment System", "Entertainment"],
      ["Note",                 "Note"],
      ["Series2",              "Series 2"],
      ["Trim2",                "Trim 2"],
      ["Error Code",           "API error code"],
      ["Error Text",           "API error text"],
    ],
  },
] as const;

export default function Results({ data, vin }: { data: Record<string, string>; vin: string }) {
  const [copied, setCopied] = useState(false);

  const year  = data["Model Year"] ?? "";
  const make  = data["Make"]       ?? "";
  const model = data["Model"]      ?? "";
  const trim  = data["Trim"]       ?? "";
  const title = [year, make, model, trim].filter(Boolean).join(" ") || "Vehicle";

  async function copyVin() {
    try { await navigator.clipboard.writeText(vin); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div style={{ marginTop: 36 }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 12, color: "var(--muted)", letterSpacing: ".08em" }}>
            {vin}
          </span>
          <button className="btn-ghost" style={{ padding: "2px 8px", fontSize: 12 }} onClick={copyVin}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button
            className="btn-ghost"
            style={{ padding: "2px 8px", fontSize: 12 }}
            onClick={() => window.print()}
          >
            Print
          </button>
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => {
        const rows = (section.rows as readonly (readonly [string, string])[])
          .map(([key, label]) => ({ key, label, value: data[key] }))
          .filter(r => r.value && r.value.trim() !== "");

        if (rows.length === 0) return null;

        return (
          <div key={section.title} className="results-section">
            <div className="results-section-title">{section.title}</div>
            {rows.map(r => (
              <div key={r.key} className="results-row">
                <span className="results-row-label">{r.label}</span>
                <span className="results-row-value">{r.value}</span>
              </div>
            ))}
          </div>
        );
      })}

      {/* Data source note */}
      <div style={{ marginTop: 16, fontSize: 11, color: "var(--muted)" }}>
        Data sourced from{" "}
        <a href="https://vpic.nhtsa.dot.gov/" target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
          NHTSA vPIC
        </a>
        . Empty fields are not returned by the API for this vehicle.
      </div>
    </div>
  );
}
