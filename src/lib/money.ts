/**
 * KarAan Money Helper
 * Enforces rule: Money MUST be stored as integers (Rials) and never as floats.
 */

export function rialsToToman(rials: bigint | number): number {
  const amount = typeof rials === "bigint" ? Number(rials) : rials;
  return Math.floor(amount / 10);
}

export function tomanToRials(toman: number): bigint {
  return BigInt(Math.round(toman * 10));
}

export function formatPersianDigits(strOrNum: string | number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(strOrNum).replace(/\d/g, (w) => persianDigits[parseInt(w, 10)]);
}

export function formatMoneyRials(
  rials: bigint | number,
  unit: "RIAL" | "TOMAN" = "TOMAN"
): string {
  const amount = unit === "TOMAN" ? rialsToToman(rials) : Number(rials);
  const formatted = amount.toLocaleString("fa-IR");
  return `${formatted} ${unit === "TOMAN" ? "تومان" : "ریال"}`;
}

export function parsePersianNumber(persianStr: string): number {
  const englishDigits = persianStr
    .replace(/[۰-۹]/g, (w) => String(w.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (w) => String(w.charCodeAt(0) - 1632))
    .replace(/,/g, "")
    .replace(/،/g, "");
  return parseFloat(englishDigits);
}

export function calculateHourlyShiftPay(
  hourlyRateRials: bigint,
  workMinutes: number
): bigint {
  if (workMinutes <= 0) return BigInt(0);
  const payPerMinute = hourlyRateRials / BigInt(60);
  return payPerMinute * BigInt(workMinutes);
}
