// Progi wyboru. Same kryteria oceny są w prompts/selection-score.md; tutaj decydujesz tylko, „ile punktów
// wystarcza”. Model oceniający niezależnie ocenia każdy tekst dwa razy (0–100). Tekst trafia do wyboru, gdy
// suma obu ocen ≥ 2 × próg i nie jest powtórzeniem wiadomości już wybranej (docs/selection.md); karta
// pokazuje średnią z obu ocen.
// Progi zależą od poziomu źródła: oficjalne źródła z pierwszej ręki mają niższy próg, media i blogi wyższy.
// Po zmianie progów albo promptu oceny uruchom scripts/eval-selection.ts na własnych oznaczonych przykładach
// i dopiero wtedy wdrażaj (docs/pl/kalibracja.md).

export const SELECTION = {
  /**
   * Poziom źródła → próg wyboru (średnia ocena). Poziom ustawiasz każdemu źródłu w panelu, w „Źródłach”:
   *   T1 instytucje i oficjalne źródła · T1_5 eksperci i blogi praktyków · T2 media
   * Poziom EXCLUDE_MP i poziomy spoza tej listy nie biorą udziału w ocenie wyboru (trafiają tylko do „Wszystkich”).
   */
  thresholds: { T1: 60, T1_5: 65, T2: 76 } as Record<string, number>,
  /**
   * Teksty niewybrane, ale ze średnią powyżej tej liczby, dostają tytuł, streszczenie i „Dlaczego warto” pisane
   * tak jak wybrane (krok rozumienia); pozostałe tańszą ścieżką „tytuł i streszczenie”.
   */
  understandFloor: 50,
} as const;
