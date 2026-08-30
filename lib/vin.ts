export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

const transliteration: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const weights = [8,7,6,5,4,3,2,10,0,8,7,6,5,4,3,2];

export function normalizeVin(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hasAllowedCharacters(vin: string) {
  return VIN_REGEX.test(vin);
}

export function verifyCheckDigit(vin: string): boolean | null {
  if (!VIN_REGEX.test(vin)) return null;
  const yearRegion = vin[0];
  // The check digit rule is defined for North-American VINs. We still permit
  // all valid VINs when the region does not use a check digit convention.
  if (!/[A-HJ-NPR-Z]/.test(yearRegion)) return null;

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = vin[i];
    const value = /\d/.test(char) ? Number(char) : transliteration[char];
    sum += value * weights[i];
  }
  const remainder = sum % 11;
  const expected = remainder === 10 ? "X" : String(remainder);
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
  if (!vin) return { valid: false, complete: false, checkDigit: null, message: "Enter a 17-character VIN." };
  if (vin.length < 17) return { valid: false, complete: false, checkDigit: null, message: `${17 - vin.length} characters remaining.` };
  if (vin.length > 17) return { valid: false, complete: false, checkDigit: null, message: "VINs must contain exactly 17 characters." };
  if (!VIN_REGEX.test(vin)) return { valid: false, complete: true, checkDigit: null, message: "VIN contains an invalid character. I, O and Q are not allowed." };

  const checkDigit = verifyCheckDigit(vin);
  if (checkDigit === false) {
    return { valid: false, complete: true, checkDigit, message: "Check digit does not match. Please verify the VIN." };
  }
  return { valid: true, complete: true, checkDigit, message: checkDigit === true ? "VIN format and check digit verified." : "VIN format verified." };
}

export function yearFromVin(vin: string) {
  const code = vin[9];
  const map: Record<string, number> = {
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
    J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
    T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
    1: 2001, 2: 2002, 3: 2003, 4: 2004, 5: 2005, 6: 2006, 7: 2007, 8: 2008, 9: 2009,
  };
  return map[code] ?? null;
}