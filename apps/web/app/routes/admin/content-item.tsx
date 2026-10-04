import { SITE } from "@aihot/site";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "@aihot/contracts/taxonomy";
import type { Route } from "./+types/content-item";
import type { AdminContentChain } from "@aihot/contracts/admin";
import { adminGet } from "../../lib/admin.server";
import { useAdminAction } from "../../features/admin/action";
import { bj, money } from "../../features/admin/format";
import { KIND_LABEL, MODE_LABEL, VISIBILITY_LABEL } from "../../features/admin/labels";
import { AdminPage, Badge, Button, Card, Empty, Field, Input, Json, KV, ReasonDialog, Select, Textarea } from "../../features/admin/ui";


export async function loader({ request, params }: Route.LoaderArgs) {
  return adminGet<AdminContentChain>(request, `/api/admin/content/${encodeURIComponent(params.id)}`);
}

export const meta: Route.MetaFunction = ({ loaderData }) => [{ title: `${loaderData?.publication?.title ?? loaderData?.article.title ?? "Treść"} · panel ${SITE.name}` }];

function Step({ title, meta, children, tone = "accent", last }: { title: ReactNode; meta?: ReactNode; children: ReactNode; tone?: "accent" | "muted" | "bad"; last?: boolean }) {
  const dot = tone === "bad" ? "bg-hot" : tone === "muted" ? "bg-ink-4" : "bg-accent";
  return (
    <li className="relative pl-7">
      {!last && <span className="absolute left-[7px] top-4 h-full w-px bg-line-strong" aria-hidden />}
      <span className={`absolute left-[3px] top-[7px] size-[9px] rounded-full ring-4 ring-bg ${dot}`} aria-hidden />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-[13.5px] font-semibold text-ink">{title}</h3>
        {meta && <div className="text-[12px] text-ink-4">{meta}</div>}
      </div>
      <div className="mt-2 pb-6 text-[13px] text-ink-2">{children}</div>
    </li>
  );
}

type Dialog = null | "visibility" | "seo" | "override" | "analyze" | "extract" | "group" | "detach" | "merge";

