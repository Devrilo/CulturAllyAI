# Cloudflare Pages Deployment Guide

## Przegląd

Projekt CulturAllyAI został skonfigurowany do automatycznego deploymentu na Cloudflare Pages z wykorzystaniem GitHub Actions.

## Wymagania

### 1. Cloudflare Account ID

Pobierz swój Account ID z dashboardu Cloudflare:
1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Przejdź do sekcji "Workers & Pages"
3. Account ID znajdziesz w prawej kolumnie

### 2. Cloudflare API Token

Utwórz API Token z odpowiednimi uprawnieniami:
1. Przejdź do [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Kliknij "Create Token"
3. Użyj szablonu "Edit Cloudflare Workers" lub utworz custom token z uprawnieniami:
   - Account - Cloudflare Pages: Edit
   - Account - Workers KV Storage: Edit (dla sesji)
4. Skopiuj wygenerowany token

### 3. Cloudflare Pages Project

Utwórz projekt w Cloudflare Pages:
1. W Cloudflare Dashboard przejdź do "Workers & Pages"
2. Kliknij "Create application" → "Pages"
3. Wybierz "Direct Upload"
4. Nazwij projekt: `culturallyai`

### 4. GitHub Secrets

Dodaj następujące sekrety w ustawieniach repozytorium GitHub:
- `CLOUDFLARE_API_TOKEN` - token z kroku 2
- `CLOUDFLARE_ACCOUNT_ID` - account ID z kroku 1

Pozostałe sekrety wymagane przez aplikację:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_KEY`
- `OPENROUTER_API_KEY`

## Konfiguracja KV Namespace dla Sesji

⚠️ **WAŻNE**: Konfiguracja KV namespace jest opcjonalna i powinna być wykonana **PO** pierwszym deploymencie, jeśli sesje są wymagane.

### Krok po kroku:

1. Wykonaj pierwszy deployment (bez KV namespace)
2. W Cloudflare Dashboard przejdź do "Workers & Pages"
3. Wybierz projekt "culturallyai"
4. Przejdź do zakładki "Settings" → "Functions"
5. W sekcji "KV namespace bindings" kliknij "Add binding"
6. Ustaw:
   - Variable name: `SESSION`
   - KV namespace: Utwórz nowy namespace o nazwie "culturallyai-sessions"
7. Zapisz zmiany

### Alternatywnie przez Wrangler CLI:

```bash
# Zaloguj się do Cloudflare
npx wrangler login

# Utwórz KV namespace
npx wrangler kv:namespace create "SESSION" --preview=false

# Output będzie zawierał ID namespace, np:
# { binding = "SESSION", id = "abc123..." }
```

Jeśli chcesz użyć `wrangler.toml`, dodaj do pliku:

```toml
[[kv_namespaces]]
binding = "SESSION"
id = "TUTAJ_WSTAW_PRAWDZIWE_ID"
```

## Zmienne Środowiskowe w Cloudflare Pages

Ustaw zmienne środowiskowe w projekcie Cloudflare Pages:

1. W dashboardzie projektu przejdź do "Settings" → "Environment variables"
2. Dodaj następujące zmienne dla środowiska "Production":
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_KEY`
   - `OPENROUTER_API_KEY`

## Workflow CI/CD

Workflow `.github/workflows/master.yml` wykonuje następujące kroki:

### 1. Lint (linting kodu)
- Sprawdza kod za pomocą ESLint
- Wymaga poprawnej składni i zgodności z zasadami projektu

### 2. Unit Tests (testy jednostkowe)
- Uruchamia testy z pokryciem kodu
- Generuje raport coverage
- Przechowuje artefakty przez 7 dni

### 3. Build (budowanie aplikacji)
- Kompiluje aplikację z adapterem Cloudflare
- Optymalizuje zasoby dla produkcji
- Przechowuje build artifacts przez 7 dni

### 4. Deploy (wdrożenie)
- Pobiera build artifacts
- Wdraża na Cloudflare Pages
- Używa environment "production"
- Ustawia deployment URL jako output

## Uruchamianie Deploymentu

Deployment uruchamia się automatycznie przy każdym pushu do brancha `master`:

```bash
git add .
git commit -m "feat: nowa funkcjonalność"
git push origin master
```

## Lokalne Testowanie z Cloudflare

Aby przetestować aplikację lokalnie z Cloudflare Workers runtime:

```bash
# Development z platformProxy
npm run dev

# Build i preview z Wrangler
npm run build
npx wrangler pages dev dist
```

## Monitoring i Logi

- **Deployment logs**: GitHub Actions → Zakładka "Actions"
- **Runtime logs**: Cloudflare Dashboard → Workers & Pages → culturallyai → Logs
- **Analytics**: Cloudflare Dashboard → Workers & Pages → culturallyai → Analytics

## Troubleshooting

### "Invalid binding `SESSION`"
Upewnij się, że KV namespace został utworzony i powiązany z projektem (patrz sekcja "Konfiguracja KV Namespace").

### "No account id found"
Sprawdź czy secret `CLOUDFLARE_ACCOUNT_ID` jest prawidłowo ustawiony w GitHub.

### Deployment failed
1. Sprawdź logi w GitHub Actions
2. Zweryfikuj czy wszystkie sekrety są ustawione
3. Upewnij się, że projekt "culturallyai" istnieje w Cloudflare Pages

## Różnice między Node.js a Cloudflare Adapter

Główne zmiany wprowadzone podczas migracji:

1. **Adapter**: `@astrojs/node` → `@astrojs/cloudflare`
2. **Runtime**: Node.js → Cloudflare Workers (V8 isolates)
3. **Sesje**: W pamięci → Cloudflare KV Storage
4. **Platform Proxy**: Włączone dla lokalnego developmentu
5. **Build Output**: Standalone server → Workers script + Pages assets
6. **Compatibility Flags**: `nodejs_compat` dla React 19 (MessageChannel, Buffer, etc.)

## Kolejne Kroki

1. Skonfiguruj Custom Domain w Cloudflare Pages
2. Rozważ użycie Cloudflare R2 dla storage plików
3. Skonfiguruj Web Analytics dla monitoringu użycia
4. Dodaj alerting dla błędów runtime
