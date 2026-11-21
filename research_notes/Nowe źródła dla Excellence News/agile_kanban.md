# Nowe źródła RSS: Agile, Kanban, Scrum, metryki przepływu, portfel/produkt, Hoshin, OKR

## Czy da się dostarczyć 8-12 zweryfikowanych kanałów?

### Takeaway
Nie: weryfikacja była niemożliwa. Środowisko badawcze blokuje ruch wychodzący (proxy zwraca 403 "no rule or network setting allows this host", WebFetch zwraca ENOTFOUND dla kanban.university, agilealliance.org, martinfowler.com, infoq.com). Zgodnie z zasadą "tylko kanały faktycznie zweryfikowane" nie podaję żadnej listy kanałów jako zweryfikowanej.

### Cited Findings
- Istniejące źródła w `industry/sources.json` (74 trafienia pól, 36 źródeł): m.in. Scrum.org, Mike Cohn, Brodziński, AvailAgility, Nave, Agile Spain, OCTO, Manager+. Brak jeszcze Kanban University, Agile Alliance, Scrum Alliance, SAFe, Atlassian, ActionableAgile, InfoQ, Martin Fowler, DORA — [sources.json](/home/user/Excellence-News/industry/sources.json)
- Katalog FeedSpot wskazuje feed Kanban University pod `kanban.university/feed` oraz blog pod `kanban.university/blog`; to wskazanie agregatora, nie potwierdzenie z samej strony — [FeedSpot Kanban](https://rss.feedspot.com/kanban_rss_feeds/)
- Wyniki wyszukiwania pokazują, że blog kanban.university ma świeże wpisy (m.in. o partnerstwie Kanban University i Scrum Alliance, SBK dual credential), bez daty — [kanban.university/blog](https://kanban.university/blog/)

### Inferences
- Kanban University (T1, EN) to najsilniejszy kandydat; do potwierdzenia: czy `https://kanban.university/feed/` zwraca RSS ze wpisami z ostatnich 3 miesięcy.

### Gaps
- Nie sprawdzono żadnego kanału (HTTP, format, daty wpisów). Kandydaci do sprawdzenia po odblokowaniu hostów (wszystkie NIEZWERYFIKOWANE, adresy to domysły wzorców, nie fakty): kanban.university/feed/, kanbanguide.org, prokanban.org, agilealliance.org/feed/, resources.scrumalliance.org, scaledagileframework.com/blog/feed/, atlassian.com/blog/agile, actionableagile.com, nkdagility.com, martinfowler.com/feed.atom, dora.dev, infoq.com/agile/rss.
- Polskie źródła Agile/Kanban oraz źródła Lean+Agile/Flow/DevOps: nie badano, brak dostępu do sieci.
- Hoshin i OKR: nie badano.
- Aby kontynuować: dodać hosty do dozwolonych w ustawieniach sieci sesji (environment.network) i ponowić zadanie.
