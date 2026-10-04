// Tożsamość serwisu i teksty widoczne dla czytelnika. Przy zmianie branży zaczynasz od tego pliku.
// Czyta go zarówno strona, jak i backend; po zmianie przebuduj obrazy (docker compose up --build).
// Domeny tu nie ma: ustawiasz ją przy wdrożeniu zmienną środowiskową SITE_URL.

/**
 * Kiedy wychodzą dziennik, tygodnik i miesięcznik (czas polski, HH:mm). Dziennik obejmuje 24 godziny przed
 * tą porą, tygodnik wychodzi w poniedziałek po zakończonym tygodniu, miesięcznik 1. dnia miesiąca.
 * Harmonogram, okna wydań, alarmy o brakującym wydaniu i wszystkie teksty z godziną czytają ten obiekt
 * (pliki w public/ używają {{dailyTime}}, {{weeklyTime}}, {{monthlyTime}}). Harmonogram sprawdza co pół
 * godziny, więc wpisuj pełne godziny albo wpół do.
 */
export const EDITION_TIMES = { daily: "07:00", weekly: "07:30", monthly: "08:00" };

/** „codziennie o 07:00”, „w poniedziałki o 07:30”, „1. dnia miesiąca o 08:00”: pora wydania w zdaniu. */
export const EDITION_WHEN = {
  daily: `codziennie o ${EDITION_TIMES.daily}`,
  weekly: `w poniedziałki o ${EDITION_TIMES.weekly}`,
  monthly: `1. dnia miesiąca o ${EDITION_TIMES.monthly}`,
};

export const SITE = {
  /** Nazwa serwisu: nawigacja, tytuły stron, obrazki udostępniania, RSS, MCP, panel admina. */
  name: "Excellence News",
  /**
   * Słowo branżowe, doklejane do domyślnych nazw: „Dziennik OPEX”, „Tygodnik OPEX”.
   */
  subject: "OPEX",
  /** Pełny tytuł strony głównej (karta przeglądarki, wyniki wyszukiwania). */
  homeTitle: "Excellence News — Lean, OPEX, Agile i koszty · codzienny wybór i dziennik",
  /** Tytuł katalogu tematów (/topics). */
  topicsTitle: "Tematy: firmy i instytucje, obszary doskonalenia, formy treści",
  /** Przykład w polu formularza opinii. */
  feedbackExample: "Np. szukałem informacji o … i nie znalazłem … Spodziewałem się …",
  /** Zdanie pod tytułem strony opinii. */
  feedbackLead: "Błąd, brakujące źródło, pomysł na funkcję albo coś, co przeszkadza: napisz.",
  /** Podpowiedź w polu e-mail formularza opinii. */
  feedbackEmailHint: "Zostaw e-mail, jeśli chcesz odpowiedź",
  /** Opis w jednym zdaniu: wyszukiwarki, karty udostępniania, RSS, llms.txt. */
  description: `Najważniejsze wiadomości o Lean, Operational Excellence, Agile i optymalizacji kosztów z kilkudziesięciu źródeł, po polsku. Te same wydarzenia z różnych źródeł łączone w jedno, dziennik ${EDITION_WHEN.daily}.`,
  /** Dłuższy opis pod pierwszym zdaniem w llms.txt (opcjonalnie). */
  llmsIntro: null as string | null,
  /** Jedna linijka drobnym drukiem: pod obrazkami udostępniania i plakatami. */
  tagline: "Co warto wiedzieć o doskonaleniu operacji",
  /** Słowa kluczowe dla wyszukiwarek (dane strukturalne strony głównej). */
  keywords: ["lean", "operational excellence", "OPEX", "agile", "kanban", "optymalizacja kosztów", "ciągłe doskonalenie", "TPS"] as string[],
  /** Rok, od którego serwis zbiera wiadomości (zakres w danych strukturalnych, opcjonalnie). */
  since: "2026" as string | null,
  /** Język interfejsu (HTML lang, og:locale). */
  locale: "pl-PL",
  /** Domyślny adres, używany tylko gdy nie ustawiono SITE_URL. */
  defaultUrl: "http://localhost:3000",
  /** Ikony z site/brand/ publikowane w katalogu głównym obok standardowych (opcjonalnie). */
  rootIcons: [] as string[],
  /**
   * Prefiks nazw narzędzi MCP (małe litery, cyfry, podkreślnik): exnews_get_latest, exnews_search…
   * Nie zmieniaj, gdy ktoś już się podłączył.
   */
  mcpPrefix: "exnews",
  /**
   * Wersja publicznego interfejsu (MCP, OpenAPI, llms.txt), tylko rośnie.
   * Podnieś główny numer, gdy zmieniasz znaczenie istniejących pól.
   */
  interfaceVersion: "4.0.0",
  /** Kontaktowy e-mail (opcjonalnie): trafia do llms.txt i instrukcji dla agentów. */
  contactEmail: null as string | null,
  /** Linijka drobnym drukiem na dole strony „O serwisie” (opcjonalnie). */
  footerNote: "Zbudowane na otwartym frameworku AIHOT (licencja MIT)",
  /** Chiński numer rejestracyjny ICP; w Polsce zostaw null. */
  icp: null as string | null,
  /** Adres repozytorium na GitHubie (opcjonalnie): pokazuje link „Kod źródłowy” w menu. */
  github: null as string | null,
  /** Operator serwisu w danych strukturalnych (dla wyszukiwarek). */
  organization: {
    name: "Excellence News",
    /** Założyciel (opcjonalnie). */
    founder: null as null | { name: string; alternateName?: string; jobTitle?: string; description?: string; url?: string },
  },
  /** Nazwa i wersja w nagłówku User-Agent przy pobieraniu źródeł. Nie podszywaj się pod inne serwisy. */
  crawlerName: "ExcellenceNewsBot/1.0",
} as const;

