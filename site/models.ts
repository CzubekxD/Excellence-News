// Których modeli używa serwis. Framework ma wbudowany model `default`: ten wskazany zmiennymi środowiskowymi
// LLM_BASE_URL / LLM_API_KEY / LLM_MODEL (u nas domyślnie Gemini Flash, patrz .env.example).
// Tu dopisujesz modele nazwane (każdy z własnym adresem i zmienną z kluczem) i to, którego używa który krok;
// kroki niewpisane używają default. Przy wdrożeniu można też zmieniać model kroku zmiennymi środowiskowymi
// (PREFILTER_MODEL, SCORE_MODEL…) albo w panelu, na stronie „Modele i ewaluacja”.
// Nazwę modelu każdego dostawcy możesz nadpisać zmienną *_MODEL (np. GROQ_MODEL), gdy dostawca zmieni ofertę.

export interface ModelPreset {
  service: string;
  model: string;
  baseUrlEnv: string;
  apiKeyEnv: string;
  /** Dodatkowe pola zapytania, np. ograniczenie rozumowania przy krótkich zadaniach strukturalnych. */
  extra?: Record<string, unknown>;
  /** Modele rozumujące najpierw myślą: dodatkowy limit tokenów wyjścia na rozumowanie. default używa LLM_REASONING_TOKENS. */
  reasoningTokens?: number;
  /** API obsługuje tryb JSON. */
  jsonMode: boolean;
  /** Model widzi obrazy. */
  vision?: boolean;
}

const env = (name: string, fallback: string) => (typeof process !== "undefined" && process.env[name]?.trim()) || fallback;

/** Modele nazwane (każdy wymaga własnego klucza). Niepotrzebne możesz usunąć. */
export const PRESETS: Record<string, ModelPreset> = {
  // Google Gemini przez endpoint zgodny z OpenAI. Darmowy klucz: aistudio.google.com → Get API key.
  // Modele Flash rozumują; niski poziom wystarcza do krótkich zadań i oszczędza limit.
  "gemini-flash": {
    service: "gemini", model: env("GEMINI_MODEL", "gemini-flash-latest"), baseUrlEnv: "GEMINI_BASE_URL", apiKeyEnv: "GEMINI_API_KEY",
    extra: { reasoning_effort: "low" }, reasoningTokens: 2000, jsonMode: true, vision: true,
  },
  "gemini-flash-lite": {
    service: "gemini", model: env("GEMINI_LITE_MODEL", "gemini-flash-lite-latest"), baseUrlEnv: "GEMINI_BASE_URL", apiKeyEnv: "GEMINI_API_KEY",
    extra: { reasoning_effort: "low" }, reasoningTokens: 1000, jsonMode: true,
  },
  // Groq: darmowy plan z limitem dziennym, bardzo szybki. Klucz: console.groq.com.
  groq: {
    service: "groq", model: env("GROQ_MODEL", "openai/gpt-oss-120b"), baseUrlEnv: "GROQ_BASE_URL", apiKeyEnv: "GROQ_API_KEY",
    extra: { reasoning_effort: "low" }, reasoningTokens: 1500, jsonMode: true,
  },
  // Cerebras: darmowy plan z dziennym limitem tokenów. Klucz: cloud.cerebras.ai.
  cerebras: {
    service: "cerebras", model: env("CEREBRAS_MODEL", "gpt-oss-120b"), baseUrlEnv: "CEREBRAS_BASE_URL", apiKeyEnv: "CEREBRAS_API_KEY",
    extra: { reasoning_effort: "low" }, reasoningTokens: 1500, jsonMode: true,
  },
  // Mistral: klucze API wymagają płatnego planu (Pro lub wyższy). Klucz: console.mistral.ai.
  mistral: {
    service: "mistral", model: env("MISTRAL_MODEL", "mistral-medium-latest"), baseUrlEnv: "MISTRAL_BASE_URL", apiKeyEnv: "MISTRAL_API_KEY", jsonMode: true,
  },
};

/**
 * Domyślny model każdego kroku (lista kroków w panelu: „Modele i ewaluacja”); wartość to nazwa z PRESETS albo default.
 * Kroki niewpisane używają default (LLM_* w .env). Przykład podziału, gdy dojdzie klucz Groq:
 * { prefilter: "groq", groupReview: "groq" }
 */
export const DEFAULTS: Record<string, string> = {};
