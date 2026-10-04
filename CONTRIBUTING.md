# Jak współtworzyć

Excellence News to prywatny serwis zbudowany na frameworku [AIHOT](https://github.com/KKKKhazix/AIHOT). Zgłoszenia błędów i propozycje zmian przyjmujemy przez [Issues](https://github.com/CzubekxD/Excellence-News/issues) i pull requesty w tym repozytorium.

## Zasady zmian

1. Przeczytaj [AGENTS.md](AGENTS.md) i dokument z [`docs/pl/`](docs/pl/) właściwy dla zmiany. Jeden PR rozwiązuje jeden jasno opisany problem.
2. Treść serwisu (źródła, kryteria wyboru, kategorie) zmieniasz w `industry/`, nazwę, teksty i strony w `site/`, a funkcje potrzebne tylko temu serwisowi w `modules/`. Silnika (`apps/`, `packages/`) zwykle nie trzeba ruszać.
3. Przed wysłaniem uruchom:
   ```bash
   npm run typecheck
   DATABASE_URL=postgres://127.0.0.1:5432/excellence_test npm test   # nazwa bazy musi kończyć się na _test lub _ci; konto potrzebuje uprawnienia CREATEDB
   npm run build -w @aihot/web && node --test apps/web/tests/*.test.ts
   ```
   W trakcie programowania trzymaj wyłączone pobieranie, wywołania modeli i powiadomienia; nie testuj na bazie produkcyjnej ani na płatnych usługach.
4. Opublikowanych migracji bazy nie zmieniaj; poprawka trafia do nowego pliku z jednym poleceniem możliwym do wykonania online (`node scripts/check-migrations.ts --base main`).
5. Zmiany w konfiguracji albo krokach aktualizacji opisz w [docs/pl/wdrozenie-proxmox.md](docs/pl/wdrozenie-proxmox.md).

Nie commituj `.env`, kluczy API, haseł, ciasteczek ani danych produkcyjnych; z logów i zrzutów ekranu usuń dane wrażliwe. Kod jest na [licencji MIT](LICENSE), informacje o marce i materiałach zewnętrznych są w [NOTICE](NOTICE).
