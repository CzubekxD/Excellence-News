// Site-local calendar helpers shared by web and backend. The site keeps time in SITE_TIME_ZONE
// (Europe/Warsaw: UTC+1 in winter, UTC+2 in summer); every date, schedule and label reads it from here.

export const SITE_TIME_ZONE = "Europe/Warsaw";

const PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: SITE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Wall clock of the instant in the site's zone. */
function wallClock(ms: number): { date: string; time: string; offsetMs: number } {
  const p: Record<string, string> = {};
  for (const part of PARTS.formatToParts(new Date(ms))) p[part.type] = part.value;
  const date = `${p.year}-${p.month}-${p.day}`;
  const time = `${p.hour}:${p.minute}`;
  const asUtc = Date.parse(`${date}T${time}:${p.second}Z`);
  return { date, time, offsetMs: asUtc - Math.floor(ms / 1000) * 1000 };
}

/** YYYY-MM-DD of the instant in the site's time zone. */
export function siteDate(instant: Date | string | number): string {
  return wallClock(new Date(instant).getTime()).date;
}

/** HH:mm of the instant in the site's time zone. */
export function siteTime(instant: Date | string | number): string {
  return wallClock(new Date(instant).getTime()).time;
}

/** ISO 8601 with the site's UTC offset, to the second: "2026-10-04T16:10:05+02:00". */
export function siteIso(instant: Date | string | number): string {
  const ms = new Date(instant).getTime();
  const { date, offsetMs } = wallClock(ms);
  const seconds = new Date(Math.floor(ms / 1000) * 1000 + offsetMs).toISOString().slice(11, 19);
  const minutes = Math.round(offsetMs / 60000);
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${date}T${seconds}${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/** UTC instant of an HH:mm site-local time on the given calendar day (the later one when DST repeats it). */
export function siteAt(date: string, time: string): Date {
  const naive = Date.parse(`${date}T${time}:00Z`);
  // Two passes settle the offset on both sides of a DST change.
  let guess = naive - wallClock(naive).offsetMs;
  guess = naive - wallClock(guess).offsetMs;
  return new Date(guess);
}

/** UTC instant of 00:00 site-local time on the given calendar day. */
export function siteMidnight(date: string): Date {
  return siteAt(date, "00:00");
}

export function addDays(date: string, days: number): string {
  const t = Date.parse(`${date}T00:00:00Z`) + days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

const WEEKDAYS = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];

/** Polish weekday name of a calendar date ("poniedziałek"). */
export function siteWeekday(date: string): string {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]!;
}

/** ISO week label (e.g. 2026-W38) of a calendar date. */
export function isoWeekLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day + 3); // Thursday of this week
  const year = d.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Monday..Sunday calendar dates of an ISO week label. */
export function isoWeekRange(label: string): { start: string; end: string } | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(label);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > 53) return null;
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  const start = new Date(mondayWeek1);
  start.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
  const startDate = start.toISOString().slice(0, 10);
  if (isoWeekLabel(startDate) !== label) return null;
  return { start: startDate, end: addDays(startDate, 6) };
}

/** First and last day (YYYY-MM-DD) of a calendar month label such as 2026-09; null for anything else. */
export function monthRange(label: string): { start: string; end: string } | null {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(label);
  if (!m) return null;
  const next = Number(m[2]) === 12 ? `${Number(m[1]) + 1}-01-01` : `${m[1]}-${String(Number(m[2]) + 1).padStart(2, "0")}-01`;
  return { start: `${label}-01`, end: addDays(next, -1) };
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const t = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === date;
}
