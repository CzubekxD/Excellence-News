// The Monday source-health report for the ops chat. It goes through the same gated channel as the
// alerts (off unless FEISHU_INTERNAL_ENABLED).
import { sql } from "../db.ts";
import { sendAlert } from "../notify/feishu.ts";
import { serverModules } from "../modules.ts";
import { sourceHealth, sourceHealthList } from "../sources/health.ts";

/** The change from b to a: "+12%", "—" without a b. Also the modules' reports. */
export const pct = (a: number, b: number) => (b ? `${a >= b ? "+" : ""}${(((a - b) / b) * 100).toFixed(0)}%` : "—");
/** A count with thousands separators. */
export const n = (v: number) => v.toLocaleString("en-US");

/** Monday 09:00: how the sources did over the last seven days. */
export async function sourceHealthWeekly(now = Date.now()) {
  const since = new Date(now - 7 * 86400_000);
  const before = new Date(now - 14 * 86400_000);
  const [[counts], [items], groups] = await Promise.all([
    sql<{ enabled: number; failing: number; degraded: number; added: number }[]>`
      SELECT count(*) FILTER (WHERE enabled)::int AS enabled,
             count(*) FILTER (WHERE enabled AND health = 'failing')::int AS failing,
             count(*) FILTER (WHERE enabled AND health = 'degraded')::int AS degraded,
             count(*) FILTER (WHERE created_at >= ${since})::int AS added
      FROM sources`,
    sql<{ week: number; prev: number; selected: number }[]>`
      SELECT count(*) FILTER (WHERE discovered_at >= ${since})::int AS week,
             count(*) FILTER (WHERE discovered_at >= ${before} AND discovered_at < ${since})::int AS prev,
             (SELECT count(*)::int FROM publications p WHERE p.selected AND p.visibility <> 'withdrawn' AND p.discovered_at >= ${since}) AS selected
      FROM articles WHERE discovered_at >= ${before}`,
    sourceHealth(now),
  ]);
  const lines = [
    `W tym tygodniu zebrano ${n(items!.week)} (tydzień wcześniej ${n(items!.prev)}, ${pct(items!.week, items!.prev)}), w tym wybranych ${n(items!.selected)}`,
    `Aktywnych źródeł: ${counts!.enabled}, nowych w tym tygodniu: ${counts!.added}; z błędami pobierania: ${counts!.failing}, niestabilnych: ${counts!.degraded}`,
  ];
  // The modules' own collectors, a line each.
  for (const m of serverModules()) if (m.sourceHealth) lines.push(...(await m.sourceHealth(now)));
  for (const group of groups) {
    lines.push("", `${group.name}: aktywnych źródeł ${group.sources.length}; pozycji w tym tygodniu ${n(group.sources.reduce((sum, s) => sum + s.items, 0))}; z kolejnymi błędami ${group.failing.length}, z powtarzającymi się błędami ${group.unstable.length}, bez nowości od 7 dni ${group.silent.length}`);
    if (group.failing.length) lines.push(`Błędy pobierania: ${sourceHealthList(group.failing, s => `nieudane z rzędu: ${s.fail_count}${s.last_error ? ` (${s.last_error})` : ""}`, Infinity)}`);
    if (group.unstable.length) lines.push(`Niestabilne: ${sourceHealthList(group.unstable, s => `nieudane ${s.failed}/${s.runs}`, Infinity)}`);
    if (group.silent.length) lines.push(`Bez nowości od 7 dni (porównaj ze stroną, może po prostu rzadko publikują): ${sourceHealthList(group.silent, s => `pobrań: ${s.runs}`, Infinity)}`);
    if (group.quality.length) lines.push(`Jakość artykułów do sprawdzenia: ${sourceHealthList(group.quality, s => `bez daty: ${s.undated}, wielokrotnie zmieniane: ${s.repeated}`, Infinity)}`);
    if (group.detailFailures.length) lines.push(`Nieudane uzupełnianie szczegółów: ${sourceHealthList(group.detailFailures, s => `${s.detail_failures}`, Infinity)}`);
  }
  const failing = counts!.failing;
  const silent = groups.reduce((sum, g) => sum + g.silent.length, 0);
  const followUp = counts!.failing > 0 || groups.some(g => g.failing.length || g.unstable.length || g.silent.length || g.quality.length || g.detailFailures.length);
  lines.push("", followUp ? "Szczegóły w panelu, na stronach „Źródła” i „Działanie”." : "Żadne źródło nie wymaga obsługi.");
  await sendAlert("📊 Tygodniowy raport źródeł", lines);
  return { failing, silent };
}
