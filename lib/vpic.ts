export type VpicVariable = {
  Variable?: string;
  Value?: string | null;
  ValueId?: string | null;
};

export type VpicResponse = {
  Count?: number;
  Message?: string;
  SearchCriteria?: string;
  Results?: VpicVariable[];
};

const VPIC_URL =
  "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues";

export async function decodeVin(
  vin: string,
  signal?: AbortSignal
): Promise<VpicResponse> {
  const cleanVin = vin
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (cleanVin.length !== 17) {
    throw new Error("VIN must contain exactly 17 characters.");
  }

  const url =
    `${VPIC_URL}/${encodeURIComponent(cleanVin)}` +
    "?format=json";

  console.log("[VIN Decoder] Request:", url);

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
      `NHTSA request failed: HTTP ${response.status}`
    );
  }

  const data = await response.json();

  console.log(
    "[VIN Decoder] NHTSA response:",
    data
  );

  if (
    !data ||
    !Array.isArray(data.Results)
  ) {
    throw new Error(
      "NHTSA returned an invalid response."
    );
  }

  if (data.Results.length === 0) {
    throw new Error(
      "NHTSA returned no results for this VIN."
    );
  }

  return data;
}

export function resultToMap(
  results: VpicVariable[]
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const result of results) {
    const variable = result?.Variable;

    if (!variable) {
      continue;
    }

    const value = result.Value;

    if (
      value === null ||
      value === undefined
    ) {
      continue;
    }

    const cleanValue = String(value).trim();

    if (!cleanValue) {
      continue;
    }

    map[variable] = cleanValue;
  }

  console.log(
    "[VIN Decoder] Parsed fields:",
    map
  );

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
