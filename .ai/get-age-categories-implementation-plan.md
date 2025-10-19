# API Endpoint Implementation Plan: GET /api/categories/age

## 1. Przegląd punktu końcowego
- Zwraca listę dostępnych kategorii wiekowych z wartościami enum i polskimi etykietami.
- Endpoint publiczny – nie wymaga autentykacji.
- Zwraca statyczne dane bazujące na typie enum `age_category` z bazy danych.
- Umożliwia cache'owanie po stronie klienta (nagłówek `Cache-Control`).

## 2. Szczegóły żądania
- Metoda HTTP: `GET`
- Ścieżka: `/api/categories/age`
- Nagłówki: brak wymaganych
- Parametry: brak (path, query, body)
- Walidacja: brak (endpoint nie przyjmuje parametrów)
- DTO & Command modele:
  - Używane typy: `AgeCategoryDTO`, `AgeCategoriesResponseDTO` (już istnieją w `src/types.ts`)

## 3. Szczegóły odpowiedzi
- Sukces 200: `AgeCategoriesResponseDTO` z tablicą 7 kategorii
- Błędy:
  - 500: `ErrorResponseDTO` w przypadku nieoczekiwanych wyjątków
- Nagłówki: `Content-Type: application/json`, `Cache-Control: public, max-age=3600`

## 4. Przepływ danych
1. Handler odczytuje żądanie GET
2. Wywołuje serwis `getAgeCategories()` z `src/lib/services/categories.service.ts`
3. Serwis zwraca statyczną listę kategorii (mapowanie enum → DTO z polskimi labelami)
4. Handler zwraca 200 z `AgeCategoriesResponseDTO` i nagłówkami cache
5. W przypadku błędu: log przez `console.error` i odpowiedź 500

## 5. Względy bezpieczeństwa
- Endpoint publiczny – brak wymagań autentykacji/autoryzacji
- Zwraca statyczne dane – brak ryzyka wycieku danych użytkownika
- Brak parametrów wejściowych – brak ryzyka SQL injection
- Opcjonalny rate limiting w middleware dla ochrony przed nadużyciami

## 6. Obsługa błędów
- `500 Internal Server Error`: nieoczekiwany wyjątek (logowanie przez `console.error`, generyczna wiadomość `ErrorResponseDTO`)
- Brak błędów 400/401/403/404 (endpoint zawsze zwraca dane, nie wymaga parametrów ani autoryzacji)

## 7. Wydajność
- Bardzo szybki endpoint – statyczne dane bez dostępu do bazy danych (latencja <5ms)
- Cache'owanie: nagłówek `Cache-Control: public, max-age=3600` dla CDN i przeglądarek
- Możliwość memoryzacji wyniku w pamięci aplikacji
- Minimalny rozmiar odpowiedzi: ~250-350 bajtów JSON

## 8. Kroki implementacji
1. Rozszerzyć `src/lib/services/categories.service.ts` o funkcję `getAgeCategories` zwracającą tablicę `AgeCategoryDTO[]` z mapowaniem enum na polskie etykiety
2. Utworzyć `src/pages/api/categories/age.ts` z handlerem `GET`:
   - Wywołanie `getAgeCategories()` i zwrócenie `AgeCategoriesResponseDTO`
   - Ustawienie nagłówków cache i Content-Type
   - Obsługa błędów z logowaniem
3. Przygotować testy manualne w `docs/manual-tests/get-age-categories.md`:
   - Sukces: curl bez nagłówków, weryfikacja listy 7 kategorii
   - Weryfikacja nagłówków cache w odpowiedzi
4. Zaktualizować dokumentację (`.ai/api-plan.md`, `CHANGELOG.md`)
5. Uruchomić linty (`npm run lint`) i build (`npm run build`); naprawić błędy przed commitem
