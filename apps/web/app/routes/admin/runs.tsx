import { useState } from "react";
import { SITE } from "@aihot/site";
import { Link, useFetcher } from "react-router";
import { useEffect } from "react";
import type { Route } from "./+types/runs";
import type { AdminDeliveryIssue, AdminReceiptIssue, AdminRuns } from "@aihot/contracts/admin";
import { adminGet } from "../../lib/admin.server";
import { useAdminAction } from "../../features/admin/action";
import { ago, bj, duration, num } from "../../features/admin/format";
import { AdminPage, Badge, Button, Card, DataTable, Dot, Empty, Field, Json, ReasonDialog, Select, Stat, Time } from "../../features/admin/ui";
import { loadParts, webModules } from "../../site-modules";


export async function loader({ request }: Route.LoaderArgs) {
  return adminGet<AdminRuns>(request, "/api/admin/runs");
}

export const meta: Route.MetaFunction = () => [{ title: `Działanie · panel ${SITE.name}` }];

const STATE_LABEL: Record<string, string> = { created: "W kolejce", retry: "Czeka na ponowienie", active: "W toku" };

const PARTS = await loadParts((m) => m.admin?.runs);

/** Who reports through the ingest API, named when nothing has reported yet: the modules' clients first. */
const ingestClients = () => [
  ...webModules().flatMap((m) => m.admin?.ingestClients ?? []),
  "skrypty pobierające (np. n8n)",
];

