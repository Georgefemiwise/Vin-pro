export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

const transliteration: Record<string, number> = {
  A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8,
  J:1, K:2, L:3, M:4, N:5, P:7, R:9,
  S:2, T:3, U:4, V:5, W:6, X:7, Y:8, Z:9,
};

// FIX: original had 16 elements — missing weight at position 10
// Correct 17-element array: positions 1-17
const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizeVin(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17);
}

export function verifyCheckDigit(vin: string): boolean | null {
  if (!VIN_REGEX.test(vin)) return null;
  // Check digit only defined for North-American VINs (letter at position 1)
  if (!/[A-HJ-NPR-Z]/.test(vin[0])) return null;

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const c = vin[i];
    const val = /\d/.test(c) ? Number(c) : transliteration[c];
    if (val === undefined) return null;
    sum += val * weights[i];
  }
  const rem = sum % 11;
  const expected = rem === 10 ? "X" : String(rem);
  return vin[8] === expected;
}

export type Validation = {
  valid: boolean;
  complete: boolean;
  checkDigit: boolean | null;
  message: string;
};

export function validateVin(input: string): Validation {
  const vin = normalizeVin(input);
  if (!vin)         return { valid: false, complete: false, checkDigit: null, message: "Enter a 17-character VIN." };
  if (vin.length < 17) return { valid: false, complete: false, checkDigit: null, message: `${17 - vin.length} more character${17 - vin.length === 1 ? "" : "s"} needed.` };
  if (!VIN_REGEX.test(vin)) return { valid: false, complete: true, checkDigit: null, message: "Contains an invalid character — I, O and Q are not allowed in VINs." };

  const cd = verifyCheckDigit(vin);
  if (cd === false) return { valid: false, complete: true, checkDigit: cd, message: "Check digit mismatch — double-check the VIN." };

  return {
    valid: true,
    complete: true,
    checkDigit: cd,
    message: cd === true ? "Valid — format and check digit confirmed." : "Valid format.",
  };
}

/** 0-based position → VIN section label */
export function vinSection(i: number): "wmi" | "vds" | "check" | "vis" {
  if (i <= 2)  return "wmi";
  if (i <= 7)  return "vds";
  if (i === 8) return "check";
  return "vis";
}
