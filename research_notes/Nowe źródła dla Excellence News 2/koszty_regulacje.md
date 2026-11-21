# Nowe źródła: koszty operacyjne, controlling, procurement, regulacje (CBAM, CSRD, NIS2), energia i surowce, jakość/SPC/metrologia

Metoda: wyłącznie WebSearch (pobieranie stron zablokowane), stan na 2026-11-21. Oceniam istnienie źródła, świeżość (2026) i wzmianki o RSS na podstawie wyników wyszukiwania, nie samych stron. Adresów feedów nie zgaduję: "feed do sprawdzenia" = brak potwierdzenia w wynikach. Nie sprawdzałem `industry/sources.json` repozytorium; poza wykluczoną listą od zlecającego (McKinsey, CFO Dive, Manager+, APQC, Significance, Statistics By Jim, Data Colada, Frank Harrell, Janina Daily) wszystko wymaga deduplikacji z istniejącą listą.

## Instytucje i dane: które mają treści istotne dla przemysłu i kosztów?

### Takeaway
Najmocniejsi kandydaci T1 z potwierdzoną świeżością 2026: Eurostat (ceny producentów, energia), IEA (ceny energii elektrycznej), KE (CBAM, DG GROW, finanse zrównoważone), Ministerstwo Cyfryzacji (NIS2/KSC), PIE (tygodnik, PL), GUS (koniunktura). Feedy RSS są potwierdzone tylko częściowo: Eurostat (inny typ treści) i prawdopodobnie GUS (strona RSS istnieje).