export default function RunsAdmin({ loaderData }: Route.ComponentProps) {
  const refresh = useFetcher<typeof loader>();
  const r = refresh.data ?? loaderData;
  const { run, pending } = useAdminAction();
  const [receipt, setReceipt] = useState<AdminReceiptIssue | null>(null);
  const [billed, setBilled] = useState("false");
  const [delivery, setDelivery] = useState<AdminDeliveryIssue | null>(null);
  const [outcome, setOutcome] = useState<"sent" | "drop" | "resend">("sent");
  // Failure group to put back into processing ("" = every failure of the last 30 days).
  const [requeue, setRequeue] = useState<string | null>(null);

  // Live view: refresh every 20 s while visible.
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && refresh.state === "idle" && refresh.load("/admin/runs"), 20_000);
    return () => clearInterval(t);
  }, [refresh]);

  const backlog = new Map<string, Record<string, { n: number; oldest: string }>>();
  for (const q of r.queues) backlog.set(q.name, { ...(backlog.get(q.name) ?? {}), [q.state]: { n: q.n, oldest: q.oldest } });
  const queued = r.queues.filter((q) => q.state !== "active").reduce((a, q) => a + q.n, 0);
  const worker = r.processes.find((p) => p.role === "worker");
  const failing = r.jobs.filter((j) => j.status === "failed");

  return (
    <AdminPage title="Działanie" subtitle={<>Zadania, kolejki, opóźnienia źródeł oraz pokwitowania i wysyłki do ręcznego sprawdzenia. Odświeża się co 20 s · ostatnio {bj(r.checkedAt)}</>}>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label="worker"
          value={<span className="inline-flex items-center gap-2 text-[18px]"><Dot tone={worker?.alive ? "ok" : "bad"} />{worker ? (worker.alive ? "działa" : "brak sygnału") : "nie zgłasza się"}</span>}
          hint={worker ? `${worker.host} · sygnał ${ago(worker.at)}` : "worker nie wysłał sygnału życia"}
        />
        <Stat label="Zaległości w kolejce" value={num(queued)} tone={queued > 500 ? "warn" : undefined} hint="w kolejce i czekające na ponowienie" />
        <Stat label="Nieudane zadania cykliczne" value={num(failing.length)} tone={failing.length ? "bad" : "ok"} hint="ostatnie uruchomienie nieudane" />
        <Stat label="Pokwitowania bez wyniku" value={num(r.receipts.issues.filter((x) => x.status === "unknown").length)} tone={r.receipts.issues.some((x) => x.status === "unknown") ? "bad" : "ok"} hint={`płatne zapytania w 7 dni: ${num(Object.values(r.receipts.counts).reduce((a, b) => a + b, 0))}`} />
        <Stat label="Wysyłki do sprawdzenia" value={num(r.deliveries.filter((d) => d.status === "unknown").length)} tone={r.deliveries.some((d) => d.status === "unknown") ? "bad" : "ok"} />
      </div>

      {r.grouping.waiting > 0 && (
        <Card className="mb-5" title="Wybrane czekające na sprawdzenie duplikatów" right={<span>czeka: {num(r.grouping.waiting)} · ponad 10 min: {num(r.grouping.needsAttention)}</span>} pad={false}>
          <p className="px-4 py-3 text-[13px] text-ink-3">Te wiadomości spełniły warunki wyboru i trafią do wybranych po sprawdzeniu, czy nie są duplikatami. Widać najwyżej 30 czekających najdłużej.</p>
          <DataTable dense rows={r.grouping.items} rowKey={(item) => item.articleId} columns={[
            { key: "title", label: "Wiadomość", render: (item) => <Link className="text-accent" to={`/admin/content/${item.articleId}`}>{item.title}</Link> },
            { key: "since", label: "Czeka od", render: (item) => <Time at={item.since} /> },
            { key: "recovery", label: "Dalej", render: (item) => <Badge tone={item.recovery === "manual" ? "bad" : "warn"}>{item.recovery === "manual" ? "wymaga interwencji" : item.recovery === "receipt" ? "czeka na wynik płatnego zapytania" : "obsługa automatyczna"}</Badge> },
            { key: "error", label: "Powód", render: (item) => <span className="line-clamp-2 text-[12px] text-ink-3">{item.receiptId ? `pokwitowanie #${item.receiptId} · ` : ""}{item.error ?? "czeka na potwierdzenie tożsamości"}</span> },
          ]} />
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Kolejki" pad={false}>
          <DataTable
            dense
            rows={[...backlog.entries()]}
            rowKey={([name]) => name}
            empty="Kolejki są puste"
            columns={[
              { key: "n", label: "Kolejka", render: ([name]) => <span className="font-mono text-[12.5px]">{name}</span> },
              ...(["created", "retry", "active"] as const).map((st) => ({
                key: st,
                label: STATE_LABEL[st],
                align: "right" as const,
                render: ([, v]: [string, Record<string, { n: number; oldest: string }>]) => (v[st] ? <span title={`najstarsze ${bj(v[st]!.oldest, true)}`}>{num(v[st]!.n)}</span> : <span className="text-ink-4">0</span>),
              })),
              { key: "old", label: "Najstarsze w kolejce", render: ([, v]) => <Time at={v.created?.oldest ?? v.retry?.oldest ?? null} /> },
            ]}
          />
        </Card>
        <Card title="Zadania cykliczne" pad={false}>
          <DataTable
            dense
            rows={r.jobs}
            rowKey={(j) => j.job}
            columns={[
              { key: "j", label: "Zadanie", render: (j) => <span className="font-mono text-[12.5px]">{j.job}</span> },
              { key: "s", label: "Ostatnio", render: (j) => <Badge tone={j.status === "ok" ? "ok" : j.status === "failed" ? "bad" : "muted"} title={j.error ?? undefined}>{j.status ?? "w toku"}</Badge> },
              { key: "at", label: "Czas", render: (j) => <Time at={j.started_at} /> },
              { key: "d", label: "Czas trwania", align: "right", render: (j) => duration(j.started_at, j.finished_at) },
              { key: "f", label: "Błędy 24 h", align: "right", render: (j) => (j.failed_24h ? <span className="text-hot">{j.failed_24h}/{j.runs_24h}</span> : `0/${j.runs_24h}`) },
            ]}
          />
        </Card>
      </div>

      {r.failedJobs.length > 0 && (
        <Card className="mt-5" title="Nieudane zadania z kolejek w 24 godz." pad={false}>
          <DataTable
            dense
            rows={r.failedJobs}
            rowKey={(j) => j.name}
            columns={[
              { key: "n", label: "Kolejka", render: (j) => <span className="font-mono text-[12.5px]">{j.name}</span> },
              { key: "c", label: "Błędy", align: "right", render: (j) => num(j.failed) },
              { key: "l", label: "Ostatnio", render: (j) => <Time at={j.last} /> },
              { key: "o", label: "Ostatni błąd", render: (j) => <span className="line-clamp-2 font-mono text-[11.5px] text-ink-3">{j.last_output}</span> },
            ]}
          />
        </Card>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card title="Płatne pokwitowania do sprawdzenia" right={<span>{Object.entries(r.receipts.counts).map(([k, v]) => `${k} ${v}`).join(" · ")}</span>} pad={false}>
          <DataTable
            dense
            rows={r.receipts.issues}
            rowKey={(x) => x.id}
            empty="Brak pokwitowań do sprawdzenia"
            columns={[
              { key: "id", label: "Pokwitowanie", render: (x) => <span className="num">#{x.id}</span> },
              { key: "s", label: "Stan", render: (x) => <Badge tone={x.status === "unknown" ? "bad" : "warn"}>{x.status}</Badge> },
              { key: "w", label: "Usługa", render: (x) => <span className="whitespace-nowrap">{x.service}{x.model ? ` · ${x.model}` : ""}</span> },
              { key: "p", label: "Cel", render: (x) => (x.subject && /^[\w-]{10,}$/.test(x.subject) && x.purpose.includes("analy") ? <Link className="text-accent" to={`/admin/content/${x.subject}`}>{x.purpose}</Link> : x.purpose) },
              { key: "e", label: "Błąd", render: (x) => <span className="line-clamp-2 text-[12px] text-ink-3" title={x.error ?? ""}>{x.error}</span> },
              { key: "a", label: "", render: (x) => (x.status === "unknown" ? <Button size="sm" onClick={() => setReceipt(x)}>Sprawdź</Button> : null) },
            ]}
          />
        </Card>
        <Card title="Wysyłki do sprawdzenia" pad={false}>
          <DataTable
            dense
            rows={r.deliveries}
            rowKey={(d) => d.id}
            empty="Brak wysyłek do sprawdzenia"
            columns={[
              { key: "t", label: "Cel", render: (d) => d.target_key },
              { key: "s", label: "Stan", render: (d) => <Badge tone={d.status === "unknown" ? "bad" : "warn"}>{d.status}</Badge> },
              { key: "sub", label: "Treść", render: (d) => (d.subject_kind === "selected" ? <Link className="text-accent" to={`/admin/content/${d.subject_id}`}>{d.subject_id}</Link> : `${d.subject_kind} ${d.subject_id}`) },
              { key: "at", label: "Czas", render: (d) => <Time at={d.updated_at} /> },
              { key: "a", label: "", render: (d) => <Button size="sm" onClick={() => setDelivery(d)}>Obsłuż</Button> },
            ]}
          />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card title="Opóźnione lub nieudane źródła" right={<Link className="text-accent" to="/admin/sources?health=failing">Wszystkie źródła z błędami</Link>} pad={false}>
          <DataTable
            dense
            rows={r.lagging}
            rowKey={(s) => s.id}
            empty="Wszystkie źródła pobierane na czas"
            columns={[
              { key: "n", label: "Źródło", render: (s) => <Link className="text-ink hover:text-accent" to={`/admin/sources/${encodeURIComponent(s.id)}`}>{s.name}</Link> },
              { key: "h", label: "Stan", render: (s) => <Badge tone={s.health === "failing" ? "bad" : s.health === "degraded" ? "warn" : "muted"}>{s.health}</Badge> },
              { key: "ok", label: "Ostatni sukces", render: (s) => <Time at={s.last_ok_at} /> },
              { key: "nx", label: "Planowane", render: (s) => <Time at={s.next_fetch_at} /> },
              { key: "e", label: "Błąd", render: (s) => <span className="line-clamp-1 text-[12px] text-ink-3" title={s.last_error ?? ""}>{s.last_error}</span> },
            ]}
          />
        </Card>
        <Card
          title="Błędy przetwarzania (30 dni, według rodzaju)"
          right={
            <span className="flex items-center gap-3">
              {r.retrying.count > 0 && <span>czeka na ponowienie: {num(r.retrying.count)} · następne <Time at={r.retrying.next} /></span>}
              {r.errors.length > 0 && <Button size="sm" onClick={() => setRequeue("")}>Przetwórz wszystkie ponownie</Button>}
            </span>
          }
          pad={false}
        >
          <DataTable
            dense
            rows={r.errors}
            rowKey={(e) => e.error}
            empty="Brak błędów przetwarzania"
            columns={[
              { key: "e", label: "Błąd", render: (e) => <span className="font-mono text-[11.5px] text-ink-2">{e.error}</span> },
              { key: "n", label: "Liczba", align: "right", render: (e) => num(e.n) },
              { key: "x", label: "Przykład", render: (e) => <Link className="text-accent" to={`/admin/content/${e.example}`}>Zobacz</Link> },
              { key: "l", label: "Ostatnio", render: (e) => <Time at={e.last} /> },
              { key: "a", label: "", align: "right", render: (e) => <Button size="sm" onClick={() => setRequeue(e.error)}>Przetwórz ponownie</Button> },
            ]}
          />
        </Card>
      </div>

      {PARTS.map(({ name, part: Part }) => (r.modules[name] != null ? <Part key={name} data={r.modules[name]} /> : null))}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card title="Oś czasu zadań" pad={false}>
          <div className="max-h-[420px] overflow-y-auto">
            <DataTable
              dense
              rows={r.timeline}
              rowKey={(t) => t.id}
              columns={[
                { key: "at", label: "Start", render: (t) => <span className="num whitespace-nowrap">{bj(t.started_at)}</span> },
                { key: "j", label: "Zadanie", render: (t) => <span className="font-mono text-[12px]">{t.job}</span> },
                { key: "s", label: "Wynik", render: (t) => <Badge tone={t.status === "ok" ? "ok" : t.status === "failed" ? "bad" : "muted"} title={t.error ?? undefined}>{t.status ?? "w toku"}</Badge> },
                { key: "d", label: "Czas trwania", align: "right", render: (t) => duration(t.started_at, t.finished_at) },
              ]}
            />
          </div>
        </Card>
        <Card title="Zewnętrzne zgłoszenia" pad={false}>
          {r.ingest.length ? (
            <DataTable
              dense
              rows={r.ingest}
              rowKey={(e) => `${e.client}-${e.created_at}`}
              columns={[
                { key: "at", label: "Czas", render: (e) => <Time at={e.created_at} /> },
                { key: "c", label: "Klient", render: (e) => e.client },
                { key: "k", label: "Typ", render: (e) => e.kind },
                { key: "s", label: "Wynik", render: (e) => <Badge tone={e.status === "ok" ? "ok" : e.status === "error" ? "bad" : "muted"} title={e.error ?? undefined}>{e.status}</Badge> },
                { key: "x", label: "Podsumowanie", render: (e) => <Json value={e.summary} label="Podsumowanie" /> },
              ]}
            />
          ) : (
            <Empty>{`Brak zewnętrznych zgłoszeń (${ingestClients().join(", ")})`}</Empty>
          )}
        </Card>
      </div>

      {r.processes.length > 0 && (
        <Card className="mt-5" title="Procesy">
          <ul className="grid gap-2 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
            {r.processes.map((p) => (
              <li key={p.role} className="flex items-center gap-2">
                <Dot tone={p.alive ? "ok" : "bad"} />
                <span className="font-medium">{p.role}</span>
                <span className="text-ink-3">{p.host} · pid {p.pid} · {p.release} · start {bj(p.startedAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ReasonDialog
        open={!!receipt}
        title={`Sprawdź pokwitowanie #${receipt?.id ?? ""}`}
        description="Zapytania bez znanego wyniku nie są ponawiane automatycznie. Najpierw sprawdź w konsoli dostawcy, czy zostało naliczone, potem zwolnij: kolejne przetwarzanie wywoła model ponownie."
        confirmLabel="Zapisz i zwolnij"
        busy={pending === "release"}
        onClose={() => setReceipt(null)}
        onSubmit={async (note) => (await run("POST", `/api/admin/receipts/${receipt!.id}/release`, { billed: billed === "true", note }, { label: "release", success: "Zwolniono" })) !== null}
      >
        <Field label="Czy dostawca naliczył opłatę">
          <Select value={billed} onChange={(e) => setBilled(e.target.value)}>
            <option value="false">Nie naliczono (zapytanie nie zostało przyjęte)</option>
            <option value="true">Naliczono (wyniku nie odebrano)</option>
          </Select>
        </Field>
      </ReasonDialog>
      <ReasonDialog
        open={requeue !== null}
        title={requeue ? "Przetwórz ponownie ten rodzaj błędów" : "Przetwórz ponownie wszystkie błędy"}
        description="Te teksty wrócą do kolejki przetwarzania (treść, ocena, publikacja). Wywołania modelu zużyją limit ponownie; treści odrzucone przez dostawcę mogą znów się nie udać."
        confirmLabel="Przetwórz ponownie"
        busy={pending === "requeue"}
        onClose={() => setRequeue(null)}
        onSubmit={async (reason) => (await run("POST", "/api/admin/processing/requeue", { group: requeue || null, reason }, { label: "requeue", success: "Dodano ponownie do kolejki" })) !== null}
      />
      <ReasonDialog
        open={!!delivery}
        title="Obsłuż wysyłkę"
        description="Najpierw sprawdź w grupie docelowej, czy wiadomość dotarła. Wyślij ponownie tylko, gdy jej nie ma; środowisko dev nic nie wysyła."
        confirmLabel="Potwierdź"
        danger={outcome === "resend"}
        busy={pending === "delivery"}
        onClose={() => setDelivery(null)}
        onSubmit={async (note) => (await run("POST", `/api/admin/deliveries/${delivery!.id}/resolve`, { outcome, note }, { label: "delivery", success: "Obsłużono" })) !== null}
      >
        <Field label="Wynik">
          <Select value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)}>
            <option value="sent">Dotarło, oznacz jako dostarczone</option>
            <option value="drop">Nie wysyłaj więcej</option>
            <option value="resend">Nie dotarło, wyślij ponownie</option>
          </Select>
        </Field>
      </ReasonDialog>
    </AdminPage>
  );
}
