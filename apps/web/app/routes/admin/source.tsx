import { SITE } from "@aihot/site";
import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/source";
import type { AdminSource, AdminSourceDetail, AdminSourcePreview } from "@aihot/contracts/admin";
import { adminGet } from "../../lib/admin.server";
import { useAdminAction } from "../../features/admin/action";
import { bj, duration, num } from "../../features/admin/format";
import { HEALTH_LABEL, KIND_LABEL, MODE_LABEL, TIER_LABEL, VISIBILITY_LABEL } from "../../features/admin/labels";
import { AdminPage, Badge, Button, Card, DataTable, Dot, Empty, Field, healthTone, Input, Json, KV, ReasonDialog, Select, Stat, Textarea, Time } from "../../features/admin/ui";


/** X runs: pages read, and older stretches still to read (backlog) or given up (dropped). */



export async function loader({ request, params }: Route.LoaderArgs) {
  return adminGet<AdminSourceDetail>(request, `/api/admin/sources/${encodeURIComponent(params.id)}`);
}

export const meta: Route.MetaFunction = ({ loaderData }) => [{ title: `${loaderData?.source.name ?? "Źródło"} · panel ${SITE.name}` }];

type Draft = Pick<AdminSource, "name" | "interval_minutes" | "tier" | "participation_mode" | "signal_group_id" | "first_party" | "owner_entity_id" | "site_fulltext" | "syndicate_fulltext"> & { tags: string; config: string };

function draftOf(s: AdminSource): Draft {
  return {
    name: s.name,
    interval_minutes: s.interval_minutes,
    tier: s.tier,
    participation_mode: s.participation_mode,
    signal_group_id: s.signal_group_id,
    first_party: s.first_party,
    owner_entity_id: s.owner_entity_id,
    site_fulltext: s.site_fulltext,
    syndicate_fulltext: s.syndicate_fulltext,
    tags: s.tags.join(", "),
    config: JSON.stringify(s.config, null, 2),
  };
}

