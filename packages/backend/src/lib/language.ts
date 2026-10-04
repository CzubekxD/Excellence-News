// The reader's language. The site writes its titles, summaries and translations in Polish; these
// checks decide whether a text already is in Polish (and so needs no translation) without a model call.
// Field and column names that end in `_zh`/`Zh` are historical: they hold the reader-language copy.

/** BCP 47 code of the reader's language (feeds, HTML lang, translation targets). */
export const READER_LANGUAGE = "pl";

/** Letters only Polish uses among the languages the sources write in (ó is shared with Spanish). */
const POLISH_LETTERS = /[ąćęłńśźżĄĆĘŁŃŚŹŻ]/g;

/** Frequent Polish function words; a run of ordinary prose hits several in every sentence. */
const POLISH_WORDS = new Set([
  "i", "w", "we", "z", "ze", "na", "do", "o", "od", "po", "za", "przy", "pod", "nad", "bez", "przez", "dla", "u",
  "się", "nie", "to", "że", "jest", "są", "był", "była", "było", "być", "będzie", "jak", "co", "czy", "ale", "już",
  "oraz", "lub", "albo", "też", "także", "tylko", "jego", "jej", "ich", "tego", "tej", "ten", "ta", "te", "tym",
  "który", "która", "które", "którzy", "których", "którym", "może", "można", "jeszcze", "więc", "gdy", "kiedy",
  "został", "została", "zostało", "zostały", "roku", "proc", "mln", "mld", "zł",
]);

/** How Polish a text reads: share of Polish function words plus a bounded bonus for Polish-only letters. */
export function polishScore(s: string): number {
  const words = s.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length === 0) return 0;
  const hits = words.filter((w) => POLISH_WORDS.has(w)).length;
  const letters = s.match(/\p{L}/gu)?.length ?? 0;
  const special = s.match(POLISH_LETTERS)?.length ?? 0;
  return hits / words.length + (letters ? Math.min(0.3, (special / letters) * 6) : 0);
}

/** A text in Polish: its function words or its letters say so. Short titles lean on the letters. */
export function looksPolish(s: string): boolean {
  const text = s.replace(/https?:\/\/\S+/g, " ").replace(/[@#][\p{L}\p{N}_]+/gu, " ");
  const words = text.match(/\p{L}+/gu) ?? [];
  if (words.length === 0) return false;
  if (words.length < 4) return /[ąćęłńśźż]/i.test(text) && !/[ěřůšč]/i.test(text);
  return polishScore(text) >= 0.18;
}

/** A body in the reader's language: its declared language, or (undeclared) the opening of its text. */
export function isReaderLanguage(language: string | null | undefined, sample: string): boolean {
  const declared = language?.trim().toLowerCase() ?? "";
  if (declared) return declared === READER_LANGUAGE || declared.startsWith(`${READER_LANGUAGE}-`);
  return looksPolish(sample.slice(0, 600));
}