/** Strony „Zasady korzystania” i „Prywatność” (treść w pages/). */
export const POLICY = {
  terms: {
    /** Nazwa strony: nawigacja, stopka, tytuł. */
    name: "Zasady korzystania",
    description: "Zasady korzystania ze stron, RSS, publicznego API i MCP serwisu.",
    /** Zdanie o tej stronie w llms.txt (opcjonalnie). */
    covers: null as string | null,
    /** Przypomnienia o zasadach w kolumnach RSS i API strony dla agentów (opcjonalnie). */
    notes: null as null | { rss: string; api: string },
    /**
     * Zdanie o tym, które zastosowania wymagają zgody (opcjonalnie): llms dopisywane w llms.txt po informacji
     * o prawach autorskich, agent na początku sekcji zasad w instrukcji dla agentów.
     */
    license: null as null | { llms: string; agent: string },
    /**
     * Nagłówki odpowiedzi API, RSS i OpenAPI deklarujące zasady (opcjonalnie): dodawane bez zmian, razem
     * z nagłówkiem Link do tej strony (rel="terms-of-service").
     */
    headers: null as null | Record<string, string>,
  },
  privacy: {
    description: "Jak serwis obchodzi się z danymi w przeglądarce, opiniami i logami dostępu.",
    /** Zdanie o tej stronie w llms.txt (opcjonalnie). */
    covers: null as string | null,
  },
  /**
   * Czy tekst i zdjęcia samego wpisu z X liczą się jako pełny tekst: jeśli tak, pokazywane tylko wtedy,
   * gdy źródło pozwala na pełny tekst; jeśli nie, zawsze, jak tytuł i streszczenie.
   */
  xPostIsFullText: true,
} as const;

/** Kilka sformułowań na kartach i stronach wiadomości. */
export const ITEM_COPY = {
  /** Jak nazywa się zdanie modelu wyjaśniające wybór: karty, strona wiadomości, eksport, odpowiedzi dla agentów. */
  reasonLabel: "Dlaczego warto",
  /** Czy czytelnik widzi ocenę AI na stronie i obrazkach. Dotyczy tylko wyświetlania: API i MCP zawsze podają score. */
  showScore: true,
};

/** Karta z kodem QR na stronie „O serwisie”. */
interface ContactCard {
  kind: string;
  title: string;
  note: string;
  /** Nazwa pliku w katalogu głównym, do którego linkowano z zewnątrz (opcjonalnie), np. qr-kontakt.jpg. */
  alias?: string;
}

