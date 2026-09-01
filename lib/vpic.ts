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

const VPIC_BASE_URL =
  "https://vpic.nhtsa.dot.gov/api/vehicles";

export async function decodeVin(
  vin: string,
  signal?: AbortSignal
): Promise<VpicResponse> {
  const normalizedVin = vin
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const url =
    `${VPIC_BASE_URL}/DecodeVinValues/` +
    `${encodeURIComponent(normalizedVin)}` +
    `?format=json`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `NHTSA returned HTTP ${response.status}.`
    );
  }

  const data: unknown = await response.json();

  if (!isVpicResponse(data)) {
    throw new Error(
      "NHTSA returned an unexpected response format."
    );
  }

  if (!data.Results.length) {
    throw new Error(
      "NHTSA returned no vehicle data for this VIN."
    );
  }

  return data;
}

function isVpicResponse(
  data: unknown
): data is VpicResponse {
  if (!data || typeof data !== "object") {
    return false;
  }

  const value = data as Record<string, unknown>;

  return (
    typeof value.Count === "number" &&
    typeof value.Message === "string" &&
    Array.isArray(value.Results)
  );
}

export function resultToMap(
  results: VpicVariable[]
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const item of results) {
    if (
      !item ||
      typeof item.Variable !== "string"
    ) {
      continue;
    }

    if (
      item.Value === null ||
      item.Value === undefined
    ) {
      continue;
    }

    const value = String(item.Value).trim();

    if (!value) {
      continue;
    }

    map[item.Variable] = value;
  }

  return map;
}

export function prettyLabel(
  variable: string
): string {
  return variable
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\bVin\b/gi, "VIN")
    .replace(/\bId\b/g, "ID")
    .trim();
    }
