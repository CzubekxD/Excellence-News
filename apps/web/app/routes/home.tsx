import { data as withHeaders, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import type { IssueCoversResponse, TimelineResponse } from "@aihot/contracts/site";
import { apiDeadlineCache, apiGet, loadOr404 } from "../lib/api.server";
import { filterParams, itemListLd, listPath, pageMeta, readFilters, siteLd } from "../lib/seo";
import type { Screen } from "../components/shell/screens";
import { Timeline } from "../features/feed/Timeline";
import { HotTopics } from "../features/feed/HotTopics";
import { ActiveFilters, CategoryTabs, FeedBar, SearchField } from "../features/feed/Filters";
import { MagazineIntro, MagazineOutro } from "../features/magazine/Magazine";

export const handle: Screen = { tab: "featured", name: "Wybór" };

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  // Search lives on /all; keep the parameters so old links still land on results.
  if (q && q.trim()) throw redirect(`/all${url.search}`);
  const filters = readFilters(url.searchParams);
  const upstream = new Headers();
  // The magazine front (masthead and covers) opens the unfiltered front page only; a filtered list goes
  // straight to its results. Missing covers leave the masthead alone rather than failing the page.
  const front = Object.values(filterParams(filters)).every((v) => !v);
  const [data, covers] = await Promise.all([
    loadOr404<TimelineResponse>(listPath("/api/site/timeline", filterParams(filters)), { responseHeaders: upstream, signal: request.signal }),
    front ? apiGet<IssueCoversResponse>("/api/site/covers", { signal: request.signal }).then((r) => r.covers, () => []) : Promise.resolve(null),
  ]);
  return withHeaders({ data, filters, covers }, { headers: apiDeadlineCache(60, Date.now(), upstream) });
}

export function meta({ loaderData }: Route.MetaArgs) {
  const path = listPath("/", loaderData ? filterParams(loaderData.filters) : {});
  const titles = loaderData?.data.cards.map((c) => c.item.title) ?? [];
  return pageMeta({ path, jsonLd: path === "/" ? [...siteLd(), itemListLd("/", "Wybór", titles)] : undefined });
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export default function Home() {
  const { data, filters, covers } = useLoaderData<typeof loader>();
  const title = filters.tag ? `#${filters.tag}` : "Wybór";
  const Heading = covers ? "h2" : "h1";
  return (
    <div className="pb-6">
      {covers && <MagazineIntro covers={covers} />}
      <div id="wiadomosci" className="scroll-mt-[calc(var(--bar-h)+12px)]" />
      {/* Phones: the bar (精选 | 全部, filter, search), the filter in use, today's hot topics, the feed. */}
      <FeedBar base="/" category={filters.category} channel={filters.channel} />
      <ActiveFilters base="/" category={filters.category} channel={filters.channel} tag={filters.tag} />
      <div className="hidden lg:block">
        <Heading className="mag-section-head text-ink">{covers ? "Wybór wiadomości" : title}</Heading>
        <div className="mb-5 mt-4 flex items-center justify-between gap-4">
          <CategoryTabs base="/" category={filters.category} channel={filters.channel} layoutId="home-cat-desk" className="min-w-0" />
          <SearchField keep={{ category: filters.category }} />
        </div>
      </div>

      {data.hot && <HotTopics entries={data.hot} />}

      <Timeline initial={data} filters={data.filters} />
      {covers && <MagazineOutro />}
    </div>
  );
}
