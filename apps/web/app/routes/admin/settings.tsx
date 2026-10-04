import { ADMIN, SITE } from "@aihot/site";
import { useRef, useState } from "react";
import type { Route } from "./+types/settings";
import type { AdminSettings } from "@aihot/contracts/admin";
import { adminGet } from "../../lib/admin.server";
import { useAdminAction } from "../../features/admin/action";
import { bj, num } from "../../features/admin/format";
import { AdminPage, Badge, Button, Card, DataTable, Input, ReasonDialog } from "../../features/admin/ui";
import { toast } from "../../features/admin/toast";


export async function loader({ request }: Route.LoaderArgs) {
  return adminGet<AdminSettings>(request, "/api/admin/settings");
}

export const meta: Route.MetaFunction = () => [{ title: `Ustawienia · panel ${SITE.name}` }];

function QrSlot({ slot, label, src }: { slot: "wechatQr" | "feishuQr"; label: string; src: string | null }) {
  const { run, pending } = useAdminAction();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-4">
      {src ? <img src={src} alt={label} className="size-28 rounded-card bg-white object-contain p-1.5 ring-1 ring-line" /> : <div className="flex size-28 shrink-0 items-center justify-center rounded-card bg-surface text-sm text-ink-4 ring-1 ring-line">Brak</div>}
      <div>
        <div className="text-[14px] font-medium text-ink">{label}</div>
        <div className="mt-0.5 break-all font-mono text-[11.5px] text-ink-4">{src}</div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) return toast("Obrazek może mieć najwyżej 2 MB", "error");
            const image = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            await run("POST", "/api/admin/settings/contact-qr", { slot, image }, { label: `qr-${slot}`, success: `Zmieniono: ${label}; strona „O serwisie” odświeży się w ciągu 5 minut` });
          }}
        />
        <Button className="mt-2" size="sm" busy={pending === `qr-${slot}`} onClick={() => input.current?.click()}>Zmień obrazek</Button>
      </div>
    </div>
  );
}

function BudgetRow({ b }: { b: AdminSettings["budgets"][number] }) {
  const { run, pending } = useAdminAction();
  const [v, setV] = useState({ perMinute: b.per_minute, perHour: b.per_hour, perDay: b.per_day });
  const [open, setOpen] = useState(false);
  const changed = v.perMinute !== b.per_minute || v.perHour !== b.per_hour || v.perDay !== b.per_day;
  return (
    <tr className="border-b border-line/70 last:border-0">
      <td className="px-3 py-2 font-mono text-[12.5px]">{b.service}</td>
      {(["perMinute", "perHour", "perDay"] as const).map((k) => (
        <td key={k} className="px-3 py-2">
          <Input type="number" min={0} className="!w-24 !py-1 text-right" value={v[k]} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} />
        </td>
      ))}
      <td className="num px-3 py-2 text-right text-ink-3">{num(b.used_hour)} / {num(b.used_day)}</td>
      <td className="px-3 py-2 text-right">
        <Button size="sm" tone="primary" disabled={!changed} onClick={() => setOpen(true)}>Zapisz</Button>
        <ReasonDialog
          open={open}
          title={`Limit zapytań: ${b.service}`}
          description={`Limit to bezpiecznik płatnych zapytań: po jego przekroczeniu zapytania czekają i ponawiają się w następnym oknie. 0 natychmiast wyłącza usługę. ${ADMIN.budgetNote ?? ""}`}
          confirmLabel="Zapisz"
          busy={pending === "budget"}
          onClose={() => setOpen(false)}
          onSubmit={async (reason) => (await run("PUT", `/api/admin/budgets/${encodeURIComponent(b.service)}`, { ...v, reason }, { label: "budget", success: "Zaktualizowano limit" })) !== null}
        />
      </td>
    </tr>
  );
}

function TargetToggle({ t }: { t: AdminSettings["targets"][number] }) {
  const { run, pending } = useAdminAction();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" tone={t.enabled ? "danger" : "primary"} onClick={() => setOpen(true)}>{t.enabled ? "Wyłącz" : "Włącz"}</Button>
      <ReasonDialog
        open={open}
        title={`${t.enabled ? "Wyłącz" : "Włącz"}: ${t.note ?? t.key}`}
        description={t.enabled ? "Po wyłączeniu nowe powiadomienia nie trafią do tej grupy." : "Czas włączenia zostanie zapisany: treści sprzed włączenia nie zostaną wysłane. Środowiska dev i próbne nic nie wysyłają, nawet po włączeniu."}
        danger={t.enabled}
        confirmLabel={t.enabled ? "Wyłącz" : "Włącz"}
        busy={pending === "target"}
        onClose={() => setOpen(false)}
        onSubmit={async (reason) => (await run("POST", `/api/admin/notify-targets/${encodeURIComponent(t.key)}`, { enabled: !t.enabled, reason }, { label: "target", success: "Zaktualizowano" })) !== null}
      />
    </>
  );
}

export default function SettingsAdmin({ loaderData: s }: Route.ComponentProps) {
  return (
    <AdminPage title="Ustawienia" subtitle="Ustawienia, które zmienisz bez kodu. Każda zmiana trafia do dziennika zmian.">
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Kody QR na stronie „O serwisie”">
          <div className="space-y-5">
            <QrSlot slot="wechatQr" label="Kod QR konta WeChat" src={s.contact.wechatQr} />
            <QrSlot slot="feishuQr" label="Kod QR grupy Feishu" src={s.contact.feishuQr} />
          </div>
        </Card>
        <Card title="Cele powiadomień" pad={false}>
          <DataTable
            rows={s.targets}
            rowKey={(t) => t.key}
            columns={[
              { key: "k", label: "Cel", render: (t) => <div><div className="font-medium text-ink">{t.note ?? t.key}</div><div className="font-mono text-[11.5px] text-ink-4">{t.key} · {t.config_ref}</div></div> },
              { key: "e", label: "Stan", render: (t) => (t.enabled ? <Badge tone="ok">włączone {bj(t.enabled_at)}</Badge> : <Badge>wyłączone</Badge>) },
              { key: "d", label: "Wysyłki 7 dni", align: "right", render: (t) => num(t.deliveries_7d) },
              { key: "a", label: "", align: "right", render: (t) => <TargetToggle t={t} /> },
            ]}
          />
        </Card>
      </div>
      <Card className="mt-5" title="Limity płatnych zapytań" right={<span>Zużyte: ostatnia godzina / ostatnie 24 godz.</span>} pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-ink-3">
                <th className="px-3 py-2 font-medium">Usługa</th>
                <th className="px-3 py-2 font-medium">Na minutę</th>
                <th className="px-3 py-2 font-medium">Na godzinę</th>
                <th className="px-3 py-2 font-medium">Na dzień</th>
                <th className="px-3 py-2 text-right font-medium">Zużyte</th>
                <th />
              </tr>
            </thead>
            <tbody>{s.budgets.map((b) => <BudgetRow key={`${b.service}-${b.updated_at}`} b={b} />)}</tbody>
          </table>
        </div>
      </Card>
    </AdminPage>
  );
}
