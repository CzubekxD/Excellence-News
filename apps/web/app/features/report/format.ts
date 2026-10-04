// Names, dates and grouping for daily, weekly and monthly reports.
import type { ReportNavigationEntry, ReportKind } from "@aihot/contracts/site";
import { siteDate, siteWeekday, isoWeekLabel, isoWeekRange } from "@aihot/contracts/time";
import { count as countOf, EDITION_WHEN, plural, REPORTS, SITE, type Plural } from "@aihot/site";
import { RELEASE } from "@aihot/industry/taxonomy";
import { monthDay, weekdayShort } from "../../lib/format.ts";

export const KINDS: ReportKind[] = ["daily", "weekly", "monthly"];
export const KIND_PATH: Record<ReportKind, string> = { daily: "/daily", weekly: "/weekly", monthly: "/monthly" };
export const KIND_LABEL: Record<ReportKind, string> = { daily: "Dziennik", weekly: "Tygodnik", monthly: "Miesięcznik" };

/** Polish month names: nominative ("wrzesień") and genitive, as in a date ("26 września"). */
const MONTHS = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];
const MONTHS_GEN = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
const monthName = (m: number) => MONTHS[m - 1]!;
const monthNameGen = (m: number) => MONTHS_GEN[m - 1]!;

export function kindFromPath(pathname: string): ReportKind {
  if (pathname.startsWith("/weekly")) return "weekly";
  if (pathname.startsWith("/monthly")) return "monthly";
  return "daily";
}

/** The kind's RSS feed, announced in the page head so a reader given the page finds it. */
export const feedLink = (kind: ReportKind) => ({ tagName: "link", rel: "alternate", type: "application/rss+xml", title: `${SITE.name} ${KIND_LABEL[kind]}`, href: `/feed/${kind}.xml` }) as const;