export default function ContentItem({ loaderData }: Route.ComponentProps) {
  const c = loaderData;
  const a = c.article;
  const p = c.publication;
  const { run, pending } = useAdminAction();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [visibility, setVisibility] = useState<string>(p?.visibility ?? "public");
  const [fields, setFields] = useState({ title: "", summary: "", reason: "", category: "", tags: "", selected: "", silent: "" });
  const [mergeInto, setMergeInto] = useState("");
  const version = c.override?.version ?? 0;
  const base = `/api/admin/content/${encodeURIComponent(a.id)}`;
  const story = c.membership[0];
  const title = p?.title ?? a.title;

  const openOverride = () => {
    const f = (c.override?.fields ?? {}) as Record<string, unknown>;
    setFields({
      title: String(f.title ?? ""),
      summary: String(f.summary ?? ""),
      reason: String(f.reason ?? ""),
      category: String(f.category ?? ""),
      tags: Array.isArray(f.tags) ? (f.tags as string[]).join(", ") : "",
      selected: f.selected === undefined ? "" : String(f.selected),
      silent: f.silent === undefined ? "" : String(f.silent),
    });
    setDialog("override");
  };

  return (
    <AdminPage
      title={<span className="line-clamp-2">{title}</span>}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[12px]">{a.id}</span>
          <span>·</span>
          <Link className="hover:text-accent" to={`/admin/sources/${encodeURIComponent(a.source_id)}`}>{a.source_name}</Link>
          <span>·</span>
          <a className="max-w-[420px] truncate hover:text-accent" href={a.url} target="_blank" rel="noreferrer">{a.url}</a>
          {p?.visibility !== "withdrawn" && p && (
            <>
              <span>·</span>
              <a className="text-accent" href={`/items/${a.id}`} target="_blank" rel="noreferrer">Strona publiczna</a>
            </>
          )}
        </span>
      }
      actions={
        <>
          <Button onClick={() => setDialog("visibility")}>Widoczność</Button>
          {p && <Button onClick={() => setDialog("seo")}>{p.indexable ? "Wyłącz indeksowanie" : "Oznacz do indeksowania"}</Button>}
          <Button onClick={openOverride}>Ręczna poprawka</Button>
          <Button onClick={() => setDialog("analyze")}>Oceń ponownie</Button>
        </>
      }
    >
      <div className="mb-5 flex flex-wrap gap-1.5">
        {p ? <Badge tone={p.visibility === "public" ? "ok" : "warn"}>{VISIBILITY_LABEL[p.visibility] ?? p.visibility}</Badge> : <Badge>Niepubliczne</Badge>}
        {p?.selected && <Badge tone="accent">Wybrane</Badge>}
        {p?.eligible === false && <Badge>Poza publikacją</Badge>}
        {a.backfill && <Badge tone="warn">Import historyczny</Badge>}
        <Badge>przetwarzanie: {a.processing_state}</Badge>
        {c.override && <Badge tone="info" title={c.override.reason ?? undefined}>ręczne ustawienia v{c.override.version}</Badge>}
      </div>
      {a.processing_error && <div className="mb-5 rounded-card bg-hot-soft px-4 py-3 text-[13px] text-hot ring-1 ring-hot/20">{a.processing_error}</div>}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card title="Ścieżka przetwarzania">
          <ol className="pt-1">
            <Step title="Źródło" meta={`${KIND_LABEL[a.source_kind] ?? a.source_kind} · ${String(a.tier).replace("_", ".")} · ${MODE_LABEL[a.participation_mode] ?? a.participation_mode}`}>
              <Link className="text-ink hover:text-accent" to={`/admin/sources/${encodeURIComponent(a.source_id)}`}>{a.source_name}</Link>
              <span className="text-ink-4"> · pełny tekst na stronie: {a.site_fulltext ? "tak" : "nie"} · pełny tekst w API: {a.syndicate_fulltext ? "tak" : "nie"}</span>
            </Step>
            <Step title="Znalezienie" meta={`razy: ${c.discoveries.length}`}>
              <ul className="space-y-1">
                {c.discoveries.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="num text-ink-4">{bj(d.discovered_at, true)}</span>
                    <span>{d.via}</span>
                    {d.source_id !== a.source_id && <span className="text-ink-3">przez {d.source_id}</span>}
                  </li>
                ))}
              </ul>
              <div className="mt-1.5 text-[12px] text-ink-4">
                Data oryginału {a.published_at ? bj(a.published_at, true) : "nieznana"}{a.published_at_claim && !a.published_at ? ` (deklarowana ${a.published_at_claim}, nieprzyjęta)` : ""} · oś czasu {bj(a.timeline_at, true)}
              </div>
            </Step>
            <Step title="Treść i wersje" meta={`wersja ${a.revision} · treść ${a.body_status} · ${a.body_chars ?? 0} znaków`}>
              {c.revisions.length ? (
                <ul className="space-y-1">
                  {c.revisions.map((r) => (
                    <li key={r.revision} className="flex gap-2">
                      <span className="num text-ink-4">v{r.revision}</span>
                      <span className="min-w-0 flex-1 truncate">{r.title}</span>
                      <span className="num shrink-0 text-ink-4">{bj(r.created_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-ink-4">Tylko wersja początkowa</span>
              )}
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => setDialog("extract")}>Pobierz treść ponownie</Button>
              </div>
            </Step>
            <Step title="Ocena modelu" meta={`razy: ${c.analyses.length}`} tone={c.analyses.length ? "accent" : "muted"}>
              {c.analyses.length ? (
                <div className="space-y-3">
                  {c.analyses.map((an) => (
                    <div key={an.id} className="rounded-control bg-bg-sunk/60 p-3 ring-1 ring-line">
                      <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                        <Badge tone={an.relevance === "pass" ? "ok" : "muted"}>{an.relevance}</Badge>
                        {an.selected && <Badge tone="accent">wybrane</Badge>}
                        <Badge tone="info">ocena {an.score}</Badge>
                        {an.category && <Badge>{CATEGORY_LABELS[an.category as keyof typeof CATEGORY_LABELS] ?? an.category}</Badge>}
                        <span className="text-ink-4">{an.model} · {an.prompt_version} · wejście v{an.input_revision} · {an.origin} · {bj(an.created_at)}</span>
                      </div>
                      {an.title_zh && <div className="mt-2 font-medium text-ink">{an.title_zh}</div>}
                      {an.reason_zh && <div className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{an.reason_zh}</div>}
                      {an.receipts.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11.5px]">
                          {an.receipts.map((r) => (
                            <span key={r.id} className="num rounded bg-surface px-1.5 py-0.5 text-ink-3 ring-1 ring-line">
                              pokwitowanie #{r.id} · {r.status} · {r.model ?? r.service}{r.cost !== null ? ` · ${money(r.cost)}` : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-ink-4">{a.participation_mode === "editorial" ? "Jeszcze nie oceniono (w kolejce albo błąd)" : "Źródła-sygnały nie są oceniane redakcyjnie"}</span>
              )}
            </Step>
            <Step title="Publikacja" tone={p ? (p.visibility === "withdrawn" ? "bad" : "accent") : "muted"} meta={p ? `zaktualizowano ${bj(p.updated_at, true)}` : undefined}>
              {p ? (
                <KV
                  items={[
                    ["Widoczność", VISIBILITY_LABEL[p.visibility] ?? p.visibility],
                    ["Wybrane", p.selected ? `tak · widoczne od ${p.visible_after ? bj(p.visible_after, true) : "zaraz"}` : "nie"],
                    ["Kategoria", p.category ? CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] ?? p.category : null],
                    ["Tagi", (p.tags as string[] | null)?.join(", ")],
                    ["Streszczenie", p.summary],
                    ["Dlaczego warto", p.reason],
                    [
                      "Wyświetlanie treści",
                      `${p.body_mode}${p.syndicate ? " · pełny tekst w API" : ""}${
                        p.indexable ? (p.seo_indexed_at ? " · indeksowane (ręcznie)" : " · indeksowane (automatycznie jako wybrane)") : p.seo_excluded_at ? " · nieindeksowane (wykluczone ręcznie)" : " · nieindeksowane"
                      }`,
                    ],
                  ]}
                />
              ) : (
                <span className="text-ink-4">Brak wersji publicznej (nie przeszło odsiewu albo wciąż w przetwarzaniu)</span>
              )}
              {c.override && (
                <div className="mt-3 rounded-control bg-accent-softer p-3 ring-1 ring-accent/15">
                  <div className="text-[12px] text-ink-3">ręczne ustawienia v{c.override.version} · {c.override.updated_by} · {bj(c.override.updated_at, true)}{c.override.reason ? ` · ${c.override.reason}` : ""}</div>
                  <Json value={{ visibility: c.override.visibility, ...c.override.fields }} label="Nadpisane pola" collapsed={false} />
                </div>
              )}
            </Step>
            <Step title="Dziennik synchronizacji wybranych" meta={`wpisy: ${c.ledger.length}`} tone={c.ledger.length ? "accent" : "muted"}>
              {c.ledger.length ? (
                <ul className="space-y-1">
                  {c.ledger.map((l) => (
                    <li key={l.seq} className="flex gap-2">
                      <span className="num text-ink-4">#{l.seq}</span>
                      <Badge tone={l.op === "remove" ? "warn" : "ok"}>{l.op}</Badge>
                      <span className="num text-ink-4">widoczne {bj(l.visible_at)} · zapisane {bj(l.changed_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-ink-4">Nigdy nie trafiło do synchronizacji wybranych</span>
              )}
            </Step>
            <Step title="Grupowanie w wydarzenia" tone={story ? "accent" : "muted"} meta={a.grouped_at ? `pogrupowano ${bj(a.grouped_at, true)}` : "niepogrupowane"}>
              {c.membership.map((m) => (
                <div key={m.fact_id} className="mb-2">
                  <div>
                    fakt <span className="font-mono text-[12px]">#{m.fact_id}</span> {m.fact_title} <Badge>{m.role}</Badge> {m.manual && <Badge tone="info">ręcznie</Badge>}
                  </div>
                  {m.story_public_id && (
                    <div className="mt-0.5">
                      wydarzenie <a className="text-accent" href={`/story/${m.story_public_id}`} target="_blank" rel="noreferrer">{m.story_title}</a> <span className="font-mono text-[12px] text-ink-4">#{m.story_id}</span>
                    </div>
                  )}
                </div>
              ))}
              {c.decisions.length > 0 && (
                <ul className="mt-2 space-y-1 text-[12.5px]">
                  {c.decisions.map((d, i) => (
                    <li key={i} className="flex flex-wrap gap-2">
                      <span className="num text-ink-4">{bj(d.created_at)}</span>
                      <Badge>{d.verdict}</Badge>
                      {d.fact_id && <span>fakt #{d.fact_id}</span>}
                      {d.receipt_id && <span className="text-ink-4">pokwitowanie #{d.receipt_id}</span>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setDialog("group")}>Pogrupuj ponownie</Button>
                {c.membership.length > 0 && <Button size="sm" onClick={() => setDialog("detach")}>Odłącz od wydarzenia</Button>}
                {story?.story_id && <Button size="sm" onClick={() => setDialog("merge")}>Scal to wydarzenie z…</Button>}
              </div>
            </Step>
            <Step title="Wysyłki" last meta={`wpisy: ${c.deliveries.length}`} tone={c.deliveries.some((d) => d.status === "unknown") ? "bad" : c.deliveries.length ? "accent" : "muted"}>
              {c.deliveries.length ? (
                <ul className="space-y-1">
                  {c.deliveries.map((d, i) => (
                    <li key={i} className="flex flex-wrap gap-2">
                      <span>{d.target_key}</span>
                      <Badge tone={d.status === "sent" ? "ok" : d.status === "unknown" ? "bad" : "muted"}>{d.status}</Badge>
                      <span className="num text-ink-4">{bj(d.created_at)}{d.sent_at ? ` → ${bj(d.sent_at)}` : ""}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-ink-4">Brak wysyłek</span>
              )}
            </Step>
          </ol>
        </Card>

        <div className="space-y-5">
          <Card title="Dane źródłowe">
            <KV
              items={[
                ["Tytuł oryginału", a.title],
                ["Autor", a.author],
                ["Język", a.language],
                ["Klucz tożsamości", <span className="break-all font-mono text-[11.5px]">{a.identity_key}</span>],
              ]}
            />
          </Card>
          <Card title="Historia zmian">
            {c.history.length ? (
              <ul className="space-y-3 text-[12.5px]">
                {c.history.map((h, i) => (
                  <li key={i}>
                    <div className="text-ink-2"><span className="font-medium">{h.action}</span> · {h.actor} · {bj(h.created_at)}</div>
                    {h.reason && <div className="text-ink-3">{h.reason}</div>}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Brak ręcznych operacji</Empty>
            )}
          </Card>
        </div>
      </div>

      <ReasonDialog
        open={dialog === "seo"}
        title={p?.indexable ? "Wyłącz indeksowanie w wyszukiwarkach" : "Oznacz do indeksowania"}
        description={
          p?.indexable
            ? "Strona wpisu wraca do noindex i znika z mapy strony; nawet jako wybrana nie będzie indeksowana, dopóki nie oznaczysz jej ponownie."
            : "Strony wpisów mają domyślnie noindex, wybrane są indeksowane automatycznie. Po oznaczeniu (tylko gdy publiczna) strona dostaje index, trafia do mapy strony i do następnego zgłoszenia IndexNow. Dla treści z samodzielną wartością i pełnym streszczeniem."
        }
        confirmLabel={p?.indexable ? "Wyłącz indeksowanie" : "Oznacz"}
        busy={pending === "seo"}
        onClose={() => setDialog(null)}
        onSubmit={async (reason) => (await run("POST", `${base}/seo`, { indexed: !p?.indexable, reason }, { label: "seo", success: p?.indexable ? "Wyłączono indeksowanie" : "Oznaczono do indeksowania" })) !== null}
      />

      <ReasonDialog
        open={dialog === "visibility"}
        title="Widoczność"
        description="Zmiana działa jednocześnie na stronę, API, RSS, MCP, synchronizację i indeks wyszukiwania oraz odświeża cache. Gdy źródło prosi o wycofanie, najpierw sprawdź tożsamość i zakres."
        danger={visibility === "withdrawn"}
        confirmLabel="Zastosuj"
        busy={pending === "visibility"}
        onClose={() => setDialog(null)}
        onSubmit={async (reason) => (await run("POST", `${base}/visibility`, { visibility, reason, version }, { label: "visibility", success: "Zaktualizowano widoczność" })) !== null}
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {([
            ["public", "Publiczne", "zwykłe wyświetlanie"],
            ["summary-only", "Tylko streszczenie", "bez treści, zostaje tytuł i streszczenie"],
            ["withdrawn", "Wycofane", "usunięte ze wszystkich kanałów, link daje 404"],
          ] as const).map(([v, label, hint]) => (
            <label key={v} className={`cursor-pointer rounded-card p-3 ring-1 transition-colors ${visibility === v ? "bg-accent-soft ring-accent" : "ring-line-strong hover:bg-bg-sunk"}`}>
              <input type="radio" name="visibility" className="sr-only" checked={visibility === v} onChange={() => setVisibility(v)} />
              <div className="text-[13.5px] font-medium text-ink">{label}</div>
              <div className="mt-0.5 text-[12px] text-ink-3">{hint}</div>
            </label>
          ))}
        </div>
      </ReasonDialog>

      <ReasonDialog
        open={dialog === "override"}
        title="Ręczna poprawka"
        description="Wartości ręczne mają pierwszeństwo przed modelem i ponowne przetwarzanie ich nie nadpisze; puste pole oznacza brak poprawki (żeby usunąć istniejącą, wybierz „Wyczyść”)."
        confirmLabel="Zapisz poprawkę"
        busy={pending === "override"}
        onClose={() => setDialog(null)}
        onSubmit={async (reason) => {
          const next: Record<string, unknown> = {};
          const clear: string[] = [];
          for (const k of ["title", "summary", "reason"] as const) {
            if (fields[k].trim()) next[k] = fields[k].trim();
            else if (c.override?.fields[k] !== undefined) clear.push(k);
          }
          if (fields.category) next.category = fields.category;
          else if (c.override?.fields.category !== undefined) clear.push("category");
          if (fields.tags.trim()) next.tags = fields.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
          else if (c.override?.fields.tags !== undefined) clear.push("tags");
          for (const k of ["selected", "silent"] as const) {
            if (fields[k] === "true" || fields[k] === "false") next[k] = fields[k] === "true";
            else if (c.override?.fields[k] !== undefined) clear.push(k);
          }
          return (await run("POST", `${base}/override`, { fields: next, clear, reason, version }, { label: "override", success: "Zapisano poprawkę i opublikowano ponownie" })) !== null;
        }}
      >
        <Field label="Tytuł"><Input value={fields.title} placeholder={p?.title ?? ""} onChange={(e) => setFields({ ...fields, title: e.target.value })} /></Field>
        <Field label="Streszczenie"><Textarea rows={3} value={fields.summary} placeholder={p?.summary ?? ""} onChange={(e) => setFields({ ...fields, summary: e.target.value })} /></Field>
        <Field label="Dlaczego warto"><Textarea rows={2} value={fields.reason} placeholder={p?.reason ?? ""} onChange={(e) => setFields({ ...fields, reason: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kategoria">
            <Select value={fields.category} onChange={(e) => setFields({ ...fields, category: e.target.value })}>
              <option value="">Bez poprawki</option>
              {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>)}
            </Select>
          </Field>
          <Field label="Tagi (po przecinku)"><Input value={fields.tags} onChange={(e) => setFields({ ...fields, tags: e.target.value })} /></Field>
          <Field label="Wybór">
            <Select value={fields.selected} onChange={(e) => setFields({ ...fields, selected: e.target.value })}>
              <option value="">Według modelu</option>
              <option value="true">Zawsze wybierz</option>
              <option value="false">Nigdy nie wybieraj</option>
            </Select>
          </Field>
          <Field label="Powiadomienia">
            <Select value={fields.silent} onChange={(e) => setFields({ ...fields, silent: e.target.value })}>
              <option value="">Normalnie</option>
              <option value="true">Wyciszone (bez powiadomień nawet po wyborze)</option>
              <option value="false">Bez wyciszenia</option>
            </Select>
          </Field>
        </div>
      </ReasonDialog>

      <ReasonDialog
        open={dialog === "analyze"}
        title="Oceń bieżącą wersję ponownie"
        description="Wywoła model jeszcze raz (zużywa limit i zapisuje pokwitowanie). Wielokrotne kliknięcie tego samego zgłoszenia nie nalicza podwójnie."
        requireReason={false}
        confirmLabel="Oceń ponownie"
        busy={pending === "analyze"}
        onClose={() => setDialog(null)}
        onSubmit={async () => (await run("POST", `${base}/rerun`, { step: "analyze" }, { label: "analyze", success: "Dodano do kolejki oceny" })) !== null}
      />
      <ReasonDialog
        open={dialog === "extract"}
        title="Pobierz treść ponownie"
        requireReason={false}
        confirmLabel="Pobierz ponownie"
        busy={pending === "extract"}
        onClose={() => setDialog(null)}
        onSubmit={async () => (await run("POST", `${base}/rerun`, { step: "extract" }, { label: "extract", success: "Dodano do kolejki pobierania treści" })) !== null}
      />
      <ReasonDialog
        open={dialog === "group"}
        title="Pogrupuj ponownie"
        description="Ręcznie ustawione przynależności nie zostaną nadpisane."
        requireReason={false}
        confirmLabel="Pogrupuj ponownie"
        busy={pending === "group"}
        onClose={() => setDialog(null)}
        onSubmit={async () => (await run("POST", `${base}/rerun`, { step: "group" }, { label: "group", success: "Dodano do kolejki grupowania" })) !== null}
      />
      <ReasonDialog
        open={dialog === "detach"}
        title="Odłącz od wydarzenia"
        description="Wpis będzie wyświetlany samodzielnie, a strona wydarzenia zaktualizuje się."
        danger
        confirmLabel="Odłącz"
        busy={pending === "detach"}
        onClose={() => setDialog(null)}
        onSubmit={async (reason) => (await run("POST", `${base}/detach`, { reason }, { label: "detach", success: "Odłączono od wydarzenia" })) !== null}
      />
      <ReasonDialog
        open={dialog === "merge"}
        title="Scal wydarzenia"
        description={`Scala wydarzenie #${story?.story_id} (${story?.story_title ?? ""}) z innym; stare linki przekierują do nowego wydarzenia.`}
        danger
        confirmLabel="Scal"
        busy={pending === "merge"}
        onClose={() => setDialog(null)}
        onSubmit={async (reason) => {
          if (!/^\d+$/.test(mergeInto.trim())) return false;
          return (await run("POST", "/api/admin/stories/merge", { from: story!.story_id, into: Number(mergeInto), reason }, { label: "merge", success: "Scalono wydarzenia" })) !== null;
        }}
      >
        <Field label="Numer wydarzenia docelowego" hint="#numer widać na stronie diagnostyki dowolnego wpisu z tego wydarzenia">
          <Input inputMode="numeric" value={mergeInto} onChange={(e) => setMergeInto(e.target.value)} placeholder="np. 1234" />
        </Field>
      </ReasonDialog>
    </AdminPage>
  );
}