/** Teksty strony „O serwisie”. Liczby (źródła, wiadomości, wybór, wydania) przychodzą z bieżących statystyk. */
export const ABOUT = {
  kicker: `O serwisie ${SITE.name}`,
  /** Opis strony (wyniki wyszukiwania, karty udostępniania). */
  description: `O serwisie ${SITE.name}: ${SITE.description}`,
  /** Duży nagłówek: pierwsza linia zwykłym kolorem, druga akcentem. */
  headline: ["W Lean i OPEX codziennie dzieje się dużo,", "naprawdę ważnych jest kilka rzeczy."] as [string, string],
  /**
   * Akapit pod nagłówkiem. {sources} zamienia się na bieżącą liczbę źródeł (spacje po obu stronach dodawane
   * automatycznie, więc nie wpisuj ich); gdy statystyk brak, wstawiane jest sourcesFallback.
   */
  lead: `${SITE.name} śledzi za Ciebie{sources}źródeł: pobiera, łączy, ocenia i wybiera, a ${EDITION_WHEN.daily} wydaje dziennik. Za darmo, bez rejestracji.`,
  sourcesFallback: "kilkadziesiąt",
  /** Cztery etapy pod animacją rzeki źródeł. */
  steps: {
    collect: "Instytuty Lean, firmy doradcze, portale branżowe i blogi praktyków; im częściej źródło publikuje, tym częściej je sprawdzamy, najczęściej co 15 minut.",
    store: "Wszystko, co pobierzemy, zostaje zapisane, a relacje o tym samym wydarzeniu łączymy w jedno. Z tego liczony jest ranking popularności.",
    select: `Model najpierw sprawdza, czy tekst dotyczy branży i niesie konkretną informację, potem pisze po polsku tytuł, streszczenie i „${ITEM_COPY.reasonLabel}”. Reklamy i powielane teksty nie przechodzą.`,
    publish: `Dziennik ${EDITION_WHEN.daily}, tygodnik ${EDITION_WHEN.weekly}, miesięcznik ${EDITION_WHEN.monthly}.`,
  },
  /**
   * Blok autora (opcjonalnie), null go ukrywa.
   * avatarSourceId: id źródła z kontem X, którego awatar użyć (opcjonalnie).
   * Kody QR wgrywa się w panelu w „Ustawieniach” albo do site/brand/contact/; bez kodu karty nie ma.
   */
  maker: null as null | {
    name: string;
    avatarSourceId?: string | null;
    greeting: string[];
    wechat?: ContactCard;
    feishu?: ContactCard;
  },
  /** Informacja o prawach autorskich i usuwaniu treści na dole strony; w środku link do strony opinii. */
  copyright: [`${SITE.name} to agregator streszczeń i indeks lektur; prawa do oryginałów należą do ich autorów. Jeśli jesteś wydawcą i chcesz poprawki, usunięcia lub innego sposobu prezentacji, napisz do nas przez `, "."] as [string, string],
  /** Kotwica linku „Zasady korzystania” na dole strony (opcjonalnie); nie zmieniaj, gdy ktoś do niej linkuje. */
  termsAnchor: null as string | null,
} as const;

/** Podpowiedzi dla administratora w panelu (opcjonalnie). */
export const ADMIN = {
  /** Linijka pod tytułem strony „Opinie”. */
  feedbackNote: null as string | null,
  /** Dodatkowe zdanie w oknie potwierdzenia przy blokowaniu nadawcy opinii. */
  banNote: null as string | null,
  /** Dodatkowe zdanie w oknie potwierdzenia przy zmianie limitu płatnej usługi. */
  budgetNote: null as string | null,
};

/** Przykłady na stronie dla agentów. */
export const AGENT = {
  /** Wiersz „Szukaj” w tabeli narzędzi MCP: co da się znaleźć i jak pytać. */
  search: { scope: "po firmie, metodzie, osobie lub temacie z ostatnich 7 dni", ask: "Co nowego w Toyota Production System?" },
};

/** Sformułowania w dzienniku, tygodniku i miesięczniku. */
export const REPORTS = {
  /** Linijka wydawcy pod winietą. */
  imprint: SITE.name.toUpperCase(),
  /** Słowo obok winiety. */
  motto: SITE.subject as string,
  /** Opisy stron wydań (wyniki wyszukiwania, karty udostępniania), bez kropki; llms.txt też ich używa. */
  descriptions: {
    daily: `${SITE.name}: dziennik ${SITE.subject} wydawany ${EDITION_WHEN.daily}`,
    weekly: `Tygodniowe podsumowanie ${SITE.subject}: najważniejsze wydarzenia tygodnia`,
    monthly: `Miesięczny przegląd ${SITE.subject}: najważniejsze wydarzenia miesiąca`,
  },
  /**
   * Jak nazywa się jedna pozycja wydania („4 ważne wiadomości”): w tytule bez czołówki, w winiecie i spisie
   * wydań, w zdaniu tygodnika i miesięcznika bez wstępu. forms to formy liczby mnogiej: [1, 2–4, 5+].
   */
  entry: { measure: "", noun: "ważne wiadomości", forms: ["ważna wiadomość", "ważne wiadomości", "ważnych wiadomości"] as Plural },
  /** Jednostki pozostałych liczb w winiecie; wybór i liczba wydań tak samo na stronie „O serwisie” i tematów. */
  metricUnits: {
    sourcesCount: ["źródło", "źródła", "źródeł"] as Plural,
    firstPartyEvents: ["publikacja z pierwszej ręki", "publikacje z pierwszej ręki", "publikacji z pierwszej ręki"] as Plural,
    selectedCount: ["wybrana wiadomość", "wybrane wiadomości", "wybranych wiadomości"] as Plural,
    reportsCovered: ["wydanie dziennika", "wydania dziennika", "wydań dziennika"] as Plural,
  },
  /** „Razem N …” na obrazku udostępniania wydania. */
  shareUnit: ["ważna wiadomość", "ważne wiadomości", "ważnych wiadomości"] as Plural,
};

