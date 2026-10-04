import { siteDate, siteTime, siteWeekday } from "@aihot/contracts/time";

/** "28.09" of a calendar date (YYYY-MM-DD). */
export function monthDay(date: string): string {
  return `${Number(date.slice(8, 10))}.${date.slice(5, 7)}`;
}

const SHORT_WEEKDAY: Record<string, string> = { poniedziałek: "pon.", wtorek: "wt.", środa: "śr.", czwartek: "czw.", piątek: "pt.", sobota: "sob.", niedziela: "niedz." };

/** "sob." of a calendar date (YYYY-MM-DD). */
export function weekdayShort(date: string): string {
  return SHORT_WEEKDAY[siteWeekday(date)] ?? siteWeekday(date);
}

export function relativeTime(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "przed chwilą";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min temu`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} godz. temu`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} ${d === 1 ? "dzień" : "dni"} temu`;
  return siteDate(iso);
}

export function fullDateTime(iso: string): string {
  return `${siteDate(iso)} ${siteTime(iso)}`;
}

/** "9月24日 10:51" (Beijing), for lists that span days. */
export function monthDayTime(iso: string): string {
  return `${monthDay(siteDate(iso))} ${siteTime(iso)}`;
}

export function sourceInitial(name: string): string {
  const s = name.replace(/^[^\p{L}\p{N}]+/u, "");
  return (s[0] ?? "A").toUpperCase();
}
