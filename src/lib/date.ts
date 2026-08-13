/**
 * Date utility helpers for KarAan
 * Rule: Date in Database is ALWAYS UTC, UI is Jalali/Persian.
 */

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const PERSIAN_DAYS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
  "شنبه",
];

/**
 * Converts a Gregorian date to Jalali (Shamsi) date components
 */
export function gregorianToJalali(gy: number, gm: number, gd: number) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy =
    gy <= 1600
      ? 0
      : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  const jm =
    days < 186
      ? 1 + Math.floor(days / 31)
      : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

export function formatToJalali(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const { jy, jm, jd } = gregorianToJalali(
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate()
  );

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  const dayOfWeekStr = PERSIAN_DAYS[d.getDay()];
  const monthStr = PERSIAN_MONTHS[jm - 1];

  const faDigits = (str: string | number) =>
    String(str).replace(/\d/g, (w) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(w, 10)]);

  return `${dayOfWeekStr} ${faDigits(jd)} ${monthStr} ${faDigits(jy)}، ساعت ${faDigits(hours)}:${faDigits(minutes)}`;
}

export function formatJalaliTimeOnly(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const faDigits = (str: string | number) =>
    String(str).replace(/\d/g, (w) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(w, 10)]);

  return `${faDigits(hours)}:${faDigits(minutes)}`;
}

export function formatDurationPersian(minutes: number): string {
  if (minutes <= 0) return "۰ دقیقه";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const faDigits = (str: string | number) =>
    String(str).replace(/\d/g, (w) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(w, 10)]);

  if (hours === 0) return `${faDigits(mins)} دقیقه`;
  if (mins === 0) return `${faDigits(hours)} ساعت`;
  return `${faDigits(hours)} ساعت و ${faDigits(mins)} دقیقه`;
}

export function toDbUtcDate(dateStrOrObj: Date | string): Date {
  return new Date(dateStrOrObj);
}
