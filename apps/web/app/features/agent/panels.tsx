// The engine's ways in, one panel each: what it is for, the steps to connect, then the details folded away.
// Addresses are the site's configured public address (`base`); what visitors copy carries the site's tag
// (CopyTag) when it has one.
import { Fragment, useState } from "react";
import { Link } from "react-router";
import { PUBLIC_INTERFACE_VERSION } from "@aihot/contracts/http-policy";
import { MCP_TOOL_NAMES as T, MCP_TOOLS } from "@aihot/contracts/mcp";
import { feedCategoryLabel, PUBLIC_API_CATEGORY_KEYS } from "@aihot/contracts/taxonomy";
import { ACCESS, AGENT, EDITION_WHEN, POLICY, REPORTS, SITE, count } from "@aihot/site";
import { CodeBlock, CopyButton } from "./CodeBlock";
import { PillTabs } from "../../components/ui/Tabs";
import type { AgentPanelProps } from "../../modules";
import { AGENT_PARTS, GUIDE_CLIENTS, TAG } from "./module-parts";
import { Address, Ask, Block, Bullets, Details, Mono, PanelHead, Step, Steps, Table, Tips } from "./parts";

const V = PUBLIC_INTERFACE_VERSION;

/** Every MCP tool: the engine's and the modules'. */
export const mcpToolCount = () => MCP_TOOLS.length + AGENT_PARTS.reduce((n, a) => n + (a.tools?.length ?? 0), 0);
const link = "text-accent hover:underline";

/** An address on this site as the copy buttons copy it, with the tag. */
function addressOf({ base, tag }: AgentPanelProps, path: string): string {
  return TAG && tag ? `${base}${path}?${TAG.query}=${tag}` : `${base}${path}`;
}

const MCP_CLIENTS = [
  { key: "claude", label: "Claude Code" },
  { key: "codex", label: "Codex" },
  { key: "json", label: "Konfiguracja JSON" },
  { key: "other", label: "Inni klienci" },
] as const;

