// The writing side of the analysis: the prefilter's and the content understanding's inputs, the
// title/summary prompts for everything else, the output parsing and the deterministic guards. The
// wording lives in the industry pack (industry/prompts/); a failed guard falls back without a repair call.
import { IDENTITY_CONTEXT_ALIASES, IDENTITY_LEXICON, PUBLISHER_DOMAINS } from "@aihot/industry/taxonomy";
import { siteDate } from "@aihot/contracts/time";
import { looksPolish } from "../lib/language.ts";
import { onlyXArticleLink } from "../sources/x.ts";
import type { AnalyzeInputArticle } from "./input.ts";
import { promptText } from "./prompts.ts";

export const PREFILTER_SYSTEM = promptText("prefilter");
export const UNDERSTAND_SYSTEM = promptText("understand");

/** A body longer than this is cut (whole bodies are sent; a few run past the context). */
export const MAX_BODY_CHARS = 60_000;
const capBody = (s: string) => (s.length > MAX_BODY_CHARS ? s.slice(0, MAX_BODY_CHARS) : s);

// Text helpers

export function clampText(s: string, maxChars: number): string {
  const codepoints = Array.from(s);
  return codepoints.length <= maxChars ? s : codepoints.slice(0, maxChars).join("") + "…";
}

/** Text already in the reader's language (Polish): it can stand as its own title. */
export const looksReader = looksPolish;

/** Short post: under 500 characters. */
export function isShortTweet(text: string): boolean {
  if (!text) return false;
  return text.length < 500;
}

