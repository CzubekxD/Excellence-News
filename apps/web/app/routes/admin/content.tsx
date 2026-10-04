import { SITE } from "@aihot/site";
import { Form, Link, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/content";
import type { AdminContentRow, AdminContentSearch } from "@aihot/contracts/admin";
import { adminGet } from "../../lib/admin.server";
import { VISIBILITY_LABEL } from "../../features/admin/labels";
import { AdminPage, Badge, Button, Card, DataTable, Empty, Input, Time } from "../../features/admin/ui";


export async function loader({ request }: Route.LoaderArgs) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return { q, rows: [] as AdminContentRow[] };
  const { rows } = await adminGet<AdminContentSearch>(request, `/api/admin/content?q=${encodeURIComponent(q)}`);
  return { q, rows };
}

export const meta: Route.MetaFunction = () => [{ title: `Diagnostyka treści · panel ${SITE.name}` }];

export default function Content({ loaderData }: Route.ComponentProps) {
  const { q, rows } = loaderData;
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  return (
    <AdminPage title="Diagnostyka treści" subtitle="Znajdź dowolny wpis po ID, linku do oryginału lub tytule i zobacz całą drogę od źródła do publikacji; wycofanie, tryb tylko streszczenia, ręczne poprawki i ponowne przetwarzanie są na stronie szczegółów.">
      <Form method="get" className="mb-5 flex max-w-2xl gap-2">
        <Input name="q" defaultValue={sp.get("q") ?? ""} placeholder="ID wpisu, URL lub słowa z tytułu" aria-label="Szukaj treści" autoFocus />
        <Button type="submit" tone="primary">Szukaj</Button>
      </Form>
      {q && (
        <Card pad={false} title={`Wyniki dla „${q}”`} right={<span>{rows.length === 50 ? "Tylko 50 najnowszych" : `${rows.length} wpisów`}</span>}>
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/admin/content/${r.id}`)}
            empty="Nic nie znaleziono. URL jest najpierw normalizowany; w tytule szukaj fragmentu w dowolnym języku."
            columns={[
              {
                key: "t",
                label: "Tytuł",
                render: (r) => (
                  <div className="min-w-[320px]">
                    <Link to={`/admin/content/${r.id}`} className="font-medium text-ink hover:text-accent" onClick={(e) => e.stopPropagation()}>{r.title}</Link>
                    <div className="font-mono text-[11.5px] text-ink-4">{r.id}</div>
                  </div>
                ),
              },
              { key: "src", label: "Źródło", render: (r) => <span className="whitespace-nowrap">{r.source}</span> },
              {
                key: "st",
                label: "Stan",
                render: (r) => (
                  <span className="flex flex-wrap gap-1">
                    {r.selected && <Badge tone="accent">Wybrane</Badge>}
                    {r.visibility && <Badge tone={r.visibility === "public" ? "muted" : "warn"}>{VISIBILITY_LABEL[r.visibility] ?? r.visibility}</Badge>}
                    {!r.visibility && <Badge>{r.processing_state}</Badge>}
                  </span>
                ),
              },
              { key: "sc", label: "Ocena", align: "right", render: (r) => r.score ?? "—" },
              { key: "d", label: "Znaleziono", render: (r) => <Time at={r.discovered_at} /> },
            ]}
          />
        </Card>
      )}
      {!q && <Empty>Wpisz ID, link lub tytuł, żeby zacząć.</Empty>}
    </AdminPage>
  );
}