export function McpPanel(props: AgentPanelProps) {
  const url = addressOf(props, "/api/mcp");
  const name = SITE.mcpPrefix;
  const [client, setClient] = useState<string>("claude");
  return (
    <>
      <PanelHead label={`MCP · ${V}`} title={`Jeden adres, a agent dostaje ${count(mcpToolCount(), ["narzędzie", "narzędzia", "narzędzi"])}`}>
        Standardowy Streamable HTTP, anonimowo i tylko do odczytu, bez tokenu i bez dostępu do twoich logowań. Dla klientów obsługujących zdalne MCP, takich jak Claude Desktop czy Cursor.
      </PanelHead>
      <Steps>
        <Step n={1} title="Skopiuj adres">
          <Address url={url} />
          {TAG && <p className="mt-2 text-[13px] text-ink-3">{TAG.mcp}</p>}
        </Step>
        <Step n={2} title="Dodaj do klienta">
          <PillTabs className="mt-3" size="xs" layoutId="agent-mcp-client" label="Klient" active={client} onSelect={setClient} items={MCP_CLIENTS.map((c) => ({ key: c.key, label: c.label }))} />
          {client === "claude" && <CodeBlock className="mb-0 mt-3" lang="bash" code={`claude mcp add --transport http ${name} '${url}'`} />}
          {client === "codex" && <CodeBlock className="mb-0 mt-3" lang="bash" code={`codex mcp add ${name} --url '${url}'`} />}
          {client === "json" && <CodeBlock className="mb-0 mt-3" title="Cursor i inni klienci z konfiguracją JSON" lang="json" code={JSON.stringify({ mcpServers: { [name]: { type: "http", url } } }, null, 2)} />}
          {client === "other" && <p className="mt-3">{`W ustawieniach MCP lub łączników klienta dodaj nowy wpis: nazwa ${name}, adres jak wyżej, uwierzytelnianie „brak”, bez klucza API. Klient obsługujący tylko lokalne polecenia potrzebuje swojego pośrednika zdalnego MCP.`}</p>}
        </Step>
        <Step n={3} title="Poproś agenta o test">
          <Ask text={`Wywołaj ${T.latest} i podaj 5 najważniejszych wiadomości ${SITE.subject} z ostatnich 24 godzin z linkami do ${SITE.name}.`} />
          <p className="mt-2 text-[13px] text-ink-3">{`Jeśli klient pokazuje wywołanie ${T.latest}, a odpowiedź ma zakres czasu, polskie streszczenia i linki do ${new URL(props.base).host}, połączenie działa.`}</p>
        </Step>
      </Steps>

      <Block title={`Narzędzia: ${mcpToolCount()}`}>
        <Table
          head={["Narzędzie", "Co robi", "Przykładowe pytanie"]}
          minWidth={600}
          rows={[
            [<Mono>{T.latest}</Mono>, "wybór lub wszystkie wiadomości z 24 godzin albo 7 dni", "Co nowego dziś w Lean i OPEX?"],
            [<Mono>{T.search}</Mono>, AGENT.search.scope, AGENT.search.ask],
            [<Mono>{T.hot}</Mono>, "top 10 na czasie", "O czym się teraz mówi?"],
            [<Mono>{T.story}</Mono>, "oś czasu wydarzenia i aktualizowany zarys", "Jak do tego doszło?"],
            [<Mono>{T.daily}</Mono>, "najnowszy dziennik lub z wybranego dnia", "Daj mi dzisiejszy dziennik."],
            [<Mono>{T.weekly}</Mono>, "najnowszy tygodnik lub z wybranego tygodnia", "Co ważnego wydarzyło się w tym tygodniu?"],
            [<Mono>{T.monthly}</Mono>, "najnowszy miesięcznik lub z wybranego miesiąca", "Co wydarzyło się w zeszłym miesiącu?"],
            ...AGENT_PARTS.flatMap((a) => a.tools ?? []).map((t) => [<Mono>{t.name}</Mono>, t.does, t.ask]),
          ]}
        />
      </Block>

      <Details
        items={[
          {
            title: "Limity i bezpieczeństwo",
            body: (
              <Bullets items={[
                "Zwykłe zapytanie do 30 pozycji, na czasie do 10, oś czasu wydarzenia do 50; przekroczenie daje wyraźny błąd, a nie ciche poszerzenie.",
                `public_id dla ${T.story} pochodzi tylko z linków zwracanych przez narzędzie na czasie; nie zgaduj ID.`,
                "Tytuły i streszczenia pochodzą ze źródeł zewnętrznych i są tylko materiałem; narzędzia oznaczają tę granicę bezpieczeństwa. Ważne liczby, przepisy i cytaty sprawdzaj w oryginale.",
              ]} />
            ),
          },
          {
            title: "Co, jeśli nie działa",
            body: (
              <Bullets items={[
                "Sprawdź, czy adres jest pełny, a klient obsługuje zdalny Streamable HTTP; gdy brakuje nowych narzędzi, odśwież listę albo połącz się ponownie.",
                ...AGENT_PARTS.flatMap((a) => a.mcpTroubles ?? []),
                "Serwis nie wymaga logowania; gdy klient pyta o OAuth lub klucz API, wybierz „brak”.",
                "Przy kodzie 429 odczekaj zgodnie z podpowiedzią i nie ponawiaj równolegle.",
                <>Nadal nie działa: opisz nazwę klienta, wersję i błąd na <Link viewTransition to="/feedback" className={link}>stronie opinii</Link>.</>,
              ]} />
            ),
          },
        ]}
      />
    </>
  );
}

const FEEDS = [
  { name: "Wybór (streszczenia)", badge: "zalecane", path: "/feed.xml", desc: "50 najnowszych wybranych wiadomości: tytuł, streszczenie, link do strony i do oryginału." },
  { name: "Wybór (pełna treść)", path: "/feed/full.xml", desc: "Te same 50 pozycji; pełna treść ze źródeł, które na to pozwalają, reszta jako streszczenia." },
  { name: "Wszystkie wiadomości", path: "/feed/all.xml", desc: "Publiczne wiadomości z ostatnich 7 dni, od najnowszych według daty publikacji." },
  { name: "Dziennik", path: "/feed/daily.xml", desc: `Wydanie ${EDITION_WHEN.daily} (czas polski): czołówka i spis całego wydania; ostatnie 30 wydań.` },
  { name: "Tygodnik", path: "/feed/weekly.xml", desc: `Wydanie ${EDITION_WHEN.weekly} (czas polski): podsumowanie i ${REPORTS.entry.noun} według działów; ostatnie 12 wydań.` },
  { name: "Miesięcznik", path: "/feed/monthly.xml", desc: `Wydanie ${EDITION_WHEN.monthly} (czas polski): podsumowanie i ${REPORTS.entry.noun} według działów; ostatnie 12 wydań.` },
];

