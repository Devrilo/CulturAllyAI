# CI/CD Setup - GitHub Actions

## Przegląd

Pipeline CI/CD dla CulturAllyAI (workflow: **"Test and Build"**) składa się z 5 jobów uruchamianych sekwencyjnie:

```
lint → test & e2e (parallel) → build → status
```

**Plik konfiguracyjny:** `.github/workflows/test-and-build.yml`

## Wyzwalacze

- **Push do master** - automatyczne uruchomienie po każdym pushu do gałęzi master
- **Manual trigger** - możliwość ręcznego uruchomienia z zakładki Actions w GitHub

## Joby

### 1. Lint & Type Check
- Sprawdzenie kodu ESLintem
- Walidacja typów TypeScript
- Najszybszy job (~1-2 min)

### 2. Unit & Integration Tests
- Uruchomienie testów jednostkowych i integracyjnych (Vitest)
- Raport pokrycia kodu (min. 80% dla serwisów i walidatorów)
- Upload raportu do Codecov (opcjonalnie)
- Wymaga: secrets dla Supabase (jeśli testy potrzebują DB)

### 3. E2E Tests (Playwright)
- Testy end-to-end w przeglądarce Chromium
- Testowanie pełnych flow'ów aplikacji
- Upload raportów HTML i wyników JSON
- Wymaga: secrets dla Supabase i OpenRouter

### 4. Production Build
- Build aplikacji w trybie produkcyjnym
- Walidacja, czy aplikacja kompiluje się poprawnie
- Upload artefaktów build'u
- Wymaga: secrets dla Supabase (prod)

### 5. CI/CD Status
- Zbiorczy status wszystkich jobów
- Raportowanie sukcesu/błędu pipeline'u

## 🔐 Bezpieczeństwo GitHub Secrets

**Czy GitHub Secrets są bezpieczne w publicznym repo?** ✅ **TAK - CAŁKOWICIE!**

- GitHub Secrets są **szyfrowane AES-256-GCM** i **nigdy nie są widoczne** w kodzie źródłowym
- Nie pojawiają się w logach (są automatycznie zamaskowane: `***`)
- Nie są dostępne w pull requestach z forków (ochrona przed atakami)
- Są dostępne **tylko** podczas wykonywania workflow w kontekście uprawnień write
- To **standardowa i zalecana praktyka** w DevOps (miliony projektów, w tym Next.js, React, Vue)

**📖 Szczegółowe wyjaśnienie:** [GitHub Secrets Security FAQ](./github-secrets-security.md)

Zobacz też: [GitHub Docs - Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Wymagane Sekrety GitHub

### Dla testów (E2E):
```
TEST_SUPABASE_URL              - URL instancji Supabase dla testów
TEST_SUPABASE_ANON_KEY        - Anon key Supabase dla testów (bezpieczny klucz publiczny)
TEST_OPENROUTER_API_KEY       - API key OpenRouter dla testów AI
```

**Uwaga:** `SUPABASE_SERVICE_ROLE_KEY` został **usunięty** z wymagań. Pipeline działa bez niego!

### Dla builda produkcyjnego:
```
PROD_SUPABASE_URL             - URL instancji Supabase produkcyjnej
PROD_SUPABASE_ANON_KEY       - Anon key Supabase produkcyjnej
```

**Uwaga:** Anon key to **publiczny klucz** - jest bezpieczny do użycia w aplikacjach frontend. RLS (Row Level Security) w bazie danych chroni dane.

### Opcjonalne:
```
CODECOV_TOKEN                 - Token Codecov dla raportów pokrycia (opcjonalnie)
```

## Konfiguracja Sekretów

**📖 Szczegółowy przewodnik krok po kroku:** [GitHub Secrets Setup Guide](./github-secrets-setup-guide.md)

Krótka instrukcja:
1. Przejdź do: `Settings` → `Secrets and variables` → `Actions`
2. Kliknij `New repository secret`
3. Dodaj każdy sekret z powyższej listy

Jeśli to Twój pierwszy raz z GitHub Secrets, skorzystaj z [pełnego przewodnika](./github-secrets-setup-guide.md) ze zrzutami ekranu i rozwiązywaniem problemów.

## Monitoring i Debugging

### Artifacts dostępne po uruchomieniu:
- `playwright-report` - HTML report z testów E2E (7 dni retencji)
- `e2e-results` - JSON z wynikami testów E2E (7 dni retencji)
- `dist` - Build produkcyjny aplikacji (7 dni retencji)

### Logi i raporty:
- Logi jobów dostępne w zakładce Actions
- Report Playwright dostępny w artifacts
- Coverage report uploadowany do Codecov (jeśli skonfigurowano)

## Optymalizacje

### Zainstalowane optymalizacje:
- **Cache npm** - używa cache dla `node_modules`
- **Concurrency control** - anuluje poprzednie uruchomienia dla tej samej gałęzi
- **Parallel jobs** - testy unit i E2E uruchamiane równolegle
- **Playwright browser cache** - tylko Chromium instalowany

### Szacowany czas wykonania:
- Lint: ~1-2 min
- Tests: ~2-3 min
- E2E: ~3-5 min
- Build: ~2-3 min
- **Total**: ~8-13 min

## Rozszerzenie Pipeline'u

Pipeline jest minimalny i można go rozszerzyć o:

### Deploy do DigitalOcean:
```yaml
deploy:
  name: Deploy to DigitalOcean
  runs-on: ubuntu-latest
  needs: build
  if: github.ref == 'refs/heads/master'
  steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v4
      with:
        name: dist
    
    - name: Deploy to DigitalOcean
      # Implementacja deployu (Docker, doctl, itp.)
```

### Testy wydajnościowe (k6):
```yaml
performance:
  name: Performance Tests
  runs-on: ubuntu-latest
  needs: build
  steps:
    - name: Run k6 tests
      run: k6 run tests/performance/load-test.js
```

### Database migrations (Supabase):
```yaml
migrations:
  name: Run Migrations
  runs-on: ubuntu-latest
  needs: build
  steps:
    - name: Run Supabase migrations
      run: supabase db push
```

## Troubleshooting

### E2E testy failują z błędem timeout:
- Zwiększ timeout w `playwright.config.ts`
- Sprawdź, czy secrets są poprawnie skonfigurowane
- Sprawdź logi dev servera w Actions

### Build failuje:
- Upewnij się, że PROD_SUPABASE_URL i PROD_SUPABASE_ANON_KEY są ustawione
- Sprawdź, czy lokalne `npm run build` działa poprawnie

### Coverage threshold not met:
- Dodaj testy dla nieprzetestowanego kodu
- Lub dostosuj threshold w `vitest.config.ts`

## Best Practices

1. **Nie commituj sekretów** - zawsze używaj GitHub Secrets
2. **Testuj lokalnie** - przed pushem uruchom `npm run lint`, `npm test`, `npm run test:e2e`
3. **Monitoruj Actions** - regularnie sprawdzaj dashboard Actions
4. **Aktualizuj dependencies** - używaj Dependabot dla aktualizacji actions
5. **Optymalizuj czas** - jeśli pipeline trwa >15 min, rozważ optymalizacje
