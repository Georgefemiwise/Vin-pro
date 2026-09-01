export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

const TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
};

// ISO 3779 / NHTSA VIN check-digit weights.
// Index 0 = VIN position 1.
const WEIGHTS = [
  8,  // 1
  7,  // 2
  6,  // 3
  5,  // 4
  4,  // 5
  3,  // 6
  2,  // 7
  10, // 8
  0,  // 9 - check digit
  9,  // 10
  8,  // 11
  7,  // 12
  6,  // 13
  5,  // 14
  4,  // 15
  3,  // 16
  2,  // 17
] as const;

export function normalizeVin(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function hasAllowedCharacters(vin: string): boolean {
  return VIN_REGEX.test(vin);
}

export function verifyCheckDigit(vin: string): boolean | null {
  const normalized = normalizeVin(vin);

  if (!VIN_REGEX.test(normalized)) {
    return null;
  }

  let sum = 0;

  for (let i = 0; i < 17; i++) {
    const character = normalized[i];

    const value = /\d/.test(character)
      ? Number(character)
      : TRANSLITERATION[character];

    if (value === undefined) {
      return null;
    }

    sum += value * WEIGHTS[i];
  }

  const remainder = sum % 11;

  const expectedCheckDigit =
    remainder === 10
      ? "X"
      : String(remainder);

  return normalized[8] === expectedCheckDigit;
}

export type Validation = {
  valid: boolean;
  complete: boolean;
  checkDigit: boolean | null;
  message: string;
};

export function validateVin(input: string): Validation {
  const vin = normalizeVin(input);

  if (!vin) {
    return {
      valid: false,
      complete: false,
      checkDigit: null,
      message: "Enter a 17-character VIN.",
    };
  }

  if (vin.length < 17) {
    return {
      valid: false,
      complete: false,
      checkDigit: null,
      message: `${17 - vin.length} characters remaining.`,
    };
  }

  if (vin.length > 17) {
    return {
      valid: false,
      complete: false,
      checkDigit: null,
      message: "VINs must contain exactly 17 characters.",
    };
  }

  if (!VIN_REGEX.test(vin)) {
    return {
      valid: false,
      complete: true,
      checkDigit: null,
      message:
        "VIN contains an invalid character. I, O and Q are not allowed.",
    };
  }

  const checkDigit = verifyCheckDigit(vin);

  if (checkDigit === false) {
    return {
      valid: false,
      complete: true,
      checkDigit: false,
      message:
        "Check digit does not match. Please verify the VIN.",
    };
  }

  return {
    valid: true,
    complete: true,
    checkDigit,
    message:
      checkDigit === true
        ? "VIN format and check digit verified."
        : "VIN format verified.",
  };
      }