/** The category feeds, under the names the feeds themselves use. */
const FEED_CATEGORIES = PUBLIC_API_CATEGORY_KEYS.map((key) => [key, feedCategoryLabel(key)] as const);

export function RssPanel(props: AgentPanelProps) {
  const { base } = props;
  const lead = `${["Działa z popularnymi czytnikami RSS 2.0 i narzędziami automatyzacji jak n8n czy Zapier. Adresy się nie zmieniają", ...AGENT_PARTS.flatMap((a) => a.rssLead ?? [])].join("; ")}.`;
  return (
    <>
      <PanelHead label="RSS" title="Skopiuj adres do czytnika">
        {lead}
      </PanelHead>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FEEDS.map((f) => (
          <div key={f.path} className="card flex flex-col p-4">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-ink">{f.name}</span>
              {f.badge && <span className="inline-flex h-[18px] items-center rounded-full bg-accent-soft px-2 text-[11px] font-medium text-accent">{f.badge}</span>}
            </div>
            <p className="mt-1 flex-1 text-[13px] leading-[1.7] text-ink-3">{f.desc}</p>
            <div className="mt-3 flex items-center gap-2 border-t border-line-soft pt-3">
              <code className="mono min-w-0 flex-1 truncate text-[12px] text-ink-4">{base}{f.path}</code>
              <CopyButton text={addressOf(props, f.path)} label="Kopiuj adres" className="shrink-0" />
            </div>
          </div>
        ))}
      </div>
      {TAG && <p className="mt-3 text-[12.5px] text-ink-4">{TAG.rss}</p>}

      <Block title="Subskrypcja kategorii">
        <Table
          head={["Kategoria", "Streszczenia", "Pełna treść"]}
          minWidth={420}
          rows={FEED_CATEGORIES.map(([slug, label]) => [
            <span className="font-medium text-ink">{label}</span>,
            <span className="inline-flex items-center gap-2"><Mono>{`/feed/category/${slug}.xml`}</Mono><CopyButton text={addressOf(props, `/feed/category/${slug}.xml`)} className="!h-6 !px-1.5" /></span>,
            <span className="inline-flex items-center gap-2"><Mono>{`/feed/full/category/${slug}.xml`}</Mono><CopyButton text={addressOf(props, `/feed/full/category/${slug}.xml`)} className="!h-6 !px-1.5" /></span>,
          ])}
        />
      </Block>

      <Block title="Jak często odświeżać">
        <p>Czytnik pyta z ostatnim ETag; gdy nic się nie zmieniło, dostaje mały kod 304 bez ponownego pobierania. Odświeżanie co 30 minut wystarczy, częściej i tak nie da nowych treści.</p>
        <p className="mt-3 text-[13px] text-ink-3">{`Linki pozycji prowadzą do stron serwisu, link do oryginału jest w streszczeniu. Anonimowa subskrypcja nie oznacza zgody na każde zastosowanie${POLICY.terms.notes ? `: ${POLICY.terms.notes.rss}` : ""}; zob. `}<Link viewTransition to="/terms" className={link}>{POLICY.terms.name}</Link>.</p>
      </Block>
    </>
  );
}

const RECIPES = [
  { key: "latest", label: "Śledzenie nowości" },
  { key: "sync", label: "Synchronizacja wyboru" },
];

