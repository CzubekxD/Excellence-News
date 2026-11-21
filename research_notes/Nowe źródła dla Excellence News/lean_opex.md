# Nowe źródła RSS: Lean / TPS / OpEx / CI / Six Sigma

## Status badania: weryfikacja kanałów NIE powiodła się (blokada sieci)

### Takeaway
Nie zweryfikowałem żadnego kanału RSS. Sesja ma zablokowany ruch wychodzący do domen kandydatów (curl: proxy zwraca HTTP 403; WebFetch: `getaddrinfo ENOTFOUND`; WebSearch zwraca tylko tytuły stron, bez treści feedów). Zgodnie z ograniczeniem "tylko faktycznie zweryfikowane kanały" lista zweryfikowanych źródeł jest pusta. Poniżej tylko tropy do weryfikacji po odblokowaniu domen.

### Cited Findings
- Próba pobrania `https://planet-lean.com/feed/` przez curl: proxy odrzuciło połączenie (403, "host not allowed"); WebFetch dla planet-lean.com, shingoinstitute.org, kaizen.com i lean.org.pl: ENOTFOUND (domeny poza listą dozwolonych w sesji). Dotyczy też, bez dalszych prób, pozostałych testowanych hostów (ame.org, asq.org, leanglobalnetwork.org, leanconstruction.org, lean.org.uk, isixsigma.com i inne) — curl zwrócił kod 000 dla wszystkich.
- Planet Lean to oficjalny magazyn online Lean Global Network (od lutego 2014); redaktor Roberto Priolo; wyszukiwanie nie wskazało adresu feedu, więc jego istnienia nie potwierdzono — [Planet Lean: misja](https://planet-lean.com/our-mission), [wyniki wyszukiwania](https://planet-lean.com/tags/lean-global-network)
- Katalog Feedspot "30 Best Lean Manufacturing Blogs to Follow in 2026" istnieje i może posłużyć jako lista tropów (nie przeglądany, tylko zwrócony w wynikach) — [Feedspot](https://bloggers.feedspot.com/lean_manufacturing_blogs/)

### Inferences
- Poniższe kandydaci pochodzą z mojej wiedzy ogólnej, NIE z weryfikacji; adresy feedów są tylko do sprawdzenia (nie do wpisania do `sources.json` bez testu):
  - Planet Lean (Lean Global Network), EN, T1: spróbować `https://planet-lean.com/feed/` oraz `/rss`; ryzyko: serwis zmienił platformę, feed może nie istnieć.
  - Shingo Institute (Utah State Univ.), EN, T1: `https://www.shingoinstitute.org/feed/`; ryzyko: dużo treści o konferencjach i szkoleniach.
  - Kaizen Institute (blog), EN, T1: `https://www.kaizen.com/feed`; ryzyko: marketing konsultingowy.
  - Lean Institute Polska / Lean Poland (lean.org.pl), PL, T1: `https://www.lean.org.pl/feed` — kluczowe dla polskiego serwisu, ale nie mam potwierdzenia, że feed działa i jest świeży.
  - Association for Manufacturing Excellence (AME), EN, T1: `https://www.ame.org/rss.xml`; ryzyko: część treści tylko dla członków.
  - ASQ (asq.org), EN, T1/T2: sprawdzić `https://asq.org/rss`; ryzyko: paywall, treści członkowskie.
  - iSixSigma, EN, T2: `https://www.isixsigma.com/feed/`; ryzyko: SEO/marketing.
  - Lean Construction Institute, EN, T1: `https://www.leanconstruction.org/feed/`; ryzyko: wąska branża budowlana.
  - Lean Enterprise Institute UK (lean.org.uk), EN, T1: `https://www.lean.org.uk/feed`; wymaga potwierdzenia, że istnieje.
  - Toyota Motor Europe / Toyota Global newsroom: nie mam adresu feedu nawet jako tropu.
  - Praktycy (Hoshin Kanri, A3, Six Sigma): nie udało się sprawdzić nikogo; nie wymieniam nazwisk bez weryfikacji.
- Polskie źródła o Lean/OpEx (stowarzyszenia, konsultanci, media) — poza lean.org.pl nie mam żadnego zweryfikowanego tropu.

### Gaps
- Żaden feed nie został sprawdzony pod kątem działania ani świeżości (ostatnie 3 miesiące); brak danych o częstotliwości publikacji.
- Brak ocen jakościowych i zastrzeżeń opartych na faktach.
- Aby dokończyć zadanie: dodać do dozwolonych domen sesji planet-lean.com, shingoinstitute.org, kaizen.com, lean.org.pl, ame.org, asq.org, isixsigma.com, leanconstruction.org, lean.org.uk, feedspot.com (oraz ewentualne polskie), po czym powtórzyć weryfikację (`curl -L` na feed, sprawdzenie daty najnowszego wpisu).