export function reportPath(kind: ReportKind, key: string): string {
  return `${KIND_PATH[kind]}/${key}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "ważne wiadomości": what an issue counts its entries in, in the site's words (REPORTS.entry). */
export const ENTRIES_UNIT: Plural = REPORTS.entry.forms;

/** "Dzień w 4 ważnych wiadomościach OPEX"-style lines: "4 ważne wiadomości dnia", "12 ważnych wiadomości tygodnia", "20 ważnych wiadomości: sierpień". */
export function headline(kind: ReportKind, key: string, count: number): string {
  const n = countOf(count, ENTRIES_UNIT);
  if (kind === "daily") return `${n} dnia`;
  if (kind === "weekly") return `${n} tygodnia`;
  return `${n}: ${monthName(Number(key.slice(5, 7)))}`;
}

/** "09.16" for a story inside a week or month. */
export function shortDay(iso: string): string {
  return siteDate(iso).slice(5).replace("-", ".");
}

export interface ArchiveGroup {
  id: string;
  label: string;
  entries: Array<ReportNavigationEntry & { short: string }>;
}

/**
 * The archive column: days grouped by month, weeks by the month their Monday falls in ("第2周"),
 * months by year. Newest first, as the index comes.
 */
export function archiveGroups(kind: ReportKind, index: ReportNavigationEntry[]): ArchiveGroup[] {
  const groups: ArchiveGroup[] = [];
  const push = (id: string, label: string, e: ReportNavigationEntry & { short: string }) => {
    const g = groups[groups.length - 1];
    if (g && g.id === id) g.entries.push(e);
    else groups.push({ id, label, entries: [e] });
  };
  if (kind === "weekly") {
    const byMonth = new Map<string, string[]>();
    for (const e of index) {
      const m = isoWeekRange(e.key)!.start.slice(0, 7);
      byMonth.set(m, [...(byMonth.get(m) ?? []), e.key]);
    }
    for (const e of index) {
      const m = isoWeekRange(e.key)!.start.slice(0, 7);
      const weeks = [...byMonth.get(m)!].sort();
      push(m, `${monthName(Number(m.slice(5)))} ${m.slice(0, 4)}`, { ...e, short: `tydz. ${weeks.indexOf(e.key) + 1}` });
    }
    return groups;
  }
  for (const e of index) {
    if (kind === "daily") push(e.key.slice(0, 7), `${monthName(Number(e.key.slice(5, 7)))} ${e.key.slice(0, 4)}`, { ...e, short: `${Number(e.key.slice(8, 10))}` });
    else push(e.key.slice(0, 4), e.key.slice(0, 4), { ...e, short: monthName(Number(e.key.slice(5, 7))) });
  }
  return groups;
}

/** An issue's mark in the archive column: a large number over a small word (a month's number stands alone). */
export function archiveMark(kind: ReportKind, key: string): { big: string; small: string | null } {
  if (kind === "daily") return { big: key.slice(8, 10), small: weekdayShort(key) };
  if (kind === "weekly") {
    const { start } = isoWeekRange(key)!;
    return { big: key.slice(6), small: `od ${start.slice(8, 10)}.${start.slice(5, 7)}` };
  }
  return { big: key.slice(5, 7), small: null };
}

/** Short chip label for the phone switcher: "dziś", "26.09", "wrzesień, tydz. 2", "sierpień". */
export function chipLabel(kind: ReportKind, key: string, index: ReportNavigationEntry[], today: string): string {
  if (kind === "daily") return key === today ? "dziś" : monthDay(key);
  if (kind === "monthly") return monthName(Number(key.slice(5, 7)));
  const group = archiveGroups("weekly", index).find((g) => g.entries.some((e) => e.key === key));
  const entry = group?.entries.find((e) => e.key === key);
  return group && entry ? `${monthName(Number(group.id.slice(5)))}, ${entry.short}` : key;
}

/**
 * "nr N": the issue's place in its series as the server counts it over every issue. The navigation
 * index holds only the newest issues, so its length cannot tell.
 */
export function issueNumber(index: ReportNavigationEntry[], key: string): number | null {
  return index.find((e) => e.key === key)?.issueNumber ?? null;
}

/** The masthead's date block: a large figure and two small lines beside it. */
export function dateMark(kind: ReportKind, key: string): { figure: string; top: string; bottom: string } {
  if (kind === "daily") return { figure: key.slice(8, 10), top: `${monthNameGen(Number(key.slice(5, 7)))} ${key.slice(0, 4)}`, bottom: siteWeekday(key) };
  if (kind === "weekly") {
    const { start, end } = isoWeekRange(key)!;
    return { figure: key.slice(6), top: `tydzień ${Number(key.slice(6))} · ${key.slice(0, 4)}`, bottom: `${start.slice(8, 10)}.${start.slice(5, 7)} — ${end.slice(8, 10)}.${end.slice(5, 7)}` };
  }
  return { figure: key.slice(5, 7), top: key.slice(0, 4), bottom: monthName(Number(key.slice(5, 7))) };
}

/** When each kind comes out, for the masthead (the times are the site's, EDITION_WHEN). */
export const EDITION: Record<ReportKind, string> = { daily: `wychodzi ${EDITION_WHEN.daily}`, weekly: `wychodzi ${EDITION_WHEN.weekly}`, monthly: `wychodzi ${EDITION_WHEN.monthly}` };

/**
 * The masthead's figures, in the order a reader wants them, in the site's words (REPORTS). Releases of the
 * pack's headline launch kind (RELEASE, "new models" for AI) count only where the pack has one; zero is left out.
 */
const UNITS = REPORTS.metricUnits;
const METRICS: Array<[key: string, unit: Plural]> = [
  ["totalEvents", ENTRIES_UNIT],
  ["totalStories", ENTRIES_UNIT],
  ["sourcesCount", UNITS.sourcesCount],
  ["firstPartyEvents", UNITS.firstPartyEvents],
  ...(RELEASE ? [["modelsReleased", [RELEASE.unit, RELEASE.unit, RELEASE.unit]] as [string, Plural]] : []),
  ["selectedCount", UNITS.selectedCount],
  ["reportsCovered", UNITS.reportsCovered],
];
export function metricItems(metrics: Record<string, number>): Array<{ value: number; unit: string }> {
  return METRICS.filter(([k]) => typeof metrics[k] === "number" && (k !== "modelsReleased" || metrics[k]! > 0)).map(([k, forms]) => ({ value: metrics[k]!, unit: plural(metrics[k]!, forms) }));
}

/** "Poprzedni dzień · 25.09", "Poprzednie wydanie · tydzień 37", "Następne wydanie · lipiec". */
export function neighbourLabel(kind: ReportKind, key: string, direction: "prev" | "next"): string {
  if (kind === "daily") return `${direction === "prev" ? "Poprzedni dzień" : "Następny dzień"} · ${monthDay(key)}`;
  const which = direction === "prev" ? "Poprzednie wydanie" : "Następne wydanie";
  return kind === "weekly" ? `${which} · tydzień ${Number(key.slice(6))}` : `${which} · ${monthName(Number(key.slice(5, 7)))}`;
}

/** The line above the nameplate: "26 września 2026 · sobota", "tydzień 38 · 2026 · 14.09 — 20.09", "sierpień 2026". */
export function dateLine(kind: ReportKind, key: string): string {
  const m = dateMark(kind, key);
  if (kind === "daily") return `${Number(key.slice(8, 10))} ${m.top} · ${m.bottom}`;
  return kind === "weekly" ? `${m.top} · ${m.bottom}` : `${m.bottom} ${m.top}`;
}

/** What each kind is, under its nameplate. */
export const MOTTO: Record<ReportKind, string> = { daily: `${REPORTS.motto} · najważniejsze z dnia`, weekly: `${REPORTS.motto} · przegląd tygodnia`, monthly: `${REPORTS.motto} · podsumowanie miesiąca` };

export interface PeriodCell {
  key: string | null;
  /** Hover text: "26.09 · nr 158". */
  label: string;
  state: "current" | "issue" | "none" | "pad";
}

/**
 * The dot grid beside the date in the masthead: the days of this issue's month (dailies, Monday first),
 * the weeks of its year (weeklies) or the months of its year (monthlies), each marked as this issue,
 * an issue that exists, or none. This issue's own number (`current`) labels it, also when it is older
 * than the navigation.
 */
export function periodGrid(kind: ReportKind, key: string, index: ReportNavigationEntry[], current: number): { title: string; note: string; columns: number; heads: string[] | null; cells: PeriodCell[] } {
  const exists = new Set(index.map((e) => e.key));
  const cell = (k: string, name: string): PeriodCell => {
    const n = k === key ? current : issueNumber(index, k);
    return { key: k, label: n ? `${name} · nr ${n}` : `${name} · brak wydania`, state: k === key ? "current" : exists.has(k) ? "issue" : "none" };
  };
  const count = (cells: PeriodCell[]) => cells.filter((c) => c.state === "issue" || c.state === "current").length;
  const year = key.slice(0, 4);
  if (kind === "daily") {
    const m = Number(key.slice(5, 7));
    const days = new Date(Date.UTC(Number(year), m, 0)).getUTCDate();
    const lead = (new Date(Date.UTC(Number(year), m - 1, 1)).getUTCDay() + 6) % 7;
    const cells: PeriodCell[] = [
      ...Array.from({ length: lead }, (): PeriodCell => ({ key: null, label: "", state: "pad" })),
      ...Array.from({ length: days }, (_, i) => {
        const day = `${key.slice(0, 7)}-${pad(i + 1)}`;
        return cell(day, monthDay(day));
      }),
    ];
    return { title: monthName(m), note: `w tym miesiącu: ${count(cells)}`, columns: 7, heads: ["pn", "wt", "śr", "cz", "pt", "so", "nd"], cells };
  }
  if (kind === "weekly") {
    // 28 December always falls in its year's last ISO week.
    const weeks = Number(isoWeekLabel(`${year}-12-28`).slice(6));
    const cells = Array.from({ length: weeks }, (_, i) => {
      const k = `${year}-W${pad(i + 1)}`;
      const { start, end } = isoWeekRange(k)!;
      return cell(k, `tydzień ${i + 1} (${start.slice(8, 10)}.${start.slice(5, 7)}—${end.slice(8, 10)}.${end.slice(5, 7)})`);
    });
    return { title: year, note: `w roku: ${count(cells)}`, columns: 13, heads: null, cells };
  }
  const cells = Array.from({ length: 12 }, (_, i) => cell(`${year}-${pad(i + 1)}`, monthName(i + 1)));
  return { title: year, note: `w roku: ${count(cells)}`, columns: 6, heads: null, cells };
}