export function ApiPanel(props: AgentPanelProps) {
  const { base, tag } = props;
  const userAgent = [ACCESS.userAgent, TAG && tag ? TAG.userAgent(tag) : null].filter(Boolean).join(" ");
  const curl = `curl --compressed${userAgent ? ` -A '${userAgent}'` : ""}`;
  let pace = `Jak często coś się zmienia: nowe wiadomości przychodzą przez cały dzień, wybór zmienia się od kilku do kilkudziesięciu razy dziennie, dziennik wychodzi ${EDITION_WHEN.daily}, tygodnik ${EDITION_WHEN.weekly}, miesięcznik ${EDITION_WHEN.monthly} (czas polski). `;
  if (ACCESS.ratePerMinute) pace += `Ponad ok. ${ACCESS.ratePerMinute} zapytań na minutę z jednego IP daje 429; czekaj według Retry-After i nie ponawiaj równolegle.`;
  const [recipe, setRecipe] = useState<string>("latest");
  const recipes = AGENT_PARTS.flatMap((a) => a.recipes ?? []);
  const items = `${base}/api/v1/items?mode=selected&window=24h&limit=20`;
  return (
    <>
      <PanelHead label={`REST API · ${V}`} title="Anonimowe GET, gotowe do użycia">
        Bez tokenu; działa z przeglądarki (CORS), curl i domyślnych klientów HTTP w każdym języku. Ścieżki /api/v1; pola i kody błędów opisuje <a href="/openapi-v1.json" className={link}>OpenAPI</a>.
      </PanelHead>
      <CodeBlock className="mt-6" title="Pierwsze zapytanie" lang="bash" code={`${curl} '${items}'`} />

      <Block title="Oszczędnie i szybko">
        <Tips
          items={[
            { title: "Kompresja", text: <>curl z <Mono>--compressed</Mono>, w innych klientach gzip lub br. JSON po kompresji to 1/4–1/8 rozmiaru.</> },
            { title: "ETag", text: <>Zapisz ETag z odpowiedzi i wysyłaj go w <Mono>If-None-Match</Mono>; bez zmian dostaniesz 304 bez treści.</> },
            { title: "Rytm", text: `Wiadomości i na czasie najwyżej raz na minutę; dziennik raz po wydaniu ${EDITION_WHEN.daily}, tygodnik i miesięcznik raz po wydaniu; przewijając wstecz, zatrzymaj się na pierwszej znanej pozycji.` },
          ]}
        />
        <p className="mt-3 text-[13px] leading-[1.75] text-ink-3">{pace}</p>
      </Block>

      <Block title="Przegląd API">
        <Table
          head={["Ścieżka", "Do czego", "Jak często"]}
          minWidth={640}
          rows={[
            { group: "Wiadomości" },
            [<Mono>/api/v1/items</Mono>, "wybór albo wszystkie wiadomości z 7 dni, z filtrami kategorii, okna czasu i słów", "najwyżej co 1 min"],
            { group: "Na czasie i wydarzenia" },
            [<Mono>/api/v1/hot-topics</Mono>, "top 10 na czasie", "najwyżej co 1 min"],
            [<Mono>{"/api/v1/stories/{publicId}"}</Mono>, "oś czasu wydarzenia, zarys AI i powiązane wydarzenia", "w razie potrzeby"],
            { group: "Dziennik" },
            [<Mono>/api/v1/dailies/latest</Mono>, "najnowszy dziennik", `raz po wydaniu ${EDITION_WHEN.daily}`],
            [<Mono>{"/api/v1/dailies/{date}"}</Mono>, "dziennik z danego dnia; wycofane teksty znikają", "po wygaśnięciu bufora sprawdź ETag"],
            [<Mono>/api/v1/dailies</Mono>, "indeks dat dziennika", "raz dziennie"],
            { group: "Tygodnik i miesięcznik" },
            [<Mono>/api/v1/weeklies/latest</Mono>, "najnowszy tygodnik: czołówka, podsumowanie i najważniejsze sprawy według działów", `raz po wydaniu ${EDITION_WHEN.weekly}`],
            [<Mono>{"/api/v1/weeklies/{week}"}</Mono>, "wybrany tydzień ISO, np. 2026-W39; wycofane teksty znikają", "po wygaśnięciu bufora sprawdź ETag"],
            [<Mono>/api/v1/weeklies</Mono>, "indeks tygodników", "raz w tygodniu"],
            [<Mono>/api/v1/monthlies/latest</Mono>, "najnowszy miesięcznik", `raz po wydaniu ${EDITION_WHEN.monthly}`],
            [<Mono>{"/api/v1/monthlies/{month}"}</Mono>, "wybrany miesiąc, np. 2026-09", "po wygaśnięciu bufora sprawdź ETag"],
            [<Mono>/api/v1/monthlies</Mono>, "indeks miesięczników", "raz w miesiącu"],
            ...AGENT_PARTS.flatMap((a) => (a.api ? [{ group: a.api.group }, ...a.api.rows.map(([path, does, often]) => [<Mono>{path}</Mono>, does, often])] : [])),
            { group: "Dla asystentów AI" },
            [<Mono>/api/v1/agent</Mono>, `instrukcja dla agentów; podane adresy zwracają Markdown po polsku${GUIDE_CLIENTS ? `; ${GUIDE_CLIENTS} używa właśnie ich` : ""}`, "w razie potrzeby"],
            { group: "Synchronizacja całego wyboru" },
            [<Mono>/api/v1/selected/snapshot</Mono>, "cały bieżący wybór, stronami", "tylko na początku"],
            [<Mono>/api/v1/selected/changes</Mono>, "późniejsze dodania, zmiany i wycofania", "co kilka minut"],
          ]}
        />
      </Block>

      <Block title="Typowe zastosowania">
        <PillTabs size="xs" layoutId="agent-api-recipe" label="Zastosowanie" active={recipe} onSelect={setRecipe} items={[...RECIPES, ...recipes].map((r) => ({ key: r.key, label: r.label }))} />
        {recipe === "latest" && (
          <>
            <CodeBlock className="mb-3 mt-3" lang="bash" code={`# Za pierwszym razem: zapisz ETag z nagłówków odpowiedzi\n${curl} -i '${items}'\n# Potem najwyżej co minutę, z ETag; 304 oznacza brak zmian\n${curl} -i -H 'If-None-Match: <poprzedni ETag>' '${items}'`} />
            <p>Przewijając wstecz, przekazuj <Mono>page.nextCursor</Mono> jako cursor i zatrzymaj się na pierwszej znanej pozycji, zamiast za każdym razem pobierać 7 dni.</p>
          </>
        )}
        {recipe === "sync" && (
          <>
            <CodeBlock className="mb-3 mt-3" lang="bash" code={`# Za pierwszym razem pobierz wszystko stronami. Zapisz cursor z pierwszej strony (na każdej jest ten sam)\n${curl} '${base}/api/v1/selected/snapshot?fields=minimal&limit=500'\n# Dopóki hasMore jest true, pobieraj dalej z nextPage\n${curl} '${base}/api/v1/selected/snapshot?fields=minimal&limit=500&page=<nextPage z poprzedniej strony>'\n# Potem: odsyłaj cursor bez zmian i pobieraj tylko dodania, zmiany i wycofania\n${curl} '${base}/api/v1/selected/changes?cursor=<cursor z pierwszej strony>&limit=100'`} />
            <p>Nowy cursor zapisuj dopiero po zapisaniu strony lokalnie. Cursor to znacznik dziennika zmian i nie wygasa; przy 409 <Mono>snapshot_required</Mono> pobierz migawkę od nowa, dzięki temu nic nie zginie po cichu.</p>
          </>
        )}
        {recipes.map((r) => recipe === r.key && <r.Body key={r.key} base={base} curl={curl} />)}
      </Block>

      <Block title="Co robić przy błędach" id="agent-api-recovery">
        <dl className="grid grid-cols-[76px_minmax(0,1fr)] gap-x-3 gap-y-2.5">
          <dt className="mono text-[13px] text-ink">400</dt>
          <dd>Złe parametry: popraw według OpenAPI i zwróconego code, nie poszerzaj zapytania automatycznie. Nieważny cursor lub poza oknem czasu daje invalid_cursor; zacznij od pierwszej strony.</dd>
          <dt className="mono text-[13px] text-ink">409</dt>
          <dd>snapshot_required: zmian nie da się bezpiecznie kontynuować, pobierz pełną migawkę.</dd>
          <dt className="mono text-[13px] text-ink">429</dt>
          <dd>Za dużo zapytań: czekaj według Retry-After, nie ponawiaj równolegle.</dd>
          <dt className="mono text-[13px] text-ink">5xx</dt>
          <dd>Wykładniczy odstęp ponowień, w międzyczasie ostatni udany wynik; publiczna usługa nie ma SLA.</dd>
          {AGENT_PARTS.flatMap((a) => a.apiErrors ?? []).map(([status, what]) => (
            <Fragment key={status}>
              <dt className="mono text-[13px] text-ink">{status}</dt>
              <dd>{what}</dd>
            </Fragment>
          ))}
        </dl>
        <p className="mt-4 text-[13px] text-ink-3">{`Anonimowy dostęp nie oznacza zgody na każde zastosowanie${POLICY.terms.notes ? `: ${POLICY.terms.notes.api}` : ""}; zob. `}<Link viewTransition to="/terms" className={link}>{POLICY.terms.name}</Link>.</p>
      </Block>

    </>
  );
}
