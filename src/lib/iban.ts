// IBAN validation (mod-97) + SEPA country check
const SEPA_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT",
  "LV","LI","LT","LU","MT","MC","NL","NO","PL","PT","RO","SM","SK","SI","ES","SE","CH","GB",
]);

export function normalizeIban(input: string): string {
  return (input || "").replace(/\s+/g, "").toUpperCase();
}

export function formatIbanDisplay(iban: string): string {
  return normalizeIban(iban).replace(/(.{4})/g, "$1 ").trim();
}

export function ibanLast4(iban: string): string {
  const n = normalizeIban(iban);
  return n.slice(-4);
}

export function ibanCountry(iban: string): string {
  return normalizeIban(iban).slice(0, 2);
}

export function validateIban(input: string): { valid: boolean; error?: string } {
  const iban = normalizeIban(input);
  if (!iban) return { valid: false, error: "IBAN richiesto" };
  if (iban.length < 15 || iban.length > 34) return { valid: false, error: "Lunghezza IBAN non valida" };
  if (!/^[A-Z]{2}[0-9A-Z]+$/.test(iban)) return { valid: false, error: "Formato IBAN non valido" };
  const country = iban.slice(0, 2);
  if (!SEPA_COUNTRIES.has(country)) return { valid: false, error: `Paese non SEPA: ${country}` };
  // mod-97
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + Number(numeric[i])) % 97;
  }
  if (remainder !== 1) return { valid: false, error: "Checksum IBAN non valido" };
  return { valid: true };
}
