// Okładki wydań: motywy (zdjęcia w skali szarości) i to, które wydanie dostaje który.
// Zdjęcia leżą w site/covers/<plik>, 240×320 px, skala szarości. Generator okładek
// (packages/backend/src/media/cover.ts) robi z nich raster drukarski w kręgach w stylu Fangora.
// Wszystkie pochodzą z Unsplash (licencja Unsplash: wolno używać bez opłat, także komercyjnie);
// autorów podajemy na stronie „O serwisie” i w stopce strony głównej.

export interface CoverMotif {
  /** Plik w site/covers/. */
  file: string;
  /** Co widać na zdjęciu (tekst alternatywny okładki). */
  alt: string;
  author: string;
  /** Strona zdjęcia na Unsplash. */
  photo: string;
}

/** Motyw na każdą kategorię z industry/taxonomy.ts (klucz kategorii → motyw). */
export const COVER_MOTIFS: Record<string, CoverMotif> = {
  lean: { file: "lean.jpg", alt: "Ludzie przy linii montażowej w hali", author: "Remy Gieling", photo: "https://unsplash.com/photos/people-working-at-factory-assembly-line-KP6XQIEjjPA" },
  opex: { file: "opex.jpg", alt: "Liniał, toczone części i rysunki techniczne", author: "Raymond Sime", photo: "https://unsplash.com/photos/schuck-group-ruler-with-metal-parts-and-technical-drawings-KCgTyuYE5JA" },
  agile: { file: "agile.jpg", alt: "Zespół przykleja karteczki na ścianie", author: "Parabol", photo: "https://unsplash.com/photos/woman-in-blue-long-sleeve-shirt-holding-yellow-sticky-notes--00U7K5eRA8" },
  costs: { file: "costs.jpg", alt: "Kalkulator na stosie dokumentów", author: "FIN", photo: "https://unsplash.com/photos/a-calculator-sitting-on-top-of-a-pile-of-papers-741iShluYhk" },
  "supply-chain": { file: "supply-chain.jpg", alt: "Długi korytarz regałów w magazynie", author: "Khang Nguyen", photo: "https://unsplash.com/photos/a-long-row-of-shelves-in-a-warehouse-gnjOurJnLPQ" },
  industry: { file: "industry.jpg", alt: "Inżynierowie przy stanowiskach w zakładzie motoryzacyjnym", author: "ThisisEngineering", photo: "https://unsplash.com/photos/engineers-working-in-automotive-factory-WjOWazUPAss" },
  leadership: { file: "leadership.jpg", alt: "Zespół nad dokumentami przy stole", author: "ThisisEngineering", photo: "https://unsplash.com/photos/people-reviewing-documents-at-workspace-8Jw2WhafOOg" },
  stats: { file: "stats.jpg", alt: "Kolumny liczb na ekranie", author: "Tyler Easton", photo: "https://unsplash.com/photos/assorted-numbers-printed-on-wall-faixctm2YRQ" },
};

/**
 * Motyw, gdy wydania nie da się przypisać do kategorii (tygodnik i miesięcznik mają działy tematyczne,
 * nie kategorie). Dziennik bierze kategorię swojego pierwszego działu.
 */
export const COVER_DEFAULTS = { daily: "lean", weekly: "agile", monthly: "supply-chain" } as const;
