# Nowe źródła RSS: przemysł, produkcja, UR, automatyka, motoryzacja, EV

## Czy udało się zweryfikować kanały? (status badania)

### Takeaway
NIE zweryfikowano żadnego kanału. Sesja ma blokadę sieci: WebFetch zwraca ENOTFOUND dla każdego sprawdzonego hosta (electrive.com, automationworld.com, industryweek.com, plantengineering.com, automotivelogistics.media, just-auto.com, acea.auto, automotivenews.com), a curl przez proxy zwraca 403 "no rule or network setting allows this host" (pzpm.org.pl). Wymagane: dopuszczenie tych domen w ustawieniach sieci sesji, potem ponowienie. Zgodnie z zasadą "tylko faktycznie zweryfikowane" nie podaję żadnej listy 10-15 źródeł.

### Cited Findings
- Istniejące źródła w serwisie (`industry/sources.json`), których nie wolno proponować: journalauto.com, manufacturingdive.com, wnp.pl (przemysl_rss, logistyka_rss), utrzymanieruchu.pl, logistyka.net.pl, dcvelocity.com, scmr.com, supplychaindive.com, lean.org, allaboutlean.com i inne blogi lean/agile — plik repozytorium `industry/sources.json`.
- Wyszukiwarka (jedyne działające narzędzie) wskazuje, że FeedSpot podaje kanał electrive pod https://www.electrive.com/feed ; stopka electrive.com ma link RSS. Nie otwarto kanału, więc to wskazówka, nie weryfikacja — [FeedSpot EV RSS](https://rss.feedspot.com/electric_vehicle_rss_feeds/), [electrive.com](https://www.electrive.com/author/chris/?bf=1747737226)

### Inferences
- Niezweryfikowane kandydaci do sprawdzenia po odblokowaniu sieci (adresy to typowe wzorce, NIE potwierdzone): electrive (/feed/), Automation World (/rss), IndustryWeek (/rss.xml), Plant Engineering (/feed/), Automotive Logistics (/feed), Just Auto (/feed/), ACEA (/feed/), Automotive News Europe, VDA, PZPM, Samar, PIE (pie.net.pl), PIMOT, Control Engineering Polska, Nowy Przemysł, Rynek Maszyn, Elektro.info, Toyota Global Newsroom, Eurofound, Eurostat.
- Z natury bezpośrednio o lean/jakość/OEE/TPM/UR są raczej: Plant Engineering, IndustryWeek, Assembly Magazine, Manufacturing.net, Rynek Maszyn/Nowy Przemysł (do potwierdzenia); media konsumenckie (Auto Świat, AMS) prawdopodobnie szum.

### Gaps
- Brak jakiegokolwiek zweryfikowanego kanału RSS/Atom, daty ostatnich wpisów, częstotliwości i jakości treści dla wszystkich kandydatów z zadania: blokada sieci sesji.
- Potrzebne: allowlista domen kandydatów (lub ponowne uruchomienie badania w sesji z dostępem), po czym kolejne sprawdzenie `curl -sL <feed>` pod kątem XML i dat z ostatnich 3 miesięcy.