/** Alarmy techniczne (tylko dla administratora): sformułowania zależne od wdrożenia. */
export const ALERTS = {
  /** Po ilu minutach bez nowych artykułów alarmować, że serwis przestał zbierać (maks. doba); ALERT_QUIET_MINUTES ma pierwszeństwo. */
  quietMinutes: 360,
  /** W tym samym alarmie, po „brak”, zdanie o zwykłej liczbie artykułów; null pomija. */
  usualFlow: null as string | null,
  /** W alarmie o zatrzymanym workerze: jak zobaczyć jego logi. */
  workerLogs: "zobacz logi workera (docker compose logs worker)",
  /** Gdy dostawca modelu odmawia albo kończy się limit: które kroki stanęły; niewpisani dostawcy dostają ogólne zdanie. */
  modelStops: {} as Record<string, string>,
};

/** Domyślne ustawienia nowego źródła w panelu. */
export const SOURCE_DEFAULTS = {
  /** Pełny tekst na stronie; false pokazuje tylko streszczenie i link do oryginału. */
  siteFulltext: false,
};

/**
 * Źródła typu społecznościowego (id źródła): popularność liczona per konto autora, nie per całe źródło.
 * dev to strumień artykułów dev.to, hn to wpisy z Hacker News.
 */
export const COMMUNITY_FEEDS: { dev: string[]; hn: string[] } = {
  dev: [],
  hn: [],
};

/** Teksty na obrazkach udostępniania stron (/og/pages/*.png). Obrazek katalogu tematów powstaje z liczby tematów. */
export const CARDS: Record<string, { kicker: string; title: string; subtitle: string; accent?: "hot" | "amber" }> = {
  site: { kicker: `Codzienny wybór ${SITE.subject}`, title: SITE.tagline, subtitle: SITE.description },
  all: { kicker: "Wszystkie wiadomości", title: "Najnowsze ze wszystkich źródeł w jednym miejscu", subtitle: "Wiadomości ze wszystkich źródeł według czasu, z filtrami kategorii i tagów." },
  hot: { kicker: "Na czasie", title: "O czym się mówi w ostatnich 48 godzinach", subtitle: "Indeks popularności, trend i źródła, które go tworzą.", accent: "hot" },
  daily: { kicker: withSubject("Dziennik"), title: `Codziennie o ${spokenTime(EDITION_TIMES.daily)}: dziennik do przeczytania przy kawie`, subtitle: "Co warto było wiedzieć z poprzedniego dnia." },
  weekly: { kicker: withSubject("Tygodnik"), title: "Najważniejsze z tygodnia w jednym miejscu", subtitle: "Główne wątki tygodnia, ważne publikacje i dyskusje warte powrotu." },
  monthly: { kicker: withSubject("Miesięcznik"), title: "Co zmieniło się w miesiącu", subtitle: "Główne wątki i kluczowe wydarzenia miesiąca." },
  about: { kicker: "O serwisie", title: `O serwisie ${SITE.name}`, subtitle: SITE.description },
  terms: { kicker: "Zasady korzystania", title: `${SITE.name}: zasady korzystania`, subtitle: "Zakres korzystania ze stron, API, RSS i MCP." },
  privacy: { kicker: "Prywatność", title: `${SITE.name}: prywatność`, subtitle: "Logi dostępu, dane w przeglądarce i opinie." },
  changelog: { kicker: "Zmiany", title: `${SITE.name}: dziennik zmian`, subtitle: "Nowe funkcje, poprawki, ogłoszenia i wycofania." },
  feedback: { kicker: "Opinie", title: "Napisz, co możemy poprawić", subtitle: "Treść, funkcje, integracje, poprawki i usunięcia na prośbę wydawcy." },
  agent: { kicker: "Dla agentów", title: `Podłącz ${SITE.name} do swojego agenta`, subtitle: "MCP, RSS i API: anonimowo, tylko do odczytu, bez klucza API." },
};