/** HTML, URLs (whose /2025/ paths models took for years) and entities out of article text. */
export function cleanArticleTextForLLM(s: string): string {
  if (!s) return "";
  return s
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const stripNoise = (s: string) => s.replace(/https?:\/\/\S+/g, " ").replace(/@[A-Za-z0-9_]+/g, " ").replace(/#[A-Za-z0-9_]+/g, " ");

/** A short post in Polish needs no translation; one in any other language does. */
export function needsShortTweetTranslation(text: string): boolean {
  return !looksPolish(stripNoise(text));
}

// The material as the prefilter and the content understanding read it

/** The post is an X Article's link whose article could not be fetched. */
const unfetchedXArticle = (a: AnalyzeInputArticle) => !!a.xPost && a.bodyStatus !== "ok" && onlyXArticleLink(String(a.xPost.text ?? ""));

function materialQuality(a: AnalyzeInputArticle): string {
  if (a.xPost) return "pełna treść (z pola content w RSS / API)";
  if (a.bodyText) return a.source.fetchesBody ? "pełna treść (pobrana ze strony oryginału)" : "pełna treść (z pola content w RSS / API)";
  if (a.excerpt) return "tylko zajawka (kanał nie podaje pełnej treści)";
  if (a.bodyStatus === "unconfirmed") return "pobieranie nie powiodło się, dostępny tylko tytuł";
  return "brak użytecznego tekstu";
}

/** The material as the prefilter and the content understanding read it. */
export function renderContext(a: AnalyzeInputArticle, opts: { annotateQuoted?: boolean } = {}): string {
  const lines: string[] = [];
  lines.push(`【Źródło】${a.source.name} (${a.source.kind}, tier=${a.source.tier || "bez poziomu"})`);
  if (a.source.tags?.length) lines.push(`【Tagi źródła】${a.source.tags.join(", ")}`);
  const name = a.xPost?.authorName || a.author;
  const handle = a.xPost?.handle;
  if (name || handle) lines.push(`【Autor】${[name, handle ? `@${handle}` : null].filter(Boolean).join(" · ")}`);
  if (a.publishedAt) lines.push(`【Data publikacji】${a.publishedAt.toISOString()}`);
  const media = (a.xPost?.media ?? a.media ?? []) as Array<{ kind?: string }>;
  const images = media.filter((m) => m.kind === "image").length;
  const videos = media.filter((m) => m.kind === "video").length;
  const mediaParts = [images ? `obrazy: ${images}` : null, videos ? `wideo: ${videos}` : null, unfetchedXArticle(a) ? "link do długiego artykułu na X (treść niepobrana)" : null].filter(Boolean);
  if (mediaParts.length) lines.push(`【Media】${mediaParts.join(" · ")}`);
  lines.push(`【Link do oryginału】${a.url}`);
  lines.push(`【Tytuł】${a.title}`);
  const quoted = a.xPost?.quoted?.text ? a.xPost.quoted : null;
  if (quoted) {
    const label = quoted.handle ? `@${quoted.handle}` : "wpis oryginalny";
    if (opts.annotateQuoted) {
      lines.push(`【Cytat ${label}】(poniżej treść **innej osoby**, którą autor udostępnia lub cytuje; to nie jest jego własny tekst)`);
      lines.push(String(quoted.text));
    } else {
      lines.push(`【Cytat ${label}】${quoted.text}`);
    }
  }
  lines.push("");
  lines.push(opts.annotateQuoted && quoted ? "【Treść (własny tekst autora)】" : "【Treść】");
  lines.push(capBody(a.xPost ? String(a.xPost.text ?? a.title) : (a.bodyText ?? a.excerpt ?? "(brak treści)")));
  lines.push("");
  lines.push(`【Jakość materiału】${materialQuality(a)}`);
  return lines.join("\n");
}

/** The prefilter's user message: the context as a JSON string (the prompt was tuned on this form). */
export const prefilterUser = (a: AnalyzeInputArticle) => JSON.stringify(renderContext(a));

/** Nothing to judge beyond the title: the prefilter's BLOCK then means "wait for material". */
export function missingEvidence(a: AnalyzeInputArticle): boolean {
  return !a.bodyText?.trim() && !a.excerpt?.trim() && !String(a.xPost?.text ?? "").trim() && !String(a.xPost?.quoted?.text ?? "").trim();
}

export const understandUser = (a: AnalyzeInputArticle) =>
  ["Zgodnie z regułami systemowymi zrozum poniższy pojedynczy materiał i zwróć naraz wszystkie sześć pól.", renderContext(a, { annotateQuoted: true })].join("\n\n");

// Identity context and guard

const lexiconName = (id: string) => IDENTITY_LEXICON.find((e) => e.id === id)?.name ?? null;

/** Known companies the texts name, by the pack's identity lexicon (each text on its own). */
export function matchEntityIds(texts: Array<string | null | undefined>): string[] {
  const list = texts.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  return IDENTITY_LEXICON.filter((e) => e.patterns.some((p) => list.some((t) => p.test(t)))).map((e) => e.id);
}

/** A translation may rejoin a name (GPT 5.5 → GPT-5.5): the input counts in both spellings. */
const surfaceVariants = (texts: Array<string | undefined>) => {
  const exact = texts.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  return [...exact, ...exact.map((t) => t.replace(/\b(gpt|glm)\s+(?=[o\d])/gi, "$1-"))];
};

function publisherEntityId(url?: string): string | null {
  let host: string;
  try {
    host = new URL(url ?? "").hostname.toLowerCase();
  } catch {
    return null;
  }
  return PUBLISHER_DOMAINS.find((e) => e.domains.some((d) => host === d || host.endsWith(`.${d}`)))?.entityId ?? null;
}

export interface TranslateInput {
  title: string;
  text: string;
  sourceKind: string;
  sourceName?: string;
  documentUrl?: string;
  sourceOwnerEntityId?: string | null;
  /** The main post of a tweet (not the quoted one), for the short/long decision. */
  mainText?: string;
  quotedText?: string;
  quotedAuthor?: string;
  publishedAt?: Date;
}

export function translateInputOf(a: AnalyzeInputArticle): TranslateInput {
  const isX = a.source.kind === "x_search" || !!a.xPost;
  const mainText = isX ? String(a.xPost?.text ?? a.title) : undefined;
  return {
    title: a.title,
    text: isX ? (mainText ?? "") : (a.bodyText ?? a.excerpt ?? ""),
    sourceKind: isX ? "x_search" : a.source.kind,
    sourceName: a.source.name,
    documentUrl: a.url,
    sourceOwnerEntityId: a.source.ownerEntityId ?? null,
    mainText,
    quotedText: a.xPost?.quoted?.text ? String(a.xPost.quoted.text) : undefined,
    quotedAuthor: a.xPost?.quoted?.handle ? String(a.xPost.quoted.handle) : undefined,
    publishedAt: a.publishedAt ?? undefined,
  };
}

function identityContext(input: TranslateInput) {
  const publisher = publisherEntityId(input.documentUrl);
  const owner = input.sourceOwnerEntityId && lexiconName(input.sourceOwnerEntityId) ? input.sourceOwnerEntityId : null;
  const texts = [input.title, input.text, input.mainText, input.quotedText, input.sourceName];
  const allowed = new Set(matchEntityIds(surfaceVariants(texts)));
  const joined = texts.filter(Boolean).join("\n");
  for (const alias of IDENTITY_CONTEXT_ALIASES) if (alias.pattern.test(joined)) allowed.add(alias.entityId);
  if (publisher) allowed.add(publisher);
  if (owner) allowed.add(owner);
  return { allowed: [...allowed].sort(), publisher, owner };
}

function identityPrompt(input: TranslateInput): string {
  const ctx = identityContext(input);
  const facts: string[] = [];
  if (ctx.publisher) facts.push(`wydawca według domeny=${lexiconName(ctx.publisher) ?? ctx.publisher}`);
  if (ctx.owner) facts.push(`właściciel konta źródła=${lexiconName(ctx.owner) ?? ctx.owner}`);
  return promptText("identity-context", { facts: facts.length > 0 ? facts.join("; ") : "nie rozpoznano wyraźnego wydawcy" });
}

export interface IdentityGuard {
  outcome: "pass" | "fallback";
  unsupportedTitleEntityIds: string[];
  unsupportedSummaryEntityIds: string[];
}

/**
 * A model only words the copy; it cannot introduce a company the input does not name. A title that
 * does falls back to the original Chinese title (or nothing), a summary that does is dropped.
 */
export function enforceIdentity(input: TranslateInput, copy: { titleZh: string; summaryZh: string }) {
  const allowed = new Set(identityContext(input).allowed);
  const unsupportedTitleEntityIds = matchEntityIds([copy.titleZh]).filter((id) => !allowed.has(id));
  const unsupportedSummaryEntityIds = matchEntityIds([copy.summaryZh]).filter((id) => !allowed.has(id));
  return {
    titleZh: unsupportedTitleEntityIds.length ? (looksPolish(input.title) ? input.title : "") : copy.titleZh,
    summaryZh: unsupportedSummaryEntityIds.length ? "" : copy.summaryZh,
    identityGuard: {
      outcome: unsupportedTitleEntityIds.length || unsupportedSummaryEntityIds.length ? "fallback" : "pass",
      unsupportedTitleEntityIds,
      unsupportedSummaryEntityIds,
    } as IdentityGuard,
  };
}

// Answer-first summary length

// Lengths of a Polish summary: two or three sentences, roughly 160–450 characters.
const SUMMARY_MAX = 450;
const SUMMARY_MIN_RICH = 160;
const SUMMARY_MIN = 100;

/** Sentences: a . ! ? followed by a capital (so "3.5 proc. w" and "m.in. kanban" stay whole). */
function sentencesOf(text: string): string[] {
  const parts = text.split(/(?<=[.!?。！？])\s+(?=[\p{Lu}\d„"«])/u).filter((p) => p.trim());
  return parts.length ? parts.map((p) => `${p} `) : [text];
}

export function compactAnswerFirstSummary(summary: string, maxChars = SUMMARY_MAX): string {
  const text = summary.trim().replace(/\s*\n+\s*/g, " ");
  if (text.length <= maxChars) return text;
  let result = "";
  for (const sentence of sentencesOf(text)) {
    if ((result + sentence).length > maxChars) break;
    result += sentence;
    if (result.length >= SUMMARY_MIN_RICH) break;
  }
  if (result.trim().length >= SUMMARY_MIN) return result.trim();
  // The first sentence alone is too long: cut at a clause boundary, never inside a name or number.
  const clauses = text.match(/[^,;:–]+[,;:–]?\s*/gu) ?? [text];
  result = "";
  for (const clause of clauses) {
    if ((result + clause).length + 1 > maxChars) break;
    result += clause;
    if (result.length >= SUMMARY_MIN_RICH) break;
  }
  return result.trim().length >= SUMMARY_MIN ? `${result.trim().replace(/[,;:–]$/u, "")}.` : text;
}

function answerFirstSummaryLengthOk(summary: string, input: TranslateInput): boolean {
  const trimmed = summary.trim();
  const sourceLength = (input.sourceKind === "x_search" ? input.text : cleanArticleTextForLLM(input.text)).trim().length;
  const sentences = sentencesOf(trimmed).length;
  const rich = sourceLength >= 1200;
  return trimmed.length <= SUMMARY_MAX + 30 && trimmed.length >= (rich ? SUMMARY_MIN_RICH : SUMMARY_MIN) && sentences <= 3 && (!rich || sentences >= 2);
}

export const isShortTweetInput = (input: TranslateInput) => input.sourceKind === "x_search" && isShortTweet(input.mainText || input.title);

/** The length rule (compacted without another call) and the identity guard, for any writing model. */
export function finalizeCopy(input: TranslateInput, copy: { titleZh: string; summaryZh: string }) {
  let summaryZh = copy.summaryZh;
  if (!isShortTweetInput(input) && summaryZh && !answerFirstSummaryLengthOk(summaryZh, input)) summaryZh = compactAnswerFirstSummary(summaryZh);
  return enforceIdentity(input, { titleZh: copy.titleZh, summaryZh });
}

// Title/summary prompts for items the content understanding does not write

const sourceName = (name?: string) => name?.trim() || "(nie podano)";

function anchorDate(d: Date | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return "nie podano";
  return siteDate(d);
}

export function buildArticlePrompt(input: TranslateInput): string {
  return promptText("summarize-article", {
    publishedDate: anchorDate(input.publishedAt),
    today: anchorDate(new Date()),
    sourceName: sourceName(input.sourceName),
    identity: identityPrompt(input),
    title: input.title,
    body: input.text ? clampText(cleanArticleTextForLLM(input.text), 6000) : promptText("summarize-article-empty"),
  });
}

/** The quoted post's block, appended after a blank line when there is one. */
function quotedBlock(input: TranslateInput, name: string): string {
  if (!input.quotedText) return "";
  return `\n\n${promptText(name, { quotedLabel: input.quotedAuthor ? `@${input.quotedAuthor}` : "Wpis cytowany", quotedText: clampText(input.quotedText, 1500) })}`;
}

export function buildShortTweetPrompt(input: TranslateInput): string {
  const post = clampText(input.mainText || input.text || input.title, 4000);
  return promptText("summarize-short-post", { sourceName: sourceName(input.sourceName), identity: identityPrompt(input), post }) + quotedBlock(input, "summarize-short-post-quoted");
}

export function buildLongTweetPrompt(input: TranslateInput): string {
  const post = clampText(input.mainText || input.text || input.title, 4000);
  return promptText("summarize-long-post", { sourceName: sourceName(input.sourceName), identity: identityPrompt(input), post }) + quotedBlock(input, "summarize-long-post-quoted");
}

/** Prompt lines a model sometimes repeats after its answer (Źródło: …, 【Zweryfikowany kontekst tożsamości】…, Oryginalny tytuł: …). */
const ECHO_LINE = /^(Źródło:|【Zweryfikowany kontekst tożsamości】|Te fakty służą wyłącznie|Oryginalny tytuł:|【Kotwica czasu】)/;

/** The answer without prompt lines repeated at its end. */
export function stripEcho(text: string): string {
  const lines = text.split("\n");
  while (lines.length && (lines[lines.length - 1]!.trim() === "" || ECHO_LINE.test(lines[lines.length - 1]!.trim()))) lines.pop();
  return lines.join("\n").trim();
}

/** `title_pl:` / `summary_pl:` / `body_pl:` lines (older `_zh` labels too), with fallbacks for answers that drop the labels. */
export function parseTranslateOutput(text: string): { titleZh: string; summaryZh: string; bodyZh: string } {
  let titleZh = "";
  let summaryZh = "";
  let bodyZh = "";
  let titleLine = -1;
  let summaryLine = -1;
  let bodyLine = -1;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i]!.trim();
    const title = t.match(/^title_(?:pl|zh)\s*[:：]\s*(.*)$/i);
    if (title) { titleZh = title[1]!.trim(); titleLine = i; continue; }
    const summary = t.match(/^summary_(?:pl|zh)\s*[:：]\s*(.*)$/i);
    if (summary) { summaryZh = summary[1]!.trim(); summaryLine = i; continue; }
    const body = t.match(/^body_(?:pl|zh)\s*[:：]\s*(.*)$/i);
    if (body) { bodyZh = body[1]!.trim(); bodyLine = i; continue; }
  }
  // A title without a labelled summary or body: the lines after it are the summary.
  if (titleZh && !summaryZh && bodyLine < 0 && titleLine >= 0) {
    const rest = lines.slice(titleLine + 1).map((l) => l.trim()).filter(Boolean);
    if (rest.length) summaryZh = rest.join("\n");
  }
  // A summary split over lines: join the unlabelled lines after it.
  if (summaryLine >= 0) {
    const more: string[] = [];
    for (let i = summaryLine + 1; i < lines.length; i += 1) {
      const t = lines[i]!.trim();
      if (!t) continue;
      if (/^(?:title|summary|body)_(?:pl|zh)\s*[:：]/i.test(t)) break;
      more.push(t);
    }
    const parts = [summaryZh, ...more].filter(Boolean);
    if (parts.length) summaryZh = parts.join("\n");
  }
  // A body over lines keeps its paragraph breaks.
  if (bodyLine >= 0) {
    const more: string[] = [];
    for (let i = bodyLine + 1; i < lines.length; i += 1) {
      if (/^(?:title|summary|body)_(?:pl|zh)\s*[:：]/i.test(lines[i]!.trim())) break;
      more.push(lines[i]!);
    }
    while (more.length && more[more.length - 1]!.trim() === "") more.pop();
    const parts = bodyZh ? [bodyZh, ...more] : more;
    if (parts.length) bodyZh = parts.join("\n");
  }
  if (!titleZh && !summaryZh && !bodyZh) {
    const rest = text.trim().split(/\r?\n/).filter(Boolean);
    if (rest.length >= 2) {
      titleZh = rest[0]!.trim();
      summaryZh = rest.slice(1).join("\n").trim();
    } else if (rest.length === 1) {
      titleZh = rest[0]!.trim();
    }
  }
  return { titleZh, summaryZh: stripEcho(summaryZh), bodyZh: stripEcho(bodyZh) };
}
