// System klasyfikacji tej branży: kategorie, słownik tagów, katalog firm i instytucji oraz słownik
// tożsamości, który pilnuje, żeby model nie przypisał wiadomości złej firmie.
// Model taguje według tych słowników, strony tematów (topics.json) grupują po tagach, filtry po kategoriach.
// Klucze kategorii trafiają do adresów (/all?category=…), więc po starcie serwisu ich nie zmieniaj;
// tagi i katalog firm można zmieniać w każdej chwili.

/**
 * Kategorie na stronie (filtry, plakietki na kartach, kanały RSS kategorii). key to tożsamość w adresach
 * i API, po starcie nie zmieniaj. section to dział w dzienniku (kilka kategorii może dzielić dział, kolejność
 * jak tutaj); guide mówi modelowi strukturyzującemu, co należy do kategorii i gdzie są granice z sąsiednimi
 * (ogólne zasady klasyfikacji są w prompts/structure.md).
 * commentary oznacza kategorię komentarzową: gdy dziennik opisał już wydarzenie, dalsze komentarze z tej
 * kategorii dostają tylko jedną linijkę (chyba że pisze o nich wiele źródeł).
 * Niesklasyfikowane wiadomości trafiają do działu kategorii o kluczu industry.
 * feedLabel to nazwa w tytule kanału RSS kategorii (domyślnie label).
 */