/** Zasady dostępu do publicznego interfejsu: instrukcja dla agentów i llms.txt. */
export const ACCESS = {
  /** Ile zapytań na minutę z jednego IP (opcjonalnie, limituje reverse proxy); null: bez limitu, instrukcja o nim nie wspomina. */
  ratePerMinute: null as number | null,
  /** User-Agent, który mają podawać skrypty synchronizujące dane (opcjonalnie). */
  userAgent: null as string | null,
};

/** Ustawienia tego konkretnego wdrożenia (opcjonalnie). */
export const DEPLOYMENT = {
  /** Katalog z plikami grup poświadczeń (models.env, collectors.env…), względem katalogu repozytorium; AIHOT_CREDENTIALS_DIR ma pierwszeństwo. */
  credentialsDir: null as string | null,
  /** Nazwy plików grup poświadczeń (opcjonalnie); niewpisane grupy używają „nazwa-grupy.env”. */
  credentialFiles: {} as Partial<Record<string, string>>,
  /** Dodatkowe wymagane poświadczenia ([grupa, zmienna]); sprawdzane przy starcie produkcyjnego API. */
  requiredSecrets: [] as const,
  /** Host, który widzi produkcyjne API (domena origin za CDN, opcjonalnie). */
  originHost: null as string | null,
  /** Nagłówek, którym reverse proxy przekazuje adres powrotu po logowaniu do panelu (opcjonalnie). */
  loginReturnHeader: null as string | null,
  /**
   * Limit ruchu proxy obrazków do serwerów źródłowych; po przekroczeniu niezbuforowane obrazki dostają 503.
   * null: bez limitu. IMGPROXY_UPSTREAM_MB_PER_MINUTE i IMGPROXY_UPSTREAM_GB_PER_DAY mają pierwszeństwo.
   */
  imageUpstreamBudget: null as null | { mbPerMinute: number; gbPerDay: number },
  /** Domeny łączone bezpośrednio, z pominięciem EGRESS_PROXY_URL (opcjonalnie). */
  directFetchHosts: [] as string[],
  /**
   * Zbiór oznaczonych przykładów do ewaluacji wyboru (scripts/eval-selection.ts bez argumentów).
   * null: wszystkie przykłady z .data/gold.jsonl (maks. 200), progi sprawdzane w zakresie 40–90.
   */
  selectionGold: null as null | { file: string; sample: number; split: string; sweep: [number, number] },
};

/** Sformułowania w opisach kanałów RSS. */
export const FEED_COPY = {
  /** Czego jeszcze nie ma w kanale „Wszystkie” poza nieocenionymi, nieistotnymi i scalonymi duplikatami (opcjonalnie). */
  allLeavesOut: [] as string[],
};

/**
 * Kategorie publicznego interfejsu (API, RSS, MCP) różne od strony (opcjonalnie). Nie zmieniaj po starcie:
 * klucze kategorii są w parametrach i adresach subskrypcji.
 * merge: kategoria publikowana jako inna; feedLabels: nazwa w tytule kanału RSS kategorii.
 */
export const PUBLIC_CATEGORIES = {
  merge: {},
  feedLabels: {},
} as const;

/** Formy liczebnika: [1, 2–4 (bez 12–14), pozostałe]. */
export type Plural = readonly [one: string, few: string, many: string];

/** Forma rzeczownika do liczby: plural(1, f) → „źródło”, plural(3, f) → „źródła”, plural(5, f) → „źródeł”. */
export function plural(n: number, forms: Plural): string {
  const abs = Math.abs(Math.trunc(n));
  if (abs === 1) return forms[0];
  const tens = abs % 100;
  const ones = abs % 10;
  if (ones >= 2 && ones <= 4 && !(tens >= 12 && tens <= 14)) return forms[1];
  return forms[2];
}

/** „12 źródeł”: liczba z odmienionym rzeczownikiem. */
export function count(n: number, forms: Plural): string {
  return `${n.toLocaleString("pl-PL")} ${plural(n, forms)}`;
}

/** „Dziennik OPEX”: rzeczownik z doklejonym słowem branżowym. */
export function withSubject(noun: string): string {
  return `${noun} ${SITE.subject}`;
}

/** „Wszystkie wiadomości OPEX”: tekst, a po nim słowo branżowe (albo rzeczownik ze słowem branżowym). */
export function subjectAfter(text: string, noun?: string): string {
  return `${text} ${noun ? withSubject(noun) : SITE.subject}`;
}

/** „7:00”, „10:30”: godzina HH:mm bez zera na początku. */
function spokenTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number) as [number, number];
  return `${hour}:${String(minute).padStart(2, "0")}`;
}
