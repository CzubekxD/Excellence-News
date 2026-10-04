// Admin sign-in: the admin password (ADMIN_PASSWORD), and Feishu when it is configured. The form posts
// straight to the API, which sets the session cookie and sends the browser on.
import { useLoaderData } from "react-router";
import type { Route } from "./+types/admin-login";
import { SITE } from "@aihot/site";
import { apiGet } from "../lib/api.server";
import { Wordmark } from "@aihot/site/brand/Logo.tsx";
import { buttonClass } from "../components/ui/Controls";

const ERRORS: Record<string, string> = {
  wrong: "Nieprawidłowe hasło, spróbuj jeszcze raz.",
  unset: "Hasło administratora nie jest ustawione: wpisz ADMIN_PASSWORD (min. 12 znaków) w .env, uruchom serwis ponownie i zaloguj się.",
  "too-many": "Za dużo prób, spróbuj ponownie za 15 minut.",
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("return") ?? "/admin";
  const options = await apiGet<{ password: boolean; feishu: boolean }>("/api/auth/options", { signal: request.signal }).catch(() => ({ password: true, feishu: false }));
  return { returnTo: returnTo.startsWith("/admin") ? returnTo : "/admin", error: url.searchParams.get("error"), ...options };
}

export const meta: Route.MetaFunction = () => [{ title: `Logowanie · panel ${SITE.name}` }, { name: "robots", content: "noindex, nofollow" }];

export const headers: Route.HeadersFunction = () => ({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" });

export default function AdminLogin() {
  const { returnTo, error, password, feishu } = useLoaderData<typeof loader>();
  const message = error ? (ERRORS[error] ?? ERRORS.wrong) : !password ? ERRORS.unset : null;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center justify-center gap-2">
          <Wordmark size={28} className="text-ink" />
          <span className="text-[15px] font-semibold text-ink-3">Panel</span>
        </div>
        <form method="post" action="/api/auth/password" className="card mt-8 p-6">
          <input type="hidden" name="return" value={returnTo} />
          <label htmlFor="password" className="block text-[13px] font-medium text-ink-2">
            Hasło administratora
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            className="mt-2 h-10 w-full rounded-full border border-line-strong bg-surface px-4 text-[14px] text-ink outline-none transition-colors focus:border-accent"
          />
          {message && (
            <p role="alert" className="mt-3 text-[12.5px] leading-relaxed text-hot">
              {message}
            </p>
          )}
          <button type="submit" className={`${buttonClass("primary", "lg")} mt-5 w-full`}>
            Zaloguj
          </button>
          {feishu && (
            <a href={`/api/auth/feishu?${new URLSearchParams({ return: returnTo })}`} className={`${buttonClass("secondary", "lg")} mt-3 w-full`}>
              Zaloguj przez Feishu
            </a>
          )}
        </form>
        <p className="mt-6 text-center text-[12px] text-ink-4">
          <a href="/" className="hover:text-ink-2">
            Wróć do {SITE.name}
          </a>
        </p>
      </div>
    </div>
  );
}