### Cited Findings
**Kandydat 1. Eurostat – euro indicators / news (EN, T1; kilka razy w miesiącu; pewność: potwierdzone wyszukiwaniem)**
- Strona: https://ec.europa.eu/eurostat/web/main/news (lista "Latest news articles"); komunikaty euro-indicators, np. ceny producentów przemysłowych — [Eurostat PPI luty 2026](https://ec.europa.eu/eurostat/web/products-euro-indicators/w/4-08042026-ap). Wrzesień 2026: ceny producentów w strefie euro +2,5% m/m, wg wtórnego źródła — [Cyprus Mail, 6.11.2026](https://cyprus-mail.com/2026/11/06/cyprus-industrial-prices-accelerate-as-eu-energy-costs-surge).
- Feed: Eurostat ma stronę o RSS — [About RSS](https://ec.europa.eu/eurostat/web/rss/about-rss) i alerty — [alert](https://ec.europa.eu/eurostat/alert). Potwierdzony feed aktualizacji zbiorów danych (nie newsów): https://ec.europa.eu/eurostat/api/dissemination/catalogue/rss/en/statistics-update.rss — [Eurostat API RSS](https://ec.europa.eu/eurostat/de/web/user-guides/data-browser/api-data-access/api-detailed-guidelines/catalogue-api/rss). Feed newsów rss_estat_news.xml pojawia się tylko w agregatorze, który pisze, że był martwy od prawie 6 lat — [Feeder](https://feeder.co/discover/57d4e4e8fe/ec-europa-eu-eurostat); NIE używać bez weryfikacji.
- Zastrzeżenia: komunikaty to surowe dane, trzeba streszczać; feed newsów do sprawdzenia.

**Kandydat 2. KE – CBAM (DG TAXUD) (EN, także PL; nieregularnie; T1; pewność: potwierdzone wyszukiwaniem)**
- Strona: https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en (dostępna też w wersji PL przez `?prefLang=pl`). Okres ostateczny CBAM od 1.01.2026; pakiet aktów wykonawczych z 17.12.2025; próg 50 t — [DG TRADE Access2Markets PL](https://trade.ec.europa.eu/access-to-markets/pl/news/poczatek-ostatecznego-okresu-obowiazywania-cbam-w-ue); [EY](https://globaltaxnews.ey.com/news/2025-2607). Termin deklaracji 30 września następnego roku wg kancelarii HSF Kramer (opinia, nie stanowisko UE) — [HSF Kramer](https://www.hsfkramer.com/notes/energy/2026-posts/operationalisation-and-simplification-of-the-eu-cbam).
- Feed: do sprawdzenia. Poziom: T1.
- Zastrzeżenia: to strona tematyczna, nie strumień newsów; wpisy rzadkie, ale wysokiej wagi.

**Kandydat 3. KE – DG GROW (Internal Market, Industry, Entrepreneurship and SMEs) (EN/DE/FR/PL; kilka razy w miesiącu; T1; pewność: potwierdzone wyszukiwaniem, że departament i newsy istnieją)**
- Strona: https://commission.europa.eu/about/departments-and-executive-agencies/internal-market-industry-entrepreneurship-and-smes_en. Treści 2026: raport roczny o jednolitym rynku i konkurencyjności (30.01.2026), konsultacja nad rewizją dyrektywy o e-fakturowaniu (marzec 2026), plan przeglądu rozporządzenia o normalizacji — [Commission annual report 2026](https://intellectual-property-helpdesk.ec.europa.eu/news-events/news/commission-publishes-2026-annual-report-single-market-and-competitiveness-2026-02-10_en); [Single Market Strategy](https://single-market-economy.ec.europa.eu/single-market/strategy_en?prefLang=hu).
- Feed: do sprawdzenia. Poziom: T1.
- Zastrzeżenia: duża część treści to PR instytucjonalny i MŚP/produkty konsumenckie (np. kampania o wypełniaczach dermalnych), potrzebny filtr.

**Kandydat 4. KE – finance.ec.europa.eu (CSRD/ESRS/taksonomia) (EN; nieregularnie; T1; pewność: potwierdzone wyszukiwaniem)**
- Strona: https://finance.ec.europa.eu/ (wpis newsowy z 3.07.2026 o przyjęciu zmienionych standardów raportowania — [finance.ec.europa.eu](https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-reduce-administrative-burdens-eu-2026-07-03_en?prefLang=pl); data 3.07 wynika tylko z adresu URL, nie z treści). Dyrektywa Omnibus (UE) 2026/470 opublikowana 26.02.2026, wg EY w mocy od 18.03.2026; zmienione ESRS od roku obrotowego 2027 — [Crowe PL](https://www.crowe.com/pl/insights/pakiet-omnibus-i-zatwierdzony---uproszczenia-w-raportowaniu-esg-dla-firm); [MoFo](https://www.mofo.com/resources/insights/260513-european-commission-proposes-revised-esrs); [WTW](https://www.wtwco.com/en-be/insights/2026/01/what-does-the-omnibus-mean-for-corporate-sustainability-reporting-directive-csrd). Źródła różnią się co do liczby firm w zakresie CSRD.
- Feed: do sprawdzenia. Poziom: T1.
- Zastrzeżenia: ESG/raportowanie, tylko pośrednio "przemysł"; ryzyko nakładania się z innymi tematami serwisu.

**Kandydat 5. Ministerstwo Cyfryzacji (gov.pl/web/cyfryzacja) – KSC/NIS2 (PL; nieregularnie; T1; pewność: potwierdzone wyszukiwaniem)**
- Strona: https://www.gov.pl/web/cyfryzacja. Nowelizacja KSC wdrażająca NIS2: Sejm 23.01.2026, podpis prezydenta 19.02.2026, Dz.U. 2.03.2026, wejście w życie 3.04.2026 wg MC i KPMG (PIT podaje 2.04) — [gov.pl: zaczyna obowiązywać](https://www.gov.pl/web/cyfryzacja/nowelizacja-ustawy-o-krajowym-systemie-cyberbezpieczenstwa-zaczyna-obowiazywac); [KPMG](https://kpmg.com/pl/pl/wiedza/prawo/alert-prawny-dyrektywa-nis2-wdrozona-w-polsce-nowe-obowiazki-cyberbezpieczenstwa-dla-przedsiebiorcow.html). Rejestracja podmiotów do 3.10.2026, dostosowanie do 3.04.2027 (wg wyszukiwania; sprawdzić w tekście ustawy). Część przepisów o dostawcach wysokiego ryzyka skierowano do TK — [prawo.pl](https://www.prawo.pl/samorzad/prezydent-podpisal-ustawe-o-krajowym-systemie-cyberbezpieczenstwa-i-skierowal-wniosek-do-tk,1537069.html).
- Feed: do sprawdzenia (gov.pl zwykle ma kanały, ale tu niepotwierdzone). Poziom: T1.
- Zastrzeżenia: portal obejmuje całą cyfryzację; potrzebny filtr na cyberbezpieczeństwo/NIS2.

**Kandydat 6. Polski Instytut Ekonomiczny – Tygodnik Gospodarczy PIE (PL; tygodnik; T1_5 ekspert/think tank rządowy; pewność: potwierdzone wyszukiwaniem)**
- Strona: https://pie.net.pl. Wydania PDF 1–33/2026, ostatnie widoczne to nr 33 z 20.08.2026 (handel globalny, eksport), nr 18 (7.05.2026) o cenach energii i inflacji w Europie, nr 10 o wpływie ataku na Iran na produkcję stali — [Tygodnik PIE 33/2026](https://pie.net.pl/wp-content/uploads/2026/08/Tygodnik-PIE_33-2026-A.pdf); [Tygodnik PIE 18/2026](https://pie.net.pl/wp-content/uploads/2026/05/Tygodnik-PIE_18-2026.pdf); [Tygodnik PIE 10/2026](https://pie.net.pl/wp-content/uploads/2026/03/Tygodnik-PIE_10-2026.pdf).
- Feed: do sprawdzenia (są PDF-y, feed niepotwierdzony). Poziom: T1_5.
- Zastrzeżenia: wyszukiwanie nie pokazało wydań po sierpniu 2026 (luka w wynikach, nie dowód zaprzestania); PDF-y wymagają ekstrakcji tekstu.

**Kandydat 7. IEA – news i raporty (EN; kilka razy w miesiącu; T1; pewność: potwierdzone wyszukiwaniem)**
- Strona: https://www.iea.org/news. Electricity Mid-Year Update 2026 (23.07.2026): popyt na energię +3,6% w 2026; spotowe ceny energii w UE i Japonii +30% r/r w II kw. 2026 (wg raportu, związane z LNG) — [IEA](https://www.iea.org/news/global-electricity-demand-growth-set-to-accelerate-as-power-systems-adjust-to-recent-shocks); [IEA raport](https://www.iea.org/reports/electricity-mid-year-update-2026/executive-summary); [Electrek](https://electrek.co/2026/07/22/iea-global-power-demand-is-surging-and-renewables-are-passing-coal/?extended-comments=1).
- Feed: do sprawdzenia. Poziom: T1.
- Zastrzeżenia: perspektywa globalna, nie przemysłowa; Oil Market Report nie został potwierdzony wyszukiwaniem.

**Kandydat 8. GUS – koniunktura gospodarcza (PL; miesięcznie; T1; pewność: potwierdzone wyszukiwaniem, że seria istnieje; październik 2026 tylko z wtórnego xyz.pl)**
- Strona: https://stat.gov.pl (seria: https://stat.gov.pl/obszary-tematyczne/koniunktura/koniunktura/). Wskaźnik koniunktury w przetwórstwie przemysłowym: -6,6 w październiku 2026 wg wtórnego źródła, najbardziej pesymistyczny sektor — [xyz.pl](https://xyz.pl/dzieje-sie/koniunktura-gospodarcza-w-pazdzierniku-2026-r-sa-dane-gus-4157); wartości za marzec/kwiecień 2026 (-5,2 / -4,4) wg KIG — [KIG kwiecień 2026](https://kig.pl/wp-content/uploads/2026/04/Koniunktura_kwiecien-2026.pdf).
- Feed: GUS ma stronę RSS: https://stat.gov.pl/en/rss/ (pojawiła się w wynikach, treść niezweryfikowana) — [stat.gov.pl RSS](https://stat.gov.pl/en/rss/). Konkretny adres feedu: do sprawdzenia. Poziom: T1.
- Zastrzeżenia: dane liczbowe, mało narracji; trzeba filtra, by nie zalać serwisu komunikatami statystycznymi.

**Kandydat 9. PARP (PL; kilka razy w miesiącu; T1; pewność: potwierdzone wyszukiwaniem; priorytet niski)**
- Strona: https://www.parp.gov.pl. Wpisy 2026: nabory STEP dla cleantech do 150 mln zł (16.06–11.08.2026), umowy STEP za 20,8 mln zł (2.10.2026), zapowiedź konkursu 500 mln zł na technologie obronne jesienią 2026 — [PARP, 2.10.2026](https://www.parp.gov.pl/component/content/article/91302:step-wzmacnia-strategiczna-niezaleznosc-europy-ponad-20-8-mln-zl-na-nowe-zdolnosci-polskiego-przemyslu); [PARP cleantech](https://www.parp.gov.pl/component/content/article/90757:parp-uruchamia-nabory-step-dla-sektora-cleantech-nawet-150-mln-zl-wsparcia-na-inwestycje-2).
- Feed: do sprawdzenia. Poziom: T1.
- Zastrzeżenia: dotacje i nabory, słabo związane z kosztami operacyjnymi; ryzyko szumu.

### Inferences
- Do bezpośredniego dodania wydają się Eurostat, KE (CBAM/DG GROW/finance), MC (NIS2), PIE i IEA, bo łączą świeżość 2026 z tematyką serwisu. GUS i PARP są mniej pewne jako wartość newsowa.
- Eurostat i GUS mają mechanizmy RSS, więc integracja może być tania, ale dokładne URL-e trzeba zweryfikować ręcznie.

### Gaps
- Nie potwierdzono żadnego konkretnego adresu feedu dla KE, IEA, MC, PIE, PARP; MRiT (gov.pl/rozwoj-technologia) nie dał osobnej strony newsów w wynikach; EEA i NBP nie zostały zbadane (limit narzędzi).

## Media i eksperci: HBR, MIT SMR, strategy+business, Deloitte/PwC/BCG/Bain, polskie źródła o controllingu, kosztach i zakupach

### Takeaway
Wyszukiwanie potwierdza istnienie 2026 treści Deloitte, MIT SMR, BCG i PwC, ale nie pokazało ani jednego feedu ani świeżych wpisów HBR czy strategy+business. Rekomenduję tylko dwa źródła z tej grupy jako dodatkowe, Supply Chain Dive (procurement) i BME (DE), oba z zastrzeżeniami; polskie źródła o controllingu i zakupach nie zostały znalezione.

### Cited Findings
**Kandydat 10. Supply Chain Dive – temat Procurement (EN; codziennie; T2; pewność: potwierdzone wyszukiwaniem)**
- Strona: https://www.supplychaindive.com/topic/procurement/. Wpisy do listopada 2026: cła na Kanadę (30.10), prognoza Forda ok. 1 mld USD kosztów ceł w 2026, WD-40 o opóźnieniu 90–120 dni kosztów surowców względem marż, GM zabezpiecza dostawy pamięci — treści z wyników, np. [lista procurement](https://www.supplychaindive.com/topic/procurement/?page=1).
- Feed: do sprawdzenia. Poziom: T2.
- Zastrzeżenia: perspektywa USA (cła); to siostrzany tytuł CFO Dive (już w serwisie), więc może się nakładać; duplikuje tematy ceł.

**Kandydat 11. BME (Bundesverband Materialwirtschaft, Einkauf und Logistik) – barometry i magazyn BIP (DE; kwartalnie/nieregularnie; T1_5 stowarzyszenie; pewność: niepotwierdzone co do adresu głównej strony, potwierdzone, że publikacje 2026 istnieją)**
- Treści: BME Frühjahrsbarometer 2026 (nastroje zakupowców: biurokracja, koszty energii, ryzyko geopolityczne) — [BME Frühjahrsbarometer](https://ost-ausschuss.de/sites/default/files/eventdocs/BME%20Fr%C3%BChjahrsbarometer.pdf); magazyn BIP 1/2026 (marzec) i 2/2026 — [BIP 2/26](https://a.storyblok.com/f/104752/x/84bba28e6f/bip-2-26_final_280926.pdf); masterclass o cięciu kosztów zakupów (marzec 2026) — [logistik-heute](https://logistik-heute.de/termine/bme-masterclass-beschaffungsmarkt-indien-duesseldorf-222170.html). URL strony: https://www.bme.de (adres z wiedzy, nie z wyników; do potwierdzenia).
- Feed: do sprawdzenia. Poziom: T1_5.
- Zastrzeżenia: część materiałów to PDF-y i oferta szkoleń (marketing); częstotliwość niska.

**Pozostałe media (nie rekomendowane teraz)**
- Deloitte Insights: Manufacturing Industry Outlook, w tym wydanie 2027 (wzmianka z 18.11.2026) — [Deloitte outlook](https://www.deloitte.com/us/en/insights/industry/manufacturing-industrial-products/manufacturing-industry-outlook); [Design News](https://www.designnews.com/industry/five-trends-shape-us-manufacturing-s-2027-outlook). Feedu nie znaleziono; marketing konsultingowy.
- BCG Operations Insights: strona z pozycjami 2026 — [BCG](https://www.bcg.com/capabilities/operations/insights.aspx). Feed do sprawdzenia; marketing.
- PwC: ankieta 2026 Digital Trends in Operations (767 liderów, 89% mówi, że inwestycje nie dały pełnych efektów; wersja lipcowa podaje 11% pełnej realizacji, rozbieżność niewyjaśniona) — [PwC](https://www.pwc.com/us/en/services/consulting/supply-chain-operations/library/digital-operations-leaders-redefining-operations.html). Nie znaleziono artykułów strategy+business.
- MIT Sloan Management Review: numery Spring/Summer 2026 (m.in. "Resolve the Conflict Between Efficiency and Resilience"), strona https://sloanreview.mit.edu — [MIT SMR shop](https://shop.sloanreview.mit.edu/issues). Paywall częściowy; feed niepotwierdzony.
- HBR: wyszukiwanie nie zwróciło żadnych artykułów HBR z 2026, tylko książkę z serii Insights — [HBR Insights: Supply Chain](https://mitpressbookstore.mit.edu/book/9781647825966). Status niepotwierdzony; paywall.
- Polskie zakupy/controlling: znaleziono tylko szkolenie PARP "Nowoczesny controlling zakupów" (grudzień 2026) i Politykę zakupową państwa 2026–2029 (uchwała nr 101 z 31.03.2026) — [gov.pl: polityka zakupowa](https://www.gov.pl/web/rozwoj-technologia/nowa-polityka-zakupowa-panstwa--publiczne-pieniadze-na-rzecz-rozwoju-gospodarki-msp-i-zwiekszenia-bezpieczenstwa); portalu newsowego o controllingu/zakupach nie potwierdzono.

### Inferences
- Wielcy doradcy (Deloitte, BCG, PwC) i HBR/MIT SMR to w dużej mierze marketing lub paywall; niski stosunek sygnału do szumu względem istniejącego McKinsey Insights, więc odradzam dodawanie bez ręcznej weryfikacji feedu.
- Luka na polskie źródło o controllingu/zakupach pozostaje; trzeba osobnego wyszukiwania lub wskazania przez właściciela.

### Gaps
- Brak potwierdzonych 2026 wpisów HBR i strategy+business, Bain i Handelsblatt/Controlling & Management Review nie dały trafień; nie znaleziono polskich portali o controllingu i zakupach (np. nie zweryfikowano żadnego konkretnego tytułu).

## Jakość, statystyka, SPC, metrologia: ASQ, Quality Digest, Minitab, ISO, PKN

### Takeaway
Najlepiej potwierdzony jest Quality Magazine (publiczny RSS na qualitymag.com, treści SPC/Six Sigma w 2026) oraz komunikaty ISO (ISO 9001:2026 opublikowana 16.09.2026). Quality Digest i ASQ istnieją i mają świeże treści, ale nie znaleziono ich feedów.

### Cited Findings
**Kandydat 12. Quality Magazine (qualitymag.com) (EN; wiele wpisów tygodniowo; T2; pewność: potwierdzone wyszukiwaniem, w tym RSS)**
- Strona: https://www.qualitymag.com. Feedy potwierdzone w wynikach: https://www.qualitymag.com/rss/articles, https://www.qualitymag.com/rss/17, https://www.qualitymag.com/rss/topic/4497-quality-top-stories, https://www.qualitymag.com/rss/topic/4502-news; strona z opisem feedów https://www.qualitymag.com/rss — [Quality Magazine RSS](https://www.qualitymag.com/rss). Treść 2026 (np. tekst z 28.05.2026 o pomiarach jako podstawie Six Sigma) — [Quality Magazine Six Sigma](https://www.qualitymag.com/articles/keyword/5705-six-sigma).
- Poziom: T2.
- Zastrzeżenia: sponsorowane treści dostawców, część materiałów to komunikaty produktowe (należy sprawdzić w próbce); wyniki pokazały zawartość XML, ale nie sprawdziłem daty najnowszego wpisu w każdym feedzie.

**Kandydat 13. ISO – newsroom (EN/FR; kilka razy w miesiącu; T1; pewność: potwierdzone wyszukiwaniem)**
- Strona: https://www.iso.org/news. ISO 9001:2026 opublikowana 16.09.2026, zastępuje wydanie 2015 — [ISO news 2026/09](https://www.iso.org/news/2026/09/ISO9001-2026); [ISO: what businesses need to know](https://www.iso.org/ru/quality-management/iso-9001-2026). Wg TÜV SÜD zmiany głównie strukturalne i redakcyjne, istniejące certyfikaty pozostają ważne; uwzględnia zmiany klimatu — [TÜV SÜD](https://www.tuvsud.com/pl-pl/centrum-informacyjne/blogs/iso-9001-najwazniejsze-informacje-o-najnowszej-wersji-normy). Daty końca okresu przejściowego nie potwierdzono.
- Feed: do sprawdzenia. Poziom: T1.
- Zastrzeżenia: komunikaty rzadkie; część wyników wcześniejszych (DQS, SGS) pisała w czasie przyszłym, opierać się na komunikacie ISO.

**Quality Digest (EN; kilka razy w tygodniu; T1_5/T2; pewność: potwierdzone, że serwis istnieje z stopką 2026; feed niepotwierdzony)**
- Strona: https://www.qualitydigest.com. Wzmianka o nowym podręczniku AIAG-VDA SPC (lipiec 2026) — [Quality Digest SPC](https://www.qualitydigest.com/topic/list/statistics-article?page=2). Wyszukiwanie "RSS feed" zwróciło feedy Quality Magazine, nie Quality Digest — [wynik](https://www.qualitymag.com/rss). Feed: do sprawdzenia. Zastrzeżenia: nie potwierdziłem dat konkretnych artykułów 2026; część to reklamy produktów (np. Verisurf).

**Minitab Blog (EN; kilka razy w miesiącu; T2 marketing dostawcy; pewność: potwierdzone wyszukiwaniem)**
- Strona: https://blog.minitab.com/en/blog/all. Przejęcia Minitab w 2026: Scytec (styczeń), Effex (luty), DataLabs (lipiec wg Wikipedii) — [Minitab](https://en.wikipedia.org/wiki/Minitab); wpisy m.in. o AIAG-VDA SPC — [Minitab Blog](https://blog.minitab.com/en/blog/all). Wersja produktu niejasna (22.5.2 vs 22.6 w różnych wynikach). Feed do sprawdzenia. Zastrzeżenie: marketing dostawcy oprogramowania; niski priorytet.

**ASQ / Quality Progress (EN; miesięcznik; T1_5; pewność: potwierdzone wyszukiwaniem, feed niepotwierdzony)**
- Strony: https://asq.org/newsroom/news-releases, Quality Progress (numer lipcowy 2026 jako vol. 59, nr 7). Komunikaty ASQ 2026: nagrody (17.05), nowi Fellows (1.06), 80-lecie ASQ — [ASQ newsroom](https://asq.org/newsroom/news-releases). Zastrzeżenia: komunikaty o członkach i wydarzeniach, mała wartość newsowa; QP częściowo za paywallem; nie dodawać jako priorytet.

**PKN (PL)**
- Wyszukiwanie nie wykazało informacji o polskim wydaniu PN-EN ISO 9001:2026; pojawił się tylko raport roczny PKN za 2025 — [PKN raport roczny](https://www.pkn.pl/sites/default/files/sites/default/files/imce/files/Raport%20roczny%20promocyjny%202025.pdf). Strona https://www.pkn.pl: pewność niepotwierdzona co do newsów i feedu.

### Inferences
- Dla segmentu jakości najlepszą relację wartości do wysiłku daje Quality Magazine (potwierdzony RSS) plus ISO newsroom; Quality Digest warto dodać po ręcznym znalezieniu feedu.
- Wątek VDA/AIAG SPC (lipiec 2026) jest ciekawy dla motoryzacji, ale opiera się na dwóch wzmiankach (Quality Digest, Minitab); wymaga weryfikacji w źródle pierwotnym.

### Gaps
- Nie sprawdzono Six Sigma/Lean-specyficznych źródeł poza powyższymi ani ISO TC 69 (statystyka); nie zweryfikowano wpisów PKN; brak statusu feedów Quality Digest, ASQ, ISO.

## Regulacje wpływające na przemysł i łańcuch dostaw (CBAM, CSRD, NIS2): stan na listopad 2026 jako kontekst dla wyboru źródeł

### Takeaway
Wszystkie trzy regulacje mają w 2026 aktywne zmiany (CBAM w okresie ostatecznym, Omnibus dla CSRD/ESRS, polska nowelizacja KSC), więc źródła T1 z kandydatów 2, 4 i 5 mają realną wartość newsową. Rzetelne streszczenia wymagają sprawdzenia w aktach prawnych.

### Cited Findings
- CBAM: reżim ostateczny od 1.01.2026; próg 50 t; pierwsza deklaracja za 2026 w 2027 wg HSF Kramer — [DG TRADE PL](https://trade.ec.europa.eu/access-to-markets/pl/news/poczatek-ostatecznego-okresu-obowiazywania-cbam-w-ue); [HSF Kramer](https://www.hsfkramer.com/notes/energy/2026-posts/operationalisation-and-simplification-of-the-eu-cbam).
- CSRD: Omnibus – dyrektywa (UE) 2026/470; zmienione ESRS od roku obrotowego 2027, ograniczenie żądań wobec podwykonawców (value chain cap) — [Crowe PL](https://www.crowe.com/pl/insights/pakiet-omnibus-i-zatwierdzony---uproszczenia-w-raportowaniu-esg-dla-firm); [MoFo](https://www.mofo.com/resources/insights/260513-european-commission-proposes-revised-esrs). Wg WTW projekt zmniejsza liczbę obowiązkowych punktów danych ESRS o ponad 50% — [WTW](https://www.wtwco.com/en-be/insights/2026/01/what-does-the-omnibus-mean-for-corporate-sustainability-reporting-directive-csrd). Liczba objętych firm (ok. 5 000 wg wyszukiwania) niespójna między źródłami.
- NIS2/KSC: patrz kandydat 5; kary do 10 mln euro wg portalu infor.pl — [infor.pl](https://ksiegowosc.infor.pl/wiadomosci/7533605,nis2-wchodzi-do-polski-nawrocki-podpisal-ustawe-firmy-musza-dzialac-natychmiast-kary-siegna-10-mln-euro.html) (źródło wtórne).
- Energia: IEA i Eurostat (kandydaty 1 i 7) dokumentują wzrost cen energii i PPI w 2026; wzrost PPI i cen importu w Niemczech (+8,3% w sierpniu 2026 wg bloga dostawcy GEP, niezweryfikowane) — [GEP](https://www.gep.com/de-de/blog/importpreise-steigen-um-8-3-strategien-fuer-den-einkauf).

### Inferences
- Wskazane źródła KE/MC pokrywają wszystkie trzy regulacje bezpośrednio; kancelarie (KPMG, EY, Crowe) dobrze streszczają, ale to treści marketingowe, więc lepiej oznaczać je jako T2 lub pomijać.

### Gaps
- Nie sprawdzono EUR-Lex/Dziennika Urzędowego UE ani strony Rządowego Centrum Legislacji jako źródeł; nie zbadano EEA ani NBP.
