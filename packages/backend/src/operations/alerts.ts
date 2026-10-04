// Operations alerts. The person reading them is the site owner, not an engineer: each
// message says what readers see, whether it heals by itself and what, if anything, the owner must do.
//   now    — readers are affected and it has not healed: sent at once, repeated hourly, recovery reported.
//   today  — money at risk or only the owner can act: sent at once, repeated at most daily, recovery reported.
//   digest — other follow-ups: one 09:00 message a day, meant to be handed to the AI.
// Delivery goes through sendAlert (ops chat, internal-chat fallback; off unless FEISHU_INTERNAL_ENABLED).
import { siteAt, siteDate } from "@aihot/contracts/time";
import { ALERTS, EDITION_TIMES } from "@aihot/site";
import { sql } from "../db.ts";
import { siteDay, siteStamp, duration, formatAlert, formatRecovery, sendAlert, type Finding, type Level } from "../notify/feishu.ts";
import { backupConfigured } from "./backup.ts";
import { GROUPING_WARN_AFTER_MS, waitingSelectedNews } from "./grouping.ts";
import { upstreamFindings } from "../media/upstream.ts";
import { serverModules } from "../modules.ts";
import { sourceHealth, sourceHealthList } from "../sources/health.ts";

const REPEAT_MS: Record<Exclude<Level, "digest">, number> = { now: 3600_000, today: 24 * 3600_000 };

/** What the content groups receive, as the alerts name it: the engine's cards, then the modules' pushes. */
const pushes = () => ["wybór", ...serverModules().flatMap((m) => m.pushes ?? [])];

// Valves default off: read at call time, only an explicit "true" turns them on.
const collecting = () => process.env.COLLECT_ENABLED === "true";
const modelsOn = () => process.env.MODEL_CALLS_ENABLED === "true";
/**
 * How long the site may go without a new article before it counts as stalled (ALERT_QUIET_MINUTES, else
 * the site's own setting; small source lists are quieter). At most a day: the check looks one day back.
 */
const QUIET_MINUTES = Math.min(Number(process.env.ALERT_QUIET_MINUTES || ALERTS.quietMinutes), 1440);

