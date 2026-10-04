import { ADMIN, SITE } from "@aihot/site";
import { useState } from "react";
import { Form, useSearchParams } from "react-router";
import type { Route } from "./+types/feedback";
import type { AdminFeedback, AdminFeedbackRow } from "@aihot/contracts/admin";
import { adminGet } from "../../lib/admin.server";
import { useAdminAction } from "../../features/admin/action";
import { bj } from "../../features/admin/format";
import { FEEDBACK_STATUS } from "../../features/admin/labels";
import { AdminPage, Badge, Button, Card, Empty, FilterChips, Input, Pager, ReasonDialog, Select, Textarea, Time } from "../../features/admin/ui";



export async function loader({ request }: Route.LoaderArgs) {
  return adminGet<AdminFeedback>(request, `/api/admin/feedback${new URL(request.url).search}`);
}

export const meta: Route.MetaFunction = () => [{ title: `Opinie · panel ${SITE.name}` }];

const TONE: Record<string, "accent" | "warn" | "ok" | "muted"> = { new: "accent", triaged: "warn", replied: "ok", resolved: "ok", spam: "muted" };

function FeedbackCard({ f }: { f: AdminFeedbackRow }) {
  const { run, pending } = useAdminAction();
  const [note, setNote] = useState(f.note ?? "");
  const [dialog, setDialog] = useState<null | "ban" | "erase">(null);
  const base = `/api/admin/feedback/${f.id}`;
  const version = new Date(f.updated_at).toISOString();
  return (
    <article className="rounded-panel bg-surface p-4 ring-1 ring-line">
      <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-3">
        <span className="num font-medium text-ink-2">#{f.id}</span>
        <Badge tone={TONE[f.status] ?? "muted"}>{FEEDBACK_STATUS[f.status] ?? f.status}</Badge>
        <Time at={f.created_at} />
        {f.email && <a className="text-accent" href={`mailto:${f.email}`}>{f.email}</a>}
        {f.page_url && <a className="max-w-[320px] truncate hover:text-accent" href={f.page_url} target="_blank" rel="noreferrer">{f.page_url}</a>}
        {f.from_source > 1 && <Badge tone="info" title="To samo źródło (nieodwracalny identyfikator IP i rodziny przeglądarki)">{f.from_source} z tego źródła</Badge>}
        {f.banned && <Badge tone="bad">Źródło zablokowane</Badge>}
        {!f.forwarded_at && f.status === "new" && (
          <Badge tone="warn" title={f.forward_error && f.forward_error !== "pending" ? `Jeszcze nie przekazano do wewnętrznej grupy Feishu: ${f.forward_error}` : "Jeszcze nie przekazano do wewnętrznej grupy Feishu"}>Nieprzekazane</Badge>
        )}
      </div>
      <p className="mt-2.5 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{f.content}</p>
      {f.screenshot === "local" && (
        <a href={`${base}/screenshot`} target="_blank" rel="noreferrer" className="mt-2 inline-block">
          <img src={`${base}/screenshot`} alt="Zrzut ekranu z opinii" loading="lazy" className="max-h-48 rounded-control ring-1 ring-line" />
        </a>
      )}
      {f.screenshot === "feishu" && <p className="mt-2 text-[12.5px] text-ink-4">Zrzut ekranu przekazano z opinią do wewnętrznej grupy Feishu.</p>}
      {f.screenshot === "gone" && <p className="mt-2 text-[12.5px] text-ink-4">Nie udało się przekazać zrzutu ekranu do Feishu; usunięto go.</p>}
      <div className="mt-3 grid gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-start">
        <Select
          aria-label="Stan obsługi"
          value={f.status}
          disabled={!!pending}
          onChange={(e) => run("PATCH", base, { status: e.target.value, version }, { label: "status", success: "Zaktualizowano stan" })}
        >
          {Object.entries(FEEDBACK_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Textarea rows={1} className="!min-h-[38px]" placeholder="Notatka (widoczna tylko w panelu)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex gap-1.5">
          <Button size="md" disabled={note === (f.note ?? "")} busy={pending === "note"} onClick={() => run("PATCH", base, { note: note || null, version }, { label: "note", success: "Zapisano notatkę" })}>
            Zapisz notatkę
          </Button>
          <Button tone="ghost" onClick={() => setDialog(f.banned ? null : "ban")} disabled={f.banned} title="Odrzucaj kolejne opinie z tego źródła">Zablokuj źródło</Button>
          <Button tone="ghost" onClick={() => setDialog("erase")} title="Usuń dane zgłaszającego zgodnie z polityką prywatności">Usuń dane</Button>
        </div>
      </div>
      <ReasonDialog
        open={dialog === "ban"}
        title="Zablokuj to źródło opinii"
        description={`Kolejne opinie z tego źródła zostaną odrzucone. Z identyfikatora źródła nie da się odtworzyć IP. ${ADMIN.banNote ?? ""}`}
        danger
        confirmLabel="Zablokuj"
        onClose={() => setDialog(null)}
        onSubmit={async (reason) => (await run("POST", "/api/admin/feedback-bans", { sourceHash: f.source_hash, reason }, { label: "ban", success: "Zablokowano" })) !== null}
      />
      <ReasonDialog
        open={dialog === "erase"}
        title="Usuń dane zgłaszającego"
        description="Usuwa treść, e-mail, adres strony i zrzut ekranu; zostaje tylko zapis obsługi. Nie da się tego cofnąć."
        danger
        confirmLabel="Usuń"
        onClose={() => setDialog(null)}
        onSubmit={async (reason) => (await run("POST", `${base}/erase`, { reason }, { label: "erase", success: "Usunięto dane" })) !== null}
      />
    </article>
  );
}

export default function FeedbackAdmin({ loaderData }: Route.ComponentProps) {
  const { rows, counts, bans, page } = loaderData;
  const [sp] = useSearchParams();
  const { run } = useAdminAction();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <AdminPage title="Opinie" subtitle={ADMIN.feedbackNote}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          param="status"
          options={[{ value: "", label: "Wszystkie", count: total }, ...Object.entries(FEEDBACK_STATUS).map(([k, v]) => ({ value: k, label: v, count: counts[k] ?? 0 }))]}
        />
        <Form method="get" className="w-full max-w-xs">
          {sp.get("status") && <input type="hidden" name="status" value={sp.get("status")!} />}
          <Input name="q" defaultValue={sp.get("q") ?? ""} placeholder="Szukaj w treści, e-mailu, stronie" aria-label="Szukaj opinii" />
        </Form>
      </div>
      <div className="space-y-3">
        {rows.length ? rows.map((f) => <FeedbackCard key={`${f.id}-${f.updated_at}`} f={f} />) : <Card><Empty>Brak pasujących opinii</Empty></Card>}
      </div>
      <Pager page={page} hasMore={rows.length === 50} />
      {bans.length > 0 && (
        <Card className="mt-8" title="Zablokowane źródła">
          <ul className="space-y-2 text-[13px]">
            {bans.map((b) => (
              <li key={b.source_hash} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-mono text-[12px] text-ink-3">{b.source_hash}</span> · {b.reason} · {b.created_by} · {bj(b.created_at, true)}
                </span>
                <Button size="sm" tone="ghost" onClick={() => run("DELETE", `/api/admin/feedback-bans/${encodeURIComponent(b.source_hash)}`, undefined, { label: `unban-${b.source_hash}`, success: "Odblokowano" })}>
                  Odblokuj
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AdminPage>
  );
}
