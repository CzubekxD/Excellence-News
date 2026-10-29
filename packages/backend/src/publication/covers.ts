// Issue covers through the public read layer: the front page's latest daily, weekly and monthly, and
// the facts each cover picture is drawn from. Covers show only what the issue itself shows publicly:
// its headline and still-public entries.
import type { IssueCover, ReportDetail, ReportKind } from "@aihot/contracts/site";
import { isoWeekRange } from "@aihot/contracts/time";
import { COVER_TEMPLATE_VERSION, coverMotif, type CoverCard, type CoverMotifChoice } from "../media/cover.ts";
import { cached, type Cached } from "../lib/cache.ts";
import { count, REPORTS } from "@aihot/site";
import { listReports, loadReport } from "./reports.ts";

export const ISSUE_NAMES: Record<ReportKind, string> = { daily: "Dziennik", weekly: "Tygodnik", monthly: "Miesięcznik" };
const KINDS: ReportKind[] = ["daily", "weekly", "monthly"];
const MONTHS = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

/** "29.10.2026", "19–25.10.2026" (or "28.09–4.10.2026" across months), "Październik 2026". */
export function issueDateLabel(kind: ReportKind, key: string): string {
  const day = (d: string) => `${Number(d.slice(8, 10))}.${d.slice(5, 7)}`;
  if (kind === "daily") return `${day(key)}.${key.slice(0, 4)}`;
  if (kind === "weekly") {
    const r = isoWeekRange(key);
    if (!r) return key;
    const sameMonth = r.start.slice(0, 7) === r.end.slice(0, 7);
    return `${sameMonth ? Number(r.start.slice(8, 10)) : day(r.start)}–${day(r.end)}.${r.end.slice(0, 4)}`;
  }
  const month = Number(key.slice(5, 7));
  return month >= 1 && month <= 12 ? `${MONTHS[month - 1]} ${key.slice(0, 4)}` : key;
}

function entries(r: ReportDetail) {
  return r.sections.flatMap((s) => s.items).filter((i) => i.available);
}

/** The cover's headline: the issue's lead, else its first public entry, else the issue's own title. */
function headlineOf(r: ReportDetail) {
  return r.lead?.title ?? entries(r)[0]?.title ?? r.title;
}

export function issueMotif(r: ReportDetail): CoverMotifChoice {
  return coverMotif(r.kind, r.sections.map((s) => s.label));
}

/** What the share card of an issue says. */
export function issueCoverCard(r: ReportDetail): CoverCard {
  const total = entries(r).length;
  return {
    kind: r.kind,
    key: r.key,
    name: ISSUE_NAMES[r.kind],
    issueNumber: r.issueNumber,
    dateLabel: issueDateLabel(r.kind, r.key),
    headline: headlineOf(r),
    meta: `${count(total, REPORTS.shareUnit)} · ok. ${r.readingMinutes} min czytania`,
    motif: issueMotif(r),
  };
}

function toCover(r: ReportDetail): IssueCover {
  const headline = headlineOf(r);
  const lines = entries(r).map((i) => i.title).filter((t) => t !== headline).slice(0, 2);
  const motif = issueMotif(r);
  return {
    kind: r.kind,
    key: r.key,
    name: ISSUE_NAMES[r.kind],
    issueNumber: r.issueNumber,
    dateLabel: issueDateLabel(r.kind, r.key),
    headline,
    lines,
    count: entries(r).length,
    readingMinutes: r.readingMinutes,
    href: `/${r.kind}/${r.key}`,
    // The template version in the address lets browsers keep a picture until the drawing changes.
    raster: `/og/covers/${r.kind}/${r.key}.svg?v=${COVER_TEMPLATE_VERSION}`,
    alt: motif.alt,
  };
}

// A minute at most, like the issues' own pages: a withdrawn headline leaves the covers as soon as the issue.
const latest: Cached<IssueCover[]> = cached(
  async () => {
    const covers: IssueCover[] = [];
    for (const kind of KINDS) {
      const [newest] = await listReports(kind, 1);
      const report = newest ? await loadReport(kind, newest.key) : null;
      if (report) covers.push(toCover(report));
    }
    return covers;
  },
  { freshMs: 60_000, maxStaleMs: 60_000 },
);

/** The latest issue of each kind that exists, daily first. */
export function latestCovers(): Promise<IssueCover[]> {
  return latest.get();
}
