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

export async function decodeVin(vin: string, signal?: AbortSignal): Promise<VpicResponse> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`NHTSA returned HTTP ${response.status}.`);
  const data = (await response.json()) as VpicResponse;
  if (!data.Results?.length) throw new Error("NHTSA returned no vehicle data for this VIN.");
  return data;
}

export function resultToMap(results: VpicVariable[]) {
  return Object.fromEntries(
    results
      .filter((item) => item.Value !== null && String(item.Value).trim() !== "")
      .map((item) => [item.Variable, String(item.Value).trim()])
  ) as Record<string, string>;
}

export function prettyLabel(variable: string) {
  return variable
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\bVin\b/i, "VIN")
    .replace(/\bId\b/g, "ID")
    .trim();
}