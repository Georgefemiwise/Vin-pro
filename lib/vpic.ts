export type VpicVariable = {
  Variable: string;
  Value: string | null;
  ValueId?: string | null;
};

export type VpicResponse = {
  Count: number;
  Message: string;
  Results: VpicVariable[];
  SearchCriteria?: string;
};

/**
 * FIX: was "DecodeVinValues" which returns a flat object per result
 * (field names like "ModelYear", "EngineCylinders").
 *
 * "DecodeVin" returns the correct Variable/Value pair array where field
 * names match what Results.tsx expects ("Model Year", "Engine Number of
 * Cylinders", "Fuel Type - Primary", etc.).
 */
export async function decodeVin(vin: string, signal?: AbortSignal): Promise<VpicResponse> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`;
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`NHTSA error: HTTP ${res.status}`);
  const json = (await res.json()) as VpicResponse;
  if (!json.Results?.length) throw new Error("No data returned for this VIN.");
  return json;
}

export function resultToMap(results: VpicVariable[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of results) {
    const v = String(item.Value ?? "").trim();
    if (v && v !== "Not Applicable") map[item.Variable] = v;
  }
  return map;
}
