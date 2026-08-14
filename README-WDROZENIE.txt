LISTA ZAKUPÓW V2 — DARK UI
============================

Pakiet jest przygotowany jako pełna podmiana frontendu bez zmiany backendu n8n.

PODMIEŃ W REPOZYTORIUM atybus-create/lista-zakupow-pwa:
1. index.html
2. styles.css
3. app.js
4. manifest.webmanifest

POZOSTAW BEZ ZMIAN:
- sw.js
- icon.svg
- .github/workflows/pages.yml
- backend n8n i Data Tables

Po zapisaniu plików na branchu main GitHub Actions powinien automatycznie opublikować nową wersję Pages.
Jeśli telefon pokazuje stary wygląd, zamknij aplikację/PWA i otwórz ją ponownie. Jeśli nadal jest stary wygląd, odśwież stronę w przeglądarce, ponieważ service worker może chwilowo trzymać poprzedni CSS/JS.

Zakres zmian:
- pełny ciemny motyw grafit/czerń,
- akcent teal/emerald,
- nowy nagłówek i nawigacja,
- eleganckie karty listy,
- ikony produktów dobierane lokalnie na podstawie nazwy produktu,
- nowy ekran dodawania i rozpoznawania,
- postęp zakupów,
- nowe archiwum,
- dolny dock i przycisk +,
- funkcjonalność API pozostaje zgodna z aktualnym webhookiem lista-zakupow-v2.