export const CATEGORIES = [
  { key: "lean", label: "Lean i TPS", feedLabel: "Lean i Toyota Production System", section: "Lean i ciągłe doskonalenie", guide: "Lean, Toyota Production System, kaizen, gemba, standaryzacja pracy, Toyota Kata, A3, Hoshin Kanri, systemy zarządzania Lean i przepływ w produkcji. Liczy się metoda albo jej wdrożenie; sam fakt, że firma jest Toyotą, nie wystarcza (biznes Toyoty to Przemysł)." },
  { key: "opex", label: "OPEX i jakość", feedLabel: "Operational Excellence i jakość", section: "Operational Excellence i jakość", guide: "Programy Operational Excellence, Six Sigma, zarządzanie jakością, TPM i utrzymanie ruchu, doskonalenie procesów biznesowych (BPM), benchmarking procesów, automatyzacja i AI użyte do poprawy operacji. Lean jako metoda idzie do Lean i TPS; same cięcia budżetów do Kosztów." },
  { key: "agile", label: "Agile i flow", feedLabel: "Agile, Kanban i flow", section: "Agile, Kanban i flow", guide: "Agile, Scrum, Kanban (metoda Kanban w pracy z wiedzą), metryki przepływu, OKR, Agile na dużą skalę (SAFe, Flight Levels), zarządzanie produktem i portfelem. Kanban jako system ssący w fabryce należy do Lean i TPS." },
  { key: "costs", label: "Koszty", feedLabel: "Koszty i efektywność", section: "Koszty i efektywność", guide: "Optymalizacja kosztów: koszty pośrednie, SG&A, koszty pracy bezpośredniej i pośredniej, zakupy i oszczędności zakupowe, energia jako koszt, benchmarki kosztów funkcji wsparcia, programy transformacji kosztowej. Koszty transportu i frachtu idą do Łańcucha dostaw." },
  { key: "supply-chain", label: "Łańcuch dostaw", feedLabel: "Logistyka i łańcuch dostaw", section: "Logistyka i łańcuch dostaw", guide: "Transport i fracht (stawki, paliwo, przewoźnicy), logistyka wewnętrzna i magazyny, planowanie, zapasy, odporność łańcucha dostaw, cła wpływające na dostawy. Inwestycje w nowe fabryki to Przemysł." },
  { key: "industry", label: "Przemysł", feedLabel: "Przemysł i motoryzacja", section: "Przemysł i motoryzacja", guide: "Wydarzenia biznesowe w przemyśle i motoryzacji: inwestycje, otwarcia i zamknięcia zakładów, przejęcia, wyniki, zwolnienia, nominacje, regulacje i polityka przemysłowa, dane makro dla produkcji (PMI). Gdy tekst opisuje metodę doskonalenia, wybierz kategorię metody." },
  { key: "leadership", label: "Ludzie i kultura", feedLabel: "Przywództwo, ludzie i kultura", section: "Ludzie, przywództwo i kultura", guide: "Przywództwo, rola managera, zaangażowanie, kultura organizacyjna, zarządzanie zmianą, rozwój kompetencji, psychologia zespołu. Liczy się teza autora albo wnioski z doświadczenia; konkretne narzędzie Lean lub Agile idzie do swojej kategorii.", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * Najważniejszy typ publikacji w branży (w AI: nowy model), liczony w winiecie dziennika.
 * Branża OPEX nie ma takiego jednego typu, więc null: winieta tej liczby nie pokazuje.
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = null;

/** Ogólne słowa branżowe (małymi literami), których podsumowania tygodnika i miesięcznika mogą używać bez źródła w pozycjach. Nazwa serwisu liczy się automatycznie. */
export const PLAIN_TERMS: readonly string[] = ["lean", "opex", "tps", "kaizen", "gemba", "agile", "kanban", "scrum", "six sigma", "tpm", "oee", "kpi", "okr", "ai", "erp", "ceo", "cfo", "coo", "pmi", "sg&a", "ue"];

/**
 * Typ treści, który krok rozumienia przypisuje każdemu tekstowi (opisany w prompts/content-understanding.md;
 * zmiana typów wymaga zmiany tego promptu). Prompt oceny (prompts/selection-score.md) daje typom różne wagi pięciu osi.
 */
export const ITEM_TYPES = ["case_study", "method_or_tool", "research_or_benchmark", "industry_event", "opinion_analysis", "tutorial_explainer", "announcement"] as const;

// ── Słownik tagów ──────────────────────────────────────────────────────────────────────────

/** Pierwszy tag każdego tekstu musi być jednym z tych „tagów formy”. */
export const CATEGORY_TAGS = [
  "Studium przypadku", "Metoda/narzędzie", "Badanie/benchmark", "Wydarzenie branżowe", "Regulacje/polityka", "Opinia/analiza", "Poradnik", "Ogłoszenie",
  "Inne",
] as const;

/** Tagi tematyczne do wyboru. */
export const TOPIC_TAGS = [
  "Lean", "TPS", "Kaizen", "Standaryzacja", "Rozwiązywanie problemów", "Hoshin Kanri", "Six Sigma", "Jakość", "TPM", "Kanban", "Scrum",
  "Agile na skalę", "Metryki przepływu", "OKR", "Koszty pośrednie", "Koszty pracy", "Zakupy", "Transport", "Magazyn", "Energia",
  "Automatyzacja", "AI w operacjach", "Motoryzacja", "Przywództwo", "Zarządzanie zmianą",
] as const;

/** Tagi firm i instytucji do wyboru. */
export const ENTITY_TAGS = ["Toyota", "Lean Enterprise Institute", "Shingo Institute", "Kanban University", "Scrum.org", "McKinsey", "BCG", "APQC", "Valeo", "Bosch"] as const;

/** Synonimy, które model często pisze, sprowadzone do zapisu ze słownika. */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  "case study": "Studium przypadku", "studium": "Studium przypadku", wdrożenie: "Studium przypadku", "przykład wdrożenia": "Studium przypadku",
  metoda: "Metoda/narzędzie", narzędzie: "Metoda/narzędzie", narzędzia: "Metoda/narzędzie", szablon: "Metoda/narzędzie", method: "Metoda/narzędzie", tool: "Metoda/narzędzie",
  badanie: "Badanie/benchmark", raport: "Badanie/benchmark", benchmark: "Badanie/benchmark", ankieta: "Badanie/benchmark", research: "Badanie/benchmark",
  "wydarzenie": "Wydarzenie branżowe", biznes: "Wydarzenie branżowe", inwestycja: "Wydarzenie branżowe", przejęcie: "Wydarzenie branżowe", news: "Wydarzenie branżowe",
  regulacje: "Regulacje/polityka", polityka: "Regulacje/polityka", prawo: "Regulacje/polityka", cła: "Regulacje/polityka",
  opinia: "Opinia/analiza", analiza: "Opinia/analiza", komentarz: "Opinia/analiza", wywiad: "Opinia/analiza", opinion: "Opinia/analiza",
  poradnik: "Poradnik", tutorial: "Poradnik", wyjaśnienie: "Poradnik", "jak": "Poradnik", "how-to": "Poradnik",
  ogłoszenie: "Ogłoszenie", konferencja: "Ogłoszenie", certyfikacja: "Ogłoszenie", książka: "Ogłoszenie", szkolenie: "Ogłoszenie",
  "toyota production system": "TPS", "system produkcyjny toyoty": "TPS", "ciągłe doskonalenie": "Kaizen", "continuous improvement": "Kaizen",
  "standard work": "Standaryzacja", "praca standaryzowana": "Standaryzacja", a3: "Rozwiązywanie problemów", "toyota kata": "Rozwiązywanie problemów",
  "rozwiązywanie problemów": "Rozwiązywanie problemów", hoshin: "Hoshin Kanri", "strategy deployment": "Hoshin Kanri",
  "lean six sigma": "Six Sigma", dmaic: "Six Sigma", quality: "Jakość", "zarządzanie jakością": "Jakość", "utrzymanie ruchu": "TPM", maintenance: "TPM",
  "flow": "Metryki przepływu", "flow metrics": "Metryki przepływu", przepływ: "Metryki przepływu", safe: "Agile na skalę", "flight levels": "Agile na skalę",
  overhead: "Koszty pośrednie", "sg&a": "Koszty pośrednie", "koszty ogólne": "Koszty pośrednie", procurement: "Zakupy", zaopatrzenie: "Zakupy",
  fracht: "Transport", logistyka: "Transport", freight: "Transport", magazyn: "Magazyn", warehouse: "Magazyn", ai: "AI w operacjach", automotive: "Motoryzacja",
  leadership: "Przywództwo", przywództwo: "Przywództwo", "change management": "Zarządzanie zmianą", "lei": "Lean Enterprise Institute",
};

// ── Firmy i instytucje ──────────────────────────────────────────────────────────────────────

/**
 * Tematy firm: id → nazwa, tag na karcie (null: tylko grupowanie po entity:<id>), aliasy.
 * aliases czyta model strukturyzujący; otherNames to inne nazwy samej firmy (konta, marki),
 * uwzględniane też przy dopasowaniu wydawcy do firmy.
 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; otherNames?: string[] }> = {
  toyota: { name: "Toyota", displayTag: "Toyota", aliases: ["Toyota", "Toyota Motor", "TPS"], otherNames: ["Toyota Motor Corporation", "Toyota Times", "Toyota Motor Manufacturing"] },
  lei: { name: "Lean Enterprise Institute", displayTag: "Lean Enterprise Institute", aliases: ["Lean Enterprise Institute", "LEI"], otherNames: ["Lean Global Network", "Planet Lean", "Institut Lean France", "Instituto Lean Management", "LEI Polska"] },
  shingo: { name: "Shingo Institute", displayTag: "Shingo Institute", aliases: ["Shingo Institute", "Shingo Prize", "Nagroda Shingo"] },
  "kanban-university": { name: "Kanban University", displayTag: "Kanban University", aliases: ["Kanban University", "David J. Anderson School of Management"] },
  "scrum-org": { name: "Scrum.org", displayTag: "Scrum.org", aliases: ["Scrum.org", "Scrum Alliance"] },
  mckinsey: { name: "McKinsey", displayTag: "McKinsey", aliases: ["McKinsey", "McKinsey & Company"] },
  bcg: { name: "BCG", displayTag: "BCG", aliases: ["BCG", "Boston Consulting Group"] },
  apqc: { name: "APQC", displayTag: "APQC", aliases: ["APQC", "American Productivity & Quality Center"] },
  valeo: { name: "Valeo", displayTag: "Valeo", aliases: ["Valeo"] },
  bosch: { name: "Bosch", displayTag: "Bosch", aliases: ["Bosch", "Robert Bosch"] },
  stellantis: { name: "Stellantis", displayTag: null, aliases: ["Stellantis", "Fiat", "Peugeot", "Opel"] },
  volkswagen: { name: "Volkswagen", displayTag: null, aliases: ["Volkswagen", "VW", "Grupa Volkswagen"] },
};

/**
 * Słownik tożsamości: firma pojawiająca się w tytule lub streszczeniu musi występować też w oryginale,
 * inaczej tytuł wraca do oryginału, a streszczenie wypada (ochrona przed pomyleniem firm).
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "toyota", name: "Toyota", patterns: [/\btoyot/i] },
  { id: "lei", name: "Lean Enterprise Institute", patterns: [/lean enterprise institute|\bLEI\b|planet lean|institut lean|instituto lean/i] },
  { id: "shingo", name: "Shingo Institute", patterns: [/\bshingo\b/i] },
  { id: "kanban-university", name: "Kanban University", patterns: [/kanban university/i] },
  { id: "scrum-org", name: "Scrum.org", patterns: [/scrum\.org|scrum alliance/i] },
  { id: "mckinsey", name: "McKinsey", patterns: [/mckinsey/i] },
  { id: "bcg", name: "BCG", patterns: [/\bBCG\b|boston consulting/i] },
  { id: "kearney", name: "Kearney", patterns: [/\bkearney\b/i] },
  { id: "bain", name: "Bain", patterns: [/\bbain\b/i] },
  { id: "hackett", name: "The Hackett Group", patterns: [/hackett/i] },
  { id: "apqc", name: "APQC", patterns: [/\bAPQC\b/i] },
  { id: "gartner", name: "Gartner", patterns: [/gartner/i] },
  { id: "valeo", name: "Valeo", patterns: [/\bvaleo\b/i] },
  { id: "bosch", name: "Bosch", patterns: [/\bbosch/i] },
  { id: "forvia", name: "Forvia", patterns: [/forvia|faurecia/i] },
  { id: "continental", name: "Continental", patterns: [/\bcontinental\s?(ag|automotive)?\b/i] },
  { id: "zf", name: "ZF", patterns: [/\bZF\b/] },
  { id: "stellantis", name: "Stellantis", patterns: [/stellantis/i] },
  { id: "volkswagen", name: "Volkswagen", patterns: [/volkswagen|\bVW\b/i] },
  { id: "renault", name: "Renault", patterns: [/\brenault\b/i] },
  { id: "bmw", name: "BMW", patterns: [/\bBMW\b/] },
  { id: "mercedes", name: "Mercedes-Benz", patterns: [/mercedes/i] },
  { id: "tesla", name: "Tesla", patterns: [/\btesla\b/i] },
  { id: "byd", name: "BYD", patterns: [/\bBYD\b/] },
  { id: "maersk", name: "Maersk", patterns: [/maersk/i] },
  { id: "amazon", name: "Amazon", patterns: [/amazon/i] },
];

/** Artykuły z tych domen publikuje odpowiednia instytucja lub firma (platformy hostingowe się nie liczą). */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "toyota", domains: ["global.toyota", "toyota-global.com", "toyotatimes.jp"] },
  { entityId: "lei", domains: ["lean.org", "planet-lean.com", "institut-lean-france.fr", "institutolean.org", "lean.org.pl"] },
  { entityId: "shingo", domains: ["shingo.org"] },
  { entityId: "kanban-university", domains: ["kanban.university", "djaa.com"] },
  { entityId: "scrum-org", domains: ["scrum.org"] },
  { entityId: "mckinsey", domains: ["mckinsey.com"] },
  { entityId: "bcg", domains: ["bcg.com"] },
  { entityId: "apqc", domains: ["apqc.org"] },
  { entityId: "valeo", domains: ["valeo.com"] },
  { entityId: "bosch", domains: ["bosch.com"] },
];

/** Te zapisy w oryginale też liczą się jako wzmianka o danej firmie. */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "toyota", pattern: /\bTPS\b|toyota production system/i },
];
