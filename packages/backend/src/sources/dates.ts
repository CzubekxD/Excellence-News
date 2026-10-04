// Published dates as list pages, articles and JSON lists print them, read the same on every host.
import type { SourceRow } from "./types.ts";

/** The offset a source's article pages print their dates in: its detail rules' own, else its listing's. */
/** Offset for a source's date-time printed without a zone, unless its config names one: Central European Time. */
export const DEFAULT_UTC_OFFSET = "+01:00";

export function articleUtcOffset(config: SourceRow["config"]): string | undefined {
  return config.detail?.publishedAtUtcOffset ?? config.publishedAtUtcOffset;
}

/** A time followed by its zone: "10:00Z", "10:00:00+08:00", "10:00:00 +0000", "10:00:00 GMT". */
const EXPLICIT_ZONE = /\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?\s*(?:Z|[+-]\d{2}:?\d{2}|GMT|UTC)\b/i;

function calendarDay(y: string | number, mo: string | number, d: string | number): boolean {
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  return date.getUTCFullYear() === Number(y) && date.getUTCMonth() === Number(mo) - 1 && date.getUTCDate() === Number(d);
}

function atOffset(y: string | number, mo: string | number, d: string | number, h: string | number, mi: string | number, s: string | number, utcOffset: string): Date | null {
  if (!calendarDay(y, mo, d) || Number(h) > 23 || Number(mi) > 59 || Number(s) > 59) return null;
  const p = (n: string | number) => String(n).padStart(2, "0");
  const t = Date.parse(`${y}-${p(mo)}-${p(d)}T${p(h)}:${p(mi)}:${p(s)}${utcOffset}`);
  return Number.isFinite(t) ? new Date(t) : null;
}

/** Month names (Polish genitive and nominative, French, Spanish) to the English short names Date.parse reads. */
const MONTHS: ReadonlyArray<[RegExp, string]> = [
  [/(?<!\p{L})(stycznia|styczeń|janvier|enero)(?!\p{L})/giu, "Jan"], [/(?<!\p{L})(lutego|luty|février|fevrier|febrero)(?!\p{L})/giu, "Feb"],
  [/(?<!\p{L})(marca|marzec|mars|marzo)(?!\p{L})/giu, "Mar"], [/(?<!\p{L})(kwietnia|kwiecień|avril|abril)(?!\p{L})/giu, "Apr"],
  [/(?<!\p{L})(maja|maj|mai|mayo)(?!\p{L})/giu, "May"], [/(?<!\p{L})(czerwca|czerwiec|juin|junio)(?!\p{L})/giu, "Jun"],
  [/(?<!\p{L})(lipca|lipiec|juillet|julio)(?!\p{L})/giu, "Jul"], [/(?<!\p{L})(sierpnia|sierpień|août|aout|agosto)(?!\p{L})/giu, "Aug"],
  [/(?<!\p{L})(września|wrzesień|septembre|septiembre|setiembre)(?!\p{L})/giu, "Sep"], [/(?<!\p{L})(października|październik|octobre|octubre)(?!\p{L})/giu, "Oct"],
  [/(?<!\p{L})(listopada|listopad|novembre|noviembre)(?!\p{L})/giu, "Nov"], [/(?<!\p{L})(grudnia|grudzień|décembre|decembre|diciembre)(?!\p{L})/giu, "Dec"],
];

/**
 * European ways of printing a date, rewritten into forms the parser below reads: "26.09.2026" (day first)
 * becomes 2026-09-26, and "26 września 2026", "26 septembre 2026", "26 de septiembre de 2026" become "26 Sep 2026".
 */
function europeanDate(v: string): string {
  let out = v.replace(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/, (_m, d: string, mo: string, y: string) => `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`);
  for (const [re, en] of MONTHS) out = out.replace(re, en);
  return out.replace(/(\d{1,2})\s+de\s+([A-Z][a-z]{2})\s+de\s+(\d{4})/, "$1 $2 $3").replace(/(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})\s*r\.?/, "$1 $2 $3");
}

/**
 * A published date as a source prints it. Date.parse is kept only where it reads the same
 * on every host: a time with its zone, and an ISO date alone (UTC midnight). Anything else it would read
 * in the server's local zone (UTC in Docker), so "2026-09-26 10:00" is read in the source's offset instead.
 */
export function parseLooseDate(value: string | null | undefined, utcOffset = DEFAULT_UTC_OFFSET): Date | null {
  if (!value) return null;
  const v = europeanDate(value.trim());
  if (!v) return null;
  const numeric = /(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?(?:(?:T|\s*)(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(v);
  if (numeric && !calendarDay(numeric[1]!, numeric[2]!, numeric[3]!)) return null;
  const english = /\b([a-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(\d{4})\b/i.exec(v)
    ?? /\b(\d{1,2})\s+([a-z]{3,9})\s+(\d{4})\b/i.exec(v)?.map((part, i, match) => i === 1 ? match[2]! : i === 2 ? match[1]! : part);
  if (english) {
    const month = Date.parse(`${english[1]} 1, ${english[3]} 00:00:00 GMT`);
    if (!Number.isFinite(month) || !calendarDay(english[3]!, new Date(month).getUTCMonth() + 1, english[2]!)) return null;
  }
  if (!numeric && !english) return null;
  if (EXPLICIT_ZONE.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const direct = Date.parse(v);
    if (Number.isFinite(direct) && /\d{4}/.test(v)) return new Date(direct);
  }
  // 2026-09-26 / 2026/09/26 / 2026-09-26T10:00 / 2026年9月26日 (+ optional time), interpreted in the given offset.
  const m = numeric;
  if (m) {
    const [, y, mo, d, h = "00", mi = "00", s = "00"] = m;
    return atOffset(y!, mo!, d!, h, mi, s, utcOffset);
  }
  // "Sep 26, 2026": Date.parse reads it in the host's zone, so take its fields and place them in the offset.
  const en = Date.parse(v.replace(/(\d)(st|nd|rd|th)/, "$1"));
  if (!Number.isFinite(en)) return null;
  const local = new Date(en);
  return atOffset(local.getFullYear(), local.getMonth() + 1, local.getDate(), local.getHours(), local.getMinutes(), local.getSeconds(), utcOffset);
}

