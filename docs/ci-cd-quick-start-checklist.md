# CI/CD Quick Start Checklist

Szybka lista kontrolna do uruchomienia CI/CD w CulturAllyAI.

## ☑️ Pre-flight Checklist

### 1. Dostęp do Repozytorium
- [ ] Mam uprawnienia administratora/owner do repozytorium GitHub
- [ ] Mogę widzieć zakładkę "Settings" w repozytorium

### 2. Przygotowanie Kluczy

#### Supabase (Test Environment)
- [ ] Mam konto Supabase
- [ ] Mam utworzony projekt testowy
- [ ] Skopiowałem `TEST_SUPABASE_URL`
- [ ] Skopiowałem `TEST_SUPABASE_ANON_KEY` (to jest bezpieczny klucz publiczny ✅)

#### Supabase (Production Environment)
- [ ] Skopiowałem `PROD_SUPABASE_URL` (może być ten sam co testowy)
- [ ] Skopiowałem `PROD_SUPABASE_ANON_KEY`

#### OpenRouter
- [ ] Mam konto OpenRouter.ai
- [ ] Mam aktywny klucz API
- [ ] Skopiowałem `TEST_OPENROUTER_API_KEY`
- [ ] Sprawdziłem, że mam środki na koncie (AI generation wymaga kredytów)

#### Codecov (Opcjonalne)
- [ ] Skonfigurowałem konto Codecov (jeśli chcę tracking pokrycia)
- [ ] Skopiowałem `CODECOV_TOKEN`

### 3. Konfiguracja GitHub Secrets

**🔐 Czy to bezpieczne?** ✅ **CAŁKOWICIE BEZPIECZNE!**

GitHub Secrets są szyfrowane AES-256-GCM i nigdy nie są widoczne w publicznym repo. To standardowa praktyka używana przez miliony projektów (Next.js, React, Vue, itp.).

**📖 Przeczytaj więcej:** [GitHub Secrets Security FAQ](./github-secrets-security.md)

Dla każdego sekretu:
- [ ] `TEST_SUPABASE_URL` dodany
- [ ] `TEST_SUPABASE_ANON_KEY` dodany (bezpieczny klucz publiczny)
- [ ] `TEST_OPENROUTER_API_KEY` dodany
- [ ] `PROD_SUPABASE_URL` dodany
- [ ] `PROD_SUPABASE_ANON_KEY` dodany
- [ ] `CODECOV_TOKEN` dodany (opcjonalnie)

**Sprawdzenie:**
- [ ] Wszystkie nazwy sekretów są DOKŁADNIE takie jak wyżej (case-sensitive!)
- [ ] Nie ma literówek w nazwach
- [ ] Nie ma spacji na początku/końcu wartości

### 4. Weryfikacja Lokalna (przed pushowaniem)

```bash
# W katalogu projektu:

# 1. Sprawdź, czy masz poprawną wersję Node.js
node --version  # Powinno być 22.14.0

# 2. Zainstaluj dependencies (jeśli jeszcze nie)
npm install

# 3. Uruchom linting
npm run lint

# 4. Uruchom testy jednostkowe
npm run test

# 5. Uruchom build
npm run build

# 6. (Opcjonalnie) Uruchom testy E2E lokalnie
npm run test:e2e
```

Sprawdź wyniki:
- [ ] Linting przeszedł bez błędów
- [ ] Testy jednostkowe przeszły (241/241)
- [ ] Build zakończył się sukcesem
- [ ] (Opcjonalnie) Testy E2E przeszły lokalnie

### 5. Pierwszy Test Pipeline'u

#### Metoda 1: Manualne uruchomienie (ZALECANE)

1. [ ] Przejdź do zakładki "Actions" w GitHub
2. [ ] Kliknij "CI/CD Pipeline" w lewym menu
3. [ ] Kliknij "Run workflow" (prawy górny róg)
4. [ ] Wybierz branch "master"
5. [ ] Kliknij zielony przycisk "Run workflow"
6. [ ] Poczekaj ~30 sekund i odśwież stronę
7. [ ] Kliknij na nowe uruchomienie, aby zobaczyć postęp

#### Metoda 2: Automatyczne przez push

```bash
# Jeśli masz jakieś zmiany do commitowania:
git add .
git commit -m "Configure CI/CD pipeline"
git push origin master
```

### 6. Monitorowanie Pierwszego Uruchomienia

- [ ] Job "lint" zakończył się sukcesem (✅ zielony checkmark)
- [ ] Job "test" zakończył się sukcesem
- [ ] Job "e2e" zakończył się sukcesem (to potrwa ~3-5 min)
- [ ] Job "build" zakończył się sukcesem
- [ ] Job "status" zakończył się sukcesem

### 7. Weryfikacja Artefaktów

Po zakończeniu pipeline'u:
- [ ] Przewinąłem w dół do sekcji "Artifacts"
- [ ] Widzę 3 artefakty: playwright-report, e2e-results, dist
- [ ] (Opcjonalnie) Pobrałem i sprawdziłem playwright-report

### 8. Sprawdzenie Badge Status (Opcjonalne)

Możesz dodać badge do README pokazujący status CI/CD:

```markdown
![CI/CD Pipeline](https://github.com/Devrilo/CulturAllyAI/actions/workflows/ci.yml/badge.svg)
```

- [ ] Badge pokazuje "passing" (zielony)

## 🚨 Troubleshooting Quick Reference

### ❌ Jeśli coś nie działa:

**E2E testy failują:**
1. Sprawdź logi w Actions
2. Upewnij się, że `TEST_OPENROUTER_API_KEY` jest poprawny
3. Sprawdź, czy masz środki na koncie OpenRouter
4. Zobacz [docs/github-secrets-setup-guide.md](./github-secrets-setup-guide.md) → Troubleshooting

**Build failuje:**
1. Sprawdź, czy `PROD_SUPABASE_URL` i `PROD_SUPABASE_ANON_KEY` są ustawione
2. Uruchom lokalnie `npm run build`
3. Zobacz logi build job w Actions

**"Secret not found":**
1. Sprawdź pisownię nazwy sekretu (WIELKIE_LITERY)
2. Sprawdź, czy nie ma spacji
3. Usuń i dodaj sekret ponownie

**Timeout w E2E:**
1. To może być normalne przy pierwszym uruchomieniu (Playwright instaluje przeglądarki)
2. Poczekaj na drugie uruchomienie
3. Jeśli problem się powtarza, sprawdź OpenRouter API key

## ✅ Gotowe!

Jeśli wszystkie checkboxy są zaznaczone, Twój CI/CD jest gotowy! 🎉

### Co dalej?

- Pipeline będzie działać automatycznie przy każdym pushu do master
- Możesz monitorować uruchomienia w zakładce Actions
- Artefakty są dostępne przez 7 dni
- Opcjonalnie: dodaj Codecov badge do README

### Przydatne Linki

- [CI/CD Setup Documentation](./ci-cd-setup.md)
- [GitHub Secrets Setup Guide](./github-secrets-setup-guide.md)
- [GitHub Actions Dashboard](https://github.com/Devrilo/CulturAllyAI/actions)
- [Supabase Dashboard](https://app.supabase.com/)
- [OpenRouter Dashboard](https://openrouter.ai/)

---

**Czas na pierwszą kawę podczas działania pipeline'u ☕** (~8-13 minut)
