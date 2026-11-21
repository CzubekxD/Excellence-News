# Nowe źródła RSS: koszty, regulacje, energia, statystyka i jakość

## Czy udało się zweryfikować kanały RSS kandydatów?

### Takeaway
Nie. Weryfikacja była niemożliwa: sandbox blokuje ruch wychodzący do domen kandydatów, więc ŻADEN kanał nie jest zweryfikowany (status HTTP, treść, daty wpisów). Poniżej brak jakiejkolwiek listy "zweryfikowanych" źródeł, zgodnie z zasadą "tylko faktycznie zweryfikowane kanały".

### Cited Findings
- `curl` do ok. 38 adresów kandydatów (HBR, MIT SMR, Strategy+Business, Quality Digest, Minitab, ASQ, ISO, Eurostat, EEA, IEA, NBP, GUS, PIE, gov.pl/MRiT, PARP, Gartner, Controlling, BCG, Bain, PwC, Eurofound, ENISA, Eurelectric, Euractiv, PKN, CFO.com, OECD, BIS) zakończył się kodem 000; przykładowa diagnostyka: "CONNECT tunnel failed, response 403" dla https://qualitydigest.com/rss.xml (proxy egress odmawia hostowi spoza listy dozwolonych). Zgodnie z /root/.ccr/README.md nie obchodzono blokady.
- WebFetch: `getaddrinfo ENOTFOUND` dla www.qualitydigest.com, sloanreview.mit.edu, www.eea.europa.eu, www.iea.org. Komunikat narzędzia: host jest poza dozwolonymi domenami sesji lub nie istnieje.
- Istniejące źródła w serwisie (z `industry/sources.json`, do wykluczenia): Lean Enterprise Institute, Institut Lean France, Lean Blog, Gemba Academy, KaiNexus, The Lean Thinker, All About Lean, OpEx Mixtape, Progressa Lean, Katie Anderson, Pascal Dennis, APQC, Scrum.org, Mountain Goat, Brodziński, AvailAgility, Nave, Agile Spain, OCTO, Significance, Statistics By Jim, Data Colada, Harrell, Janina Daily, McKinsey Insights, CFO Dive, Supply Chain Management Review, Supply Chain Dive, The Loadstar, DC Velocity, logistyka.net.pl, wnp.pl (Logistyka, Przemysł), Manufacturing Dive, Inżynieria i Utrzymanie Ruchu, Manager+, Journal de l'Automobile. Nie powinny być ponownie proponowane (np. wnp.pl i Manufacturing Dive już są).

### Inferences
- Poniższa lista to wyłącznie kandydaci do późniejszej weryfikacji, oparci na wiedzy ogólnej (NIEPOTWIERDZONE w tej sesji; adresy feedów mogły się zmienić do listopada 2026). Nie wpisywać do `sources.json` bez sprawdzenia, że feed zwraca 200, jest XML-em i ma wpisy z ostatnich 3 miesięcy:
  - HBR (hbr.org, feed tematyczny Operations): T2, EN, paywall, ucięte streszczenia.
  - MIT Sloan Management Review (sloanreview.mit.edu/feed/): T1_5/T2, EN, część treści za paywallem.
  - Quality Digest (qualitydigest.com, RSS): T1_5, EN, jakość/SPC/metrologia; ryzyko treści sponsorowanych.
  - Minitab Blog (blog.minitab.com): T1_5, EN, Six Sigma/SPC; marketing produktu.
  - ASQ / Quality Progress: T1, EN; część za logowaniem.
  - ISO news (iso.org): T1, EN/FR, normy; sprawdzić, czy publiczny RSS nadal istnieje.
  - Eurostat, EEA, IEA, NBP, GUS, PIE, MRiT (gov.pl), PARP, Komisja Europejska (DG GROW/TAXUD/CBAM, CSRD), ENISA (NIS2): T1; częsty problem to brak lub zmiana URL RSS na stronach urzędowych (zwłaszcza GUS i gov.pl), więc wymagają ręcznego sprawdzenia `link rel=alternate`.
  - Pulse by Gartner, Deloitte/PwC/BCG/Bain/EY insights: T2, EN, mocny komponent marketingowy; niska priorytetowość.
- Aby dokończyć zadanie, trzeba dopuścić te domeny w ustawieniach sieci sesji (environment.network) i powtórzyć weryfikację, albo przeprowadzić ją poza sandboxem.

### Gaps
- Brak jakiegokolwiek zweryfikowanego kanału (adres RSS, język, częstotliwość, data ostatniego wpisu) dla wszystkich kandydatów: brak dostępu sieciowego.
- Nie ustalono, które instytucje (Eurostat, KE, GUS, NBP, PIE, MRiT, ARP, PARP, EEA, IEA) faktycznie publikują działający RSS istotny dla przemysłu i kosztów.
- Nie oceniono jakości ani paywalli HBR, MIT SMR, S+B, Gartnera ani firm doradczych.
- Nie sprawdzono ASQ, Quality Digest, Minitab, ISO, PKN/PTU.
- Nie wyszukano źródeł polskich o controllingu/kosztach/procurement ani niemieckojęzycznych (np. controlling), ani francuskich.