/** Everything wrong right now, with its level. */
export async function collectFindings(now = Date.now()): Promise<Finding[]> {
  const out: Finding[] = [];

  // Readers affected now
  // Content flow, judged by outcome: whatever broke (worker, egress proxy, models, queues), readers see
  // a site that stops changing. Skipped for 20 minutes after the worker starts, and where the valves are off.
  const [hb] = await sql<{ value: { startedAt?: string } }[]>`SELECT value FROM settings WHERE key = 'heartbeat.worker'`;
  const settled = !hb?.value.startedAt || now - Date.parse(hb.value.startedAt) > 20 * 60_000;
  if (settled && collecting()) {
    const [last] = await sql<{ at: Date | null }[]>`SELECT max(a.discovered_at) AS at FROM articles a
      JOIN sources s ON s.id = a.source_id WHERE s.participation_mode = 'editorial' AND a.discovered_at > now() - interval '1 day'`;
    if (!last?.at || now - last.at.getTime() > QUIET_MINUTES * 60_000) {
      // A site without an enabled source has nothing to collect.
      const [anySource] = await sql`SELECT 1 FROM sources WHERE enabled AND participation_mode = 'editorial' LIMIT 1`;
      if (anySource) {
        out.push({
          key: "content.collect",
          level: "now",
          title: "Serwis przestał zbierać nowe artykuły",
          impact: last?.at ? `ostatni artykuł dodano ${siteStamp(last.at)}, od tego czasu nic nowego nie trafiło do przetwarzania` : "przez dobę nie dodano żadnego artykułu",
          heals: ALERTS.usualFlow ? `nie, ${ALERTS.usualFlow}` : "nie",
          action: "przekaż do pilnego sprawdzenia",
          detail: `editorial articles.discovered_at bez nowych wartości od ponad ${QUIET_MINUTES} min (sygnały popularności oceniane osobno); sprawdź sources.schedule, proxy wyjściowe i błędy pobierania`,
          since: last?.at ?? undefined,
        });
      }
    }
  }
  if (settled && collecting() && modelsOn()) {
    const waiting = (await waitingSelectedNews()).filter((item) => now - item.since.getTime() >= GROUPING_WARN_AFTER_MS);
    if (waiting.length) {
      const manual = waiting.filter((item) => item.recovery === "manual").length;
      const receipt = waiting.some((item) => item.recovery === "receipt");
      out.push({
        key: "content.grouping",
        level: "now",
        title: "Wybrane wiadomości utknęły w sprawdzaniu duplikatów i nie są opublikowane",
        impact: `wiadomości spełniających warunki wyboru czeka ponad 10 minut: ${waiting.length}; czytelnicy mogą zobaczyć je z opóźnieniem`,
        heals: manual ? `do ręcznej obsługi: ${manual}${manual < waiting.length ? "; reszta wraca automatycznie" : ""}`
          : receipt ? "czeka na automatyczne wznowienie; płatne zapytania o nieznanym wyniku zostaną po 30 minutach jednorazowo zwolnione" : "system ponowi próbę, ale czas oczekiwania przekroczył normę",
        action: manual ? "do sprawdzenia; płatne zapytania o nieznanym wyniku najpierw porównaj z rozliczeniem i wynikiem, potem zdecyduj o zwolnieniu" : "sprawdź przyczynę oczekiwania, by kolejka nie rosła",
        detail: waiting.slice(0, 8).map((item) => `${item.articleId} (${duration(now - item.since.getTime())})${item.receiptId ? ` potwierdzenie #${item.receiptId}` : ""}${item.error ? `: ${item.error.slice(0, 120)}` : ""}`).join("; "),
        since: waiting[0]!.since,
      });
    }
    const [p] = await sql<{ waiting: number; oldest: Date | null; failed: number }[]>`
      SELECT count(*) FILTER (WHERE processing_state = 'new' AND discovered_at < now() - interval '2 hours')::int AS waiting,
             min(discovered_at) FILTER (WHERE processing_state = 'new') AS oldest,
             count(*) FILTER (WHERE processing_state = 'failed' AND discovered_at > now() - interval '3 hours')::int AS failed
      FROM articles WHERE processing_state IN ('new', 'failed') AND discovered_at > now() - interval '2 days'`;
    if (p!.waiting >= 10 || p!.failed >= 20) {
      const errors = await sql<{ error: string; n: number }[]>`
        SELECT left(coalesce(processing_error, '(brak)'), 120) AS error, count(*)::int AS n FROM articles
        WHERE processing_state IN ('new', 'failed') AND discovered_at > now() - interval '3 hours' AND processing_error IS NOT NULL
        GROUP BY 1 ORDER BY 2 DESC LIMIT 3`;
      out.push({
        key: "content.process",
        level: "now",
        title: "Nowe treści utknęły i nie trafiają do serwisu",
        impact: [p!.waiting >= 10 && `nowych artykułów czeka ponad 2 godziny: ${p!.waiting}`, p!.failed >= 20 && `nieudane przetwarzanie w ostatnich 3 godzinach: ${p!.failed}`]
          .filter(Boolean)
          .join("; ") + "; w wyborze i na liście na czasie zabraknie treści",
        heals: p!.waiting >= 10 ? "po przywróceniu usługi zaległości przetworzą się same" : "nie, po naprawie trzeba ponownie przetworzyć te artykuły",
        action: "do sprawdzenia",
        detail: errors.map((e) => `${e.error} (${e.n})`).join("; ") || "brak zapisanych błędów",
        since: p!.waiting >= 10 && p!.oldest ? p!.oldest : undefined,
      });
    }
    // The daily report is composed from its edition time, and tried again every half hour until it exists:
    // two hours later it is overdue.
    if (now >= siteAt(siteDate(now), EDITION_TIMES.daily).getTime() + 2 * 3600_000) {
      const [r] = await sql`SELECT 1 FROM reports WHERE kind = 'daily' AND key = ${siteDate(now)}`;
      if (!r) {
        out.push({
          key: "report.daily",
          level: "now",
          title: "Dzisiejszy dziennik jeszcze nie powstał",
          impact: "czytelnicy nie widzą dzisiejszego dziennika",
          heals: "system ponawia co pół godziny, dotąd bez powodzenia",
          action: "do sprawdzenia",
          detail: `brak reports daily ${siteDate(now)}; zobacz przebiegi reports.compose`,
        });
      }
    }
  }

  // Money, and things only the owner can do
  out.push(...(await providerFindings()));

  // Content-group pushes the Feishu webhook refused (a removed bot, a changed address); nothing resends them.
  const [refused] = await sql<{ n: number; target: string | null; response: string | null }[]>`
    SELECT count(*)::int AS n, max(t.note) AS target, left(max(d.response), 200) AS response FROM deliveries d JOIN notify_targets t ON t.key = d.target_key
    WHERE d.status = 'failed' AND d.updated_at > now() - interval '1 day'`;
  if (refused!.n > 0) {
    out.push({
      key: "deliveries.failed",
      level: "today",
      title: "Część powiadomień Feishu nie została wysłana",
      impact: `w ostatnich 24 godzinach nie dotarło powiadomień (${pushes().join(" lub ")}): ${refused!.n} do ${refused!.target ?? "grupy"}`,
      heals: "nie zostaną wysłane ponownie automatycznie",
      action: "do sprawdzenia; jeśli bot został usunięty z grupy, dodaj go z powrotem",
      detail: refused!.response ?? "",
    });
  }

  if (backupConfigured()) {
    const [b] = await sql<{ value: { at: string; uploaded: boolean; filesError?: string } }[]>`SELECT value FROM settings WHERE key = 'backup.last'`;
    // A failed archive updates backup.last too. Reuse the run history so repeated failures cannot
    // reset the age; before the first success, count from the first attempt rather than from now.
    const [runs] = await sql<{ last_ok: Date | null; first_attempt: Date | null }[]>`
      SELECT max(finished_at) FILTER (WHERE status = 'ok') AS last_ok, min(started_at) AS first_attempt
      FROM job_runs WHERE job = 'ops.backup'`;
    const lastOk = Math.max(runs?.last_ok?.getTime() ?? 0, b?.value.uploaded ? Date.parse(b.value.at) : 0);
    const since = lastOk || runs?.first_attempt?.getTime() || now;
    const age = now - since;
    const state = b?.value.filesError ? `baza wysłana, pakowanie plików nieudane: ${b.value.filesError}` : b?.value.uploaded === false ? "nie wysłano" : "";
    if (age > 50 * 3600_000) {
      out.push({
        key: "backup.failed",
        level: "today",
        title: "Kopia bazy danych nie udała się dwa dni z rzędu",
        impact: lastOk ? `przy awarii serwera dane z ostatnich ${duration(age)} mogą być nie do odtworzenia` : "nie ma jeszcze udanej pełnej kopii; przy awarii serwera danych może nie dać się odtworzyć",
        heals: "nie",
        action: "do sprawdzenia",
        detail: `${lastOk ? "ostatnia udana" : "pierwsza próba kopii"} ${siteStamp(since)}${state ? `; ${state}` : ""}; zobacz przebiegi ops.backup`,
        since: new Date(since),
      });
    } else if (!b || !b.value.uploaded || age > 30 * 3600_000) {
      out.push({ key: "backup.stale", level: "digest", title: "Kopia bazy danych nie udała się od ponad doby", detail: b ? `ostatnia ${siteStamp(b.value.at)}${state ? ` (${state})` : ""}; zobacz ops.backup` : "brak udanej kopii w historii" });
    }
  }

  out.push(...(await upstreamFindings(now)));

  // What the site's modules find.
  for (const m of serverModules()) if (m.alerts) out.push(...(await m.alerts(now)));

  // Follow-ups for the daily digest
  if (collecting()) {
    for (const group of await sourceHealth(now)) {
      if (group.failing.length) out.push({
        key: `sources.failing.${group.mode}`, level: "digest", title: `${group.name}: źródła z kolejnymi nieudanymi pobraniami: ${group.failing.length}`,
        detail: sourceHealthList(group.failing, s => `nieudane z rzędu: ${s.fail_count}${s.last_error ? `, ${s.last_error}` : ""}`) + "; sprawdź błędy pobierania",
      });
      if (group.unstable.length) out.push({
        key: `sources.unstable.${group.mode}`, level: "digest", title: `${group.name}: źródła z powtarzającymi się błędami pobierania: ${group.unstable.length}`,
        detail: sourceHealthList(group.unstable, s => `nieudane w 7 dni: ${s.failed}/${s.runs}`) + "; sprawdź nawet przy ostatnim sukcesie, by nie gubić treści",
      });
      if (group.silent.length) out.push({
        key: `sources.silent.${group.mode}`, level: "digest", title: `${group.name}: źródła bez nowych treści od 7 dni: ${group.silent.length}`,
        detail: sourceHealthList(group.silent, s => `w 7 dni pobrań: ${s.runs}, nowych: 0`) + "; porównaj ze stroną, by odróżnić rzadkie publikacje od zepsutego pobierania",
      });
      if (group.quality.length) out.push({
        key: `sources.quality.${group.mode}`, level: "digest", title: `${group.name}: źródła do sprawdzenia jakości artykułów: ${group.quality.length}`,
        detail: sourceHealthList(group.quality, s => `w 7 dni bez daty publikacji: ${s.undated}, wielokrotnie zmieniane: ${s.repeated}`) + "; brak daty może sprawić, że wiadomość zostanie uznana za archiwalną; przy częstych zmianach sprawdź, czy do treści nie trafiają zmienne elementy",
      });
      if (group.detailFailures.length) out.push({
        key: `sources.details.${group.mode}`, level: "digest", title: `${group.name}: źródła z nieudanym uzupełnianiem szczegółów: ${group.detailFailures.length}`,
        detail: sourceHealthList(group.detailFailures, s => `w 7 dni: ${s.detail_failures}`) + "; zobacz adresy szczegółów i błędy w historii pobrań",
      });
    }
  }
  const [r] = await sql<{ receipts: number; services: string | null; deliveries: number }[]>`
    SELECT (SELECT count(*)::int FROM receipts WHERE status = 'unknown') AS receipts,
           (SELECT string_agg(DISTINCT service || '/' || purpose, ', ') FROM receipts WHERE status = 'unknown') AS services,
           (SELECT count(*)::int FROM deliveries WHERE status = 'unknown') AS deliveries`;
  if (r!.receipts > 0) {
    out.push({ key: "receipts.unknown", level: "digest", title: `Płatne zapytania z niepotwierdzonym wynikiem: ${r!.receipts}`, detail: `${r!.services}; może to wstrzymywać przetwarzanie, szczegóły w panelu na stronie „Działanie”; zapytania wciąż nieznane po automatycznym wznowieniu sprawdź przed zwolnieniem` });
  }
  if (r!.deliveries > 0) out.push({ key: "deliveries.unknown", level: "digest", title: `Powiadomienia Feishu o niepewnym doręczeniu: ${r!.deliveries}`, detail: "sprawdź w panelu na stronie „Działanie”, potem oznacz lub wyślij ponownie" });

  // Runnable jobs (deferred ones excluded) that have waited more than two hours.
  const queues = await sql<{ name: string; n: number; oldest: Date }[]>`
    SELECT name, count(*)::int AS n, min(start_after) AS oldest FROM pgboss.job
    WHERE state IN ('created', 'retry') AND start_after <= now() AND name NOT LIKE 'cron.%' GROUP BY 1`;
  for (const q of queues) {
    if (now - q.oldest.getTime() > 2 * 3600_000) {
      out.push({ key: `queue.${q.name}`, level: "digest", title: `Zadanie w tle czeka w kolejce ponad 2 godziny: ${q.name}`, detail: `czekających: ${q.n}, najstarsze od ${duration(now - q.oldest.getTime())}` });
    }
  }

  // The site's modules' follow-ups.
  for (const m of serverModules()) if (m.followUps) out.push(...(await m.followUps(now)));
  return out;
}

/** What stops when a model service refuses us: the site's own words for its models, else a pointer to the admin. */
const modelStops = (service: string) => ALERTS.modelStops[service] ?? "stanęły kroki używające tego modelu (zobacz w panelu „Modele i ewaluacja”); nowe treści mogą nie trafiać do wyboru";
const PROVIDERS: Record<string, { name: string; stops: string; where: string }> = {
  llm: { name: "domyślny model", stops: "stanęły wybór, streszczenia, klasyfikacja i tłumaczenia nowych artykułów oraz grupowanie i zarysy wydarzeń; tygodnik i miesięcznik wyjdą bez podsumowania", where: "konsoli dostawcy modelu" },
  gemini: { name: "Gemini", stops: modelStops("gemini"), where: "Google AI Studio" },
  groq: { name: "Groq", stops: modelStops("groq"), where: "konsoli Groq" },
  cerebras: { name: "Cerebras", stops: modelStops("cerebras"), where: "konsoli Cerebras" },
  mistral: { name: "Mistral", stops: modelStops("mistral"), where: "konsoli Mistral" },
  zhipu: { name: "Zhipu", stops: modelStops("zhipu"), where: "konsoli Zhipu" },
  dashscope: { name: "Alibaba DashScope", stops: modelStops("dashscope"), where: "konsoli DashScope" },
  deepseek: { name: "DeepSeek", stops: modelStops("deepseek"), where: "konsoli DeepSeek" },
  mimo: { name: "Xiaomi MiMo", stops: modelStops("mimo"), where: "konsoli MiMo" },
  socialdata: { name: "SocialData", stops: "nie docierają nowe treści z X (Twittera)", where: "panelu SocialData" },
  jina: { name: "Jina", stops: "części artykułów nie da się pobrać w całości", where: "panelu Jina" },
  dajiala: { name: "Dajiala", stops: "nie docierają nowe artykuły z WeChat", where: "panelu Dajiala" },
};
export const providerName = (service: string) => PROVIDERS[service]?.name ?? service;
export const providerStops = (service: string) => PROVIDERS[service]?.stops ?? "stanęły powiązane funkcje";
export const providerConsole = (service: string) => PROVIDERS[service]?.where ?? `panelu ${service}`;

/** Paid services that refuse us (no balance, a dead key), and daily budgets used up. */
async function providerFindings(): Promise<Finding[]> {
  const out: Finding[] = [];
  const refused = await sql<{ service: string; n: number; last: string }[]>`
    SELECT service, count(*)::int AS n, (array_agg(left(error, 200) ORDER BY started_at DESC))[1] AS last FROM receipt_attempts
    WHERE status = 'failed' AND started_at > now() - interval '1 hour'
      AND error ~* '(HTTP 40[123]\\M|insufficient|balance|arrear|good standing|quota|billing)'
    GROUP BY 1 HAVING count(*) >= 3`;
  for (const p of refused) {
    out.push({
      key: `provider.refused.${p.service}`,
      level: "today",
      title: `${providerName(p.service)} odmawia usługi: możliwy brak środków lub nieaktywne konto`,
      impact: providerStops(p.service),
      heals: "nie",
      action: `sprawdź saldo i stan konta w ${providerConsole(p.service)}; po doładowaniu lub przywróceniu system wznowi pracę sam`,
      detail: `odmów w ostatniej godzinie: ${p.n}; ostatnia: ${p.last}`,
    });
  }
  const capped = await sql<{ service: string; per_day: number; used: number }[]>`
    SELECT b.service, b.per_day, count(a.id)::int AS used FROM budgets b
    JOIN receipt_attempts a ON a.service = b.service AND a.origin = 'live' AND a.started_at > now() - interval '1 day'
    WHERE b.per_day > 0 GROUP BY 1, 2 HAVING count(a.id) >= b.per_day`;
  for (const c of capped) {
    out.push({
      key: `budget.day.${c.service}`,
      level: "today",
      title: `${providerName(c.service)}: wyczerpany limit wywołań z ostatnich 24 godzin`,
      impact: `${providerStops(c.service)}, dopóki limit się nie odnowi`,
      heals: "tak, limit odnawia się w oknie 24 godzin",
      action: "tym razem nic nie trzeba robić; jeśli zdarza się często, rozważ podniesienie limitu",
      detail: `w 24 godziny: ${c.used}, limit ${c.per_day} (tabela budgets)`,
    });
  }
  return out;
}

interface AlertState {
  [key: string]: { title: string; since: string; sentAt: string };
}

/** Every 10 minutes: new problems and recoveries of the now/today levels go out; digest items wait for 09:00. */
export async function checkAlerts(now = Date.now()) {
  const found = (await collectFindings(now)).filter((f) => f.level !== "digest");
  const [row] = await sql<{ value: AlertState }[]>`SELECT value FROM settings WHERE key = 'alerts.state'`;
  const state: AlertState = { ...(row?.value ?? {}) };
  const sent: string[] = [];
  for (const f of found) {
    const open = state[f.key];
    if (open && now - Date.parse(open.sentAt) <= REPEAT_MS[f.level as Exclude<Level, "digest">]) continue;
    const since = open ? new Date(open.since) : (f.since ?? new Date(now));
    const msg = formatAlert(f, since, now, !!open);
    await sendAlert(msg.title, msg.lines);
    state[f.key] = { title: f.title, since: since.toISOString(), sentAt: new Date(now).toISOString() };
    sent.push(f.key);
  }
  for (const [key, open] of Object.entries(state)) {
    if (found.some((f) => f.key === key)) continue;
    const msg = formatRecovery(open.title, new Date(open.since), now);
    await sendAlert(msg.title, msg.lines);
    sent.push(`${key}:recovered`);
    delete state[key];
  }
  await sql`INSERT INTO settings (key, value, updated_by) VALUES ('alerts.state', ${sql.json(state as never)}, 'alerts')
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  return { open: Object.keys(state), sent };
}

/** 09:00: one message with other follow-ups; nothing when there are none. */
export async function sendDigest(now = Date.now()) {
  const items = (await collectFindings(now)).filter((f) => f.level === "digest");
  const lines = items.map((f, i) => `${i + 1}. ${f.title}${f.detail ? `\n   ${f.detail}` : ""}`);
  if (!lines.length) return { items: 0 };
  await sendAlert(`📋 Raport systemowy · ${siteDay(now)}`, ["Sprawy do obsłużenia; skutki opisano przy każdej pozycji.", ...lines]);
  return { items: lines.length };
}