export default function SourceDetail({ loaderData }: Route.ComponentProps) {
  const { source: s, runs, items, stats, history } = loaderData;
  const { run, pending } = useAdminAction();
  const [draft, setDraft] = useState<Draft>(() => draftOf(s));
  const [draftFor, setDraftFor] = useState(s.updated_at);
  const [preview, setPreview] = useState<AdminSourcePreview | null>(null);
  const [dialog, setDialog] = useState<null | "save" | "toggle">(null);
  const [configError, setConfigError] = useState<string | null>(null);
  if (draftFor !== s.updated_at) {
    // The source changed (our own save or someone else's): start from the saved state.
    setDraft(draftOf(s));
    setDraftFor(s.updated_at);
  }
  const base = `/api/admin/sources/${encodeURIComponent(s.id)}`;

  const patch = (): Record<string, unknown> | null => {
    let config: unknown;
    try {
      config = JSON.parse(draft.config);
      setConfigError(null);
    } catch (e) {
      setConfigError(`Konfiguracja nie jest poprawnym JSON: ${(e as Error).message}`);
      return null;
    }
    const next: Record<string, unknown> = {
      ...draft,
      tags: draft.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      config,
      interval_minutes: Number(draft.interval_minutes),
      signal_group_id: draft.signal_group_id || null,
      owner_entity_id: draft.owner_entity_id || null,
    };
    const before = draftOf(s) as Record<string, unknown>;
    const changed: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(next)) {
      const was = k === "tags" ? s.tags : k === "config" ? s.config : before[k];
      if (JSON.stringify(v) !== JSON.stringify(was)) changed[k] = v;
    }
    return changed;
  };
  const changes = (() => {
    try {
      return Object.keys(patchPreview(draft, s)).length;
    } catch {
      return 1;
    }
  })();

  return (
    <AdminPage
      title={
        <span className="flex flex-wrap items-center gap-2">
          {s.name}
          <Badge>{KIND_LABEL[s.kind] ?? s.kind}</Badge>
          <Badge tone={s.participation_mode === "editorial" ? "accent" : "muted"}>{MODE_LABEL[s.participation_mode]}</Badge>
        </span>
      }
      subtitle={<span className="font-mono text-[12px]">{s.id}</span>}
      actions={
        <>
          <Button
            busy={pending === "preview"}
            onClick={async () => {
              const r = await run<AdminSourcePreview>("POST", `${base}/preview`, {}, { label: "preview", revalidate: false });
              if (r) setPreview(r);
            }}
          >
            Podgląd pobierania
          </Button>
          <Button busy={pending === "fetch"} onClick={() => run("POST", `${base}/fetch`, {}, { label: "fetch", success: "Dodano do kolejki pobierania" })}>
            Pobierz teraz
          </Button>
          <Button tone={s.enabled ? "danger" : "primary"} onClick={() => setDialog("toggle")}>
            {s.enabled ? "Wstrzymaj" : "Wznów"}
          </Button>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Stan"
          value={
            <span className="inline-flex items-center gap-2 text-[18px]">
              <Dot tone={s.enabled ? healthTone(s.health) : "muted"} />
              {s.enabled ? HEALTH_LABEL[s.health] ?? s.health : "Wstrzymane"}
            </span>
          }
          hint={s.fail_count ? `Błędy z rzędu: ${s.fail_count}` : `Ostatni sukces ${s.last_ok_at ? bj(s.last_ok_at) : "—"}`}
        />
        <Stat label="Wpisy łącznie" value={num(stats.total)} />
        <Stat label="Ostatnie 7 dni" value={num(stats.last7d)} />
        <Stat label="Wybrane" value={num(stats.selected)} />
      </div>
      {s.last_error && s.health !== "ok" && <div className="mb-5 rounded-card bg-hot-soft px-4 py-3 text-[13px] text-hot ring-1 ring-hot/20">{s.last_error}</div>}

      {preview && (
        <Card className="mb-5" title={`Podgląd: ${preview.count} wpisów (${preview.ms} ms, bez zapisu)`} right={<button onClick={() => setPreview(null)}>Zwiń</button>}>
          {preview.items.length ? (
            <ul className="space-y-2.5">
              {preview.items.map((i) => (
                <li key={i.url} className="text-[13px]">
                  <a href={i.url} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-accent">{i.title}</a>
                  <div className="text-[12px] text-ink-4">{i.publishedAt ? bj(i.publishedAt, true) : "brak daty publikacji"} · {i.url}</div>
                  {i.excerpt && <div className="mt-0.5 line-clamp-2 text-[12.5px] text-ink-3">{i.excerpt}</div>}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nie pobrano wpisów. Sprawdź adres, selektory albo wymóg logowania.</Empty>
          )}
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card title="Ustawienia" right={<span>Wersja {bj(s.updated_at, true)}</span>}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nazwa">
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </Field>
              <Field label="Co ile pobierać (minuty)">
                <Input type="number" min={1} max={1440} value={draft.interval_minutes} onChange={(e) => setDraft({ ...draft, interval_minutes: Number(e.target.value) })} />
              </Field>
              <Field label="Tryb udziału" hint="Sygnał tylko potwierdza, że temat jest omawiany, i nie staje się osobnym wpisem">
                <Select value={draft.participation_mode} onChange={(e) => setDraft({ ...draft, participation_mode: e.target.value })}>
                  {Object.entries(MODE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Poziom" hint="Tylko T1 to źródła z pierwszej ręki">
                <Select value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value })}>
                  {Object.entries(TIER_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="ID grupy dyskusji" hint="Wspólne dla kilku kont jednej organizacji; popularność liczona raz">
                <Input value={draft.signal_group_id ?? ""} onChange={(e) => setDraft({ ...draft, signal_group_id: e.target.value })} />
              </Field>
              <Field label="ID podmiotu prowadzącego">
                <Input value={draft.owner_entity_id ?? ""} onChange={(e) => setDraft({ ...draft, owner_entity_id: e.target.value })} />
              </Field>
              <Field label="Tagi (po przecinku)">
                <Input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
              </Field>
              <div className="flex flex-col justify-end gap-2 text-[13px] text-ink-2">
                {([
                  ["site_fulltext", "Pełny tekst na stronie"],
                  ["syndicate_fulltext", "Pełny tekst w API i kanałach"],
                ] as const).map(([k, label]) => (
                  <label key={k} className="inline-flex items-center gap-2">
                    <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.checked })} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <Field label="Konfiguracja pobierania (JSON)">
                <Textarea className="font-mono !text-[12px]" rows={Math.min(18, draft.config.split("\n").length + 1)} value={draft.config} onChange={(e) => setDraft({ ...draft, config: e.target.value })} spellCheck={false} />
              </Field>
              {configError && <div className="mt-1 text-[12.5px] text-hot">{configError}</div>}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              {changes > 0 && <span className="text-[12.5px] text-ink-3">Niezapisane zmiany: {changes}</span>}
              <Button tone="ghost" disabled={!changes} onClick={() => setDraft(draftOf(s))}>Cofnij</Button>
              <Button tone="primary" disabled={!changes} onClick={() => patch() && setDialog("save")}>Zapisz</Button>
            </div>
          </Card>

          <Card title="Ostatnie wpisy" pad={false}>
            <DataTable
              rows={items}
              rowKey={(r) => r.id}
              empty="Jeszcze nic nie pobrano"
              columns={[
                {
                  key: "t",
                  label: "Tytuł",
                  render: (r) => (
                    <Link to={`/admin/content/${r.id}`} className="line-clamp-2 min-w-[260px] text-ink hover:text-accent">{r.title_zh || r.title}</Link>
                  ),
                },
                { key: "s", label: "Stan", render: (r) => <span className="flex gap-1">{r.selected && <Badge tone="accent">Wybrane</Badge>}{r.visibility && r.visibility !== "public" && <Badge tone="warn">{VISIBILITY_LABEL[r.visibility]}</Badge>}<Badge>{r.processing_state}</Badge></span> },
                { key: "d", label: "Znaleziono", render: (r) => <Time at={r.discovered_at} /> },
              ]}
            />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Stan">
            <KV
              items={[
                ["Ostatnie pobranie", s.last_fetch_at ? bj(s.last_fetch_at, true) : null],
                ["Ostatni sukces", s.last_ok_at ? bj(s.last_ok_at, true) : null],
                ["Następne pobranie", s.next_fetch_at ? bj(s.next_fetch_at, true) : null],
                ["Utworzono", bj(s.created_at, true)],
              ]}
            />
            {s.cursor && <div className="mt-3"><Json value={s.cursor} label="Kursor" /></div>}
          </Card>
          <Card title="Historia pobrań" pad={false}>
            <DataTable
              dense
              rows={runs}
              rowKey={(r) => r.id}
              empty="Brak historii pobrań"
              columns={[
                { key: "at", label: "Czas", render: (r) => <span className="num whitespace-nowrap">{bj(r.started_at)}</span> },
                {
                  key: "st",
                  label: "Wynik",
                  render: (r) => (
                    <span className="inline-flex gap-1">
                      <Badge tone={r.status === "ok" ? "ok" : r.status === "failed" ? "bad" : "muted"} title={r.error ?? undefined}>{r.status}</Badge>
                      {!!r.detail?.dropped && <Badge tone="bad" title="Nie udało się doczytać fragmentu starszych wpisów; część mogła zostać pominięta">możliwe braki</Badge>}
                      {!r.detail?.dropped && !!r.detail?.backlog && <Badge tone="warn" title="Wpisów było więcej, niż mieści jedna runda; resztę doczytają kolejne">do doczytania: {r.detail.backlog}</Badge>}
                    </span>
                  ),
                },
                { key: "n", label: "Znalezione/nowe", align: "right", render: (r) => `${r.found_count ?? "—"}/${r.new_count ?? "—"}` },
                { key: "ms", label: "Czas trwania", align: "right", render: (r) => duration(r.started_at, r.finished_at) },
              ]}
            />
          </Card>
          <Card title="Historia zmian">
            {history.length ? (
              <ul className="space-y-3 text-[12.5px]">
                {history.map((h, i) => (
                  <li key={i}>
                    <div className="text-ink-2"><span className="font-medium">{h.action}</span> · {h.actor} · {bj(h.created_at)}</div>
                    {h.reason && <div className="text-ink-3">{h.reason}</div>}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Brak ręcznych zmian</Empty>
            )}
          </Card>
        </div>
      </div>

      <ReasonDialog
        open={dialog === "save"}
        title="Zapisz ustawienia źródła"
        description={`Zmienione pola: ${Object.keys(patchPreview(draft, s)).join(", ") || "brak"}`}
        busy={pending === "save"}
        onClose={() => setDialog(null)}
        onSubmit={async (reason) => {
          const p = patch();
          if (!p) return false;
          const r = await run("PATCH", base, { patch: p, version: new Date(s.updated_at).toISOString(), reason }, { label: "save", success: "Zapisano" });
          return r !== null;
        }}
      />
      <ReasonDialog
        open={dialog === "toggle"}
        title={s.enabled ? "Wstrzymaj to źródło" : "Wznów to źródło"}
        description={s.enabled ? "Po wstrzymaniu źródło nie jest pobierane; dotychczasowe treści i historia zostają." : "Po wznowieniu od razu trafi do kolejki pobierania."}
        danger={s.enabled}
        confirmLabel={s.enabled ? "Wstrzymaj" : "Wznów"}
        busy={pending === "toggle"}
        onClose={() => setDialog(null)}
        onSubmit={async (reason) => {
          const r = await run("PATCH", base, { patch: { enabled: !s.enabled }, version: new Date(s.updated_at).toISOString(), reason }, { label: "toggle", success: s.enabled ? "Wstrzymano" : "Wznowiono" });
          return r !== null;
        }}
      />
    </AdminPage>
  );
}

/** Field names that differ from the saved source (for the confirmation text). */
function patchPreview(draft: Draft, s: AdminSource): Record<string, true> {
  const out: Record<string, true> = {};
  const saved = draftOf(s);
  for (const k of Object.keys(draft) as Array<keyof Draft>) {
    if (k === "config") {
      try {
        if (JSON.stringify(JSON.parse(draft.config)) !== JSON.stringify(s.config)) out.config = true;
      } catch {
        out.config = true;
      }
    } else if (String(draft[k] ?? "") !== String(saved[k] ?? "")) out[k] = true;
  }
  return out;
}
