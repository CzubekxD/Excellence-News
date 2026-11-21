# Nowe źródła RSS: łańcuch dostaw, logistyka, transport, zakupy, cła i handel

## Status badania: weryfikacja feedów niemożliwa w tej sesji

### Takeaway
Nie zweryfikowano żadnego kanału RSS. Sieć sesji blokuje wszystkie hosty kandydatów (curl: 403 z proxy / 000; WebFetch: ENOTFOUND dla eurologistics.pl, trans.info, freightwaves.com, rss.feedspot.com). Lista 10-15 zweryfikowanych źródeł nie powstała. Zgodnie z wymogiem "tylko faktycznie zweryfikowane" nie podaję żadnych URL-i feedów jako działających.

### Cited Findings
- Próba pobrania ok. 55 adresów feedów kandydatów (curl przez proxy sesji) zakończyła się błędem tunelu "CONNECT tunnel failed, response 403"; ten sam błąd dał kontrolny feed już obecnego źródła (theloadstar.com/feed/), więc problem leży w polityce sieci, nie w kandydatach.
- WebFetch zwrócił ENOTFOUND z informacją, że host jest poza dozwolonymi domenami sesji (eurologistics.pl, trans.info, freightwaves.com, rss.feedspot.com).
- WebSearch działa, ale zwraca tylko wyniki wyszukiwania; nie potwierdza adresów ani świeżości wpisów. Zapytanie o feed eurologistics.pl nie dało żadnego dowodu. — [wynik wyszukiwania](https://rss.feedspot.com/europe_logistics_rss_feeds/) (katalog Feedspot istnieje, ale nie udało się go otworzyć)
- Już w serwisie (z `industry/sources.json`, nie proponować ponownie): scmr.com, supplychaindive.com, theloadstar.com, dcvelocity.com, logistyka.net.pl, wnp.pl (logistyka i przemysł), manufacturingdive.com, apqc.org, mckinsey.com/insights/rss, cfodive.com.

### Inferences
- Poniższe to tylko NIEZWERYFIKOWANE kandydaci do sprawdzenia, gdy sieć zostanie odblokowana (adresy to typowe ścieżki, zgadnięte, bez potwierdzenia):
  - PL: eurologistics.pl (/feed), trans.info (/pl/feed), rynek-kolejowy.pl, tsl-biznes.pl, supplychainmagazyn.pl, gospodarkamorska.pl, portalmorski.pl, spedycje.pl, log24.pl, ILiM.
  - EN/DE: logistics-manager.com, freightwaves.com/feed, supplychainbrain.com, procurementmagazine.com, container-news.com, splash247.com, gcaptain.com, railfreight.com, logistik-heute.de, dvz.de.
  - Instytucje/dane: NY Fed GSCPI (newyorkfed.org, strona danych z kwartalną/miesięczną publikacją), WTO news, UNCTAD, Eurostat, Drewry, Xeneta, Sea-Intelligence.
- Wstępna propozycja poziomów (do potwierdzenia): NY Fed/WTO/UNCTAD/Eurostat = T1; Drewry/Xeneta/Sea-Intelligence = T1_5; media branżowe = T2. Są to sądy z wiedzy ogólnej, nie z weryfikacji.

### Gaps
- Brak weryfikacji któregokolwiek feedu: URL, format RSS/Atom, daty wpisów z ostatnich 3 miesięcy, częstotliwość, paywall, szum/PR.
- Aby dokończyć: dodać do dozwolonych domen sesji hosty z listy powyżej (przez ustawienia sieci środowiska) albo wykonać `curl -sIL` na tych adresach z maszyny z dostępem do sieci i wkleić wyniki.
