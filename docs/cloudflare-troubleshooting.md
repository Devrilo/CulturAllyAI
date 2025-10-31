# Cloudflare Deployment - Quick Fix Guide

## Problem: Invalid KV namespace ID (placeholder_id)

### Objaw
```
Error 8000022: Invalid KV namespace ID (placeholder_id). 
Not a valid hex string.
```

### Rozwiązanie ✅
KV namespace został usunięty z `wrangler.toml`. Aby skonfigurować sesje:

1. **Wykonaj pierwszy deployment** (bez KV) - to powinno działać
2. **Po deploymencie**, w Cloudflare Dashboard:
   - Workers & Pages → culturallyai
   - Settings → Functions
   - KV namespace bindings → Add binding
   - Variable name: `SESSION`
   - KV namespace: Utwórz nowy "culturallyai-sessions"

### Dlaczego usunęliśmy KV z wrangler.toml?

- Cloudflare Pages wymaga prawdziwego KV namespace ID
- KV namespace tworzy się **po** stworzeniu projektu Pages
- Binding można dodać przez Dashboard bez przebudowy
- To jest zgodne z best practices Cloudflare

---

## Problem: "No account id found"

### Rozwiązanie
Sprawdź GitHub Secrets:
- `CLOUDFLARE_ACCOUNT_ID` musi być ustawiony
- Znajdź w Cloudflare Dashboard → Workers & Pages (prawa kolumna)

---

## Problem: "Authentication failed"

### Rozwiązanie
Zweryfikuj `CLOUDFLARE_API_TOKEN`:
1. Upewnij się, że token ma uprawnienia:
   - Account - Cloudflare Pages: Edit
   - Account - Workers KV Storage: Edit (opcjonalne, dla sesji)
2. Token może wygasnąć - wygeneruj nowy w razie potrzeby

---

## Problem: Build warnings o sharp/imageService

### Objaw
```
Cloudflare does not support sharp at runtime
```

### Rozwiązanie (opcjonalnie)
To jest tylko ostrzeżenie. Jeśli chcesz je usunąć, dodaj do `astro.config.mjs`:

```js
export default defineConfig({
  // ... other config
  image: {
    service: {
      entrypoint: 'astro/assets/services/compile'
    }
  }
})
```

---

## Problem: Zmienne środowiskowe nie działają

### Rozwiązanie
Zmienne muszą być ustawione w **dwóch miejscach**:

1. **GitHub Secrets** (dla CI/CD):
   - Settings → Secrets and variables → Actions
   
2. **Cloudflare Pages** (dla runtime):
   - Dashboard → culturallyai → Settings → Environment variables
   - Dodaj dla środowiska "Production"

Wymagane zmienne:
```
SUPABASE_URL
SUPABASE_KEY
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_KEY
OPENROUTER_API_KEY
```

---

## Szybki Checklist przed Deploymentem

- [ ] Projekt "culturallyai" istnieje w Cloudflare Pages
- [ ] GitHub Secrets ustawione (7 zmiennych)
- [ ] `wrangler.toml` nie zawiera placeholder_id
- [ ] Build lokalnie działa: `npm run build`
- [ ] Wszystkie testy przechodzą: `npm run test:coverage`

---

## Uruchomienie Deploymentu

### Automatyczny (push do master)
```bash
git add .
git commit -m "fix: deployment configuration"
git push origin master
```

### Ręczny (przez GitHub Actions)
1. GitHub → Actions → Production Deployment
2. Run workflow → wybierz branch "master"
3. Run workflow

---

## Weryfikacja Deploymentu

Po udanym deploymencie:
1. Sprawdź URL w GitHub Actions output
2. Zweryfikuj w Cloudflare Dashboard → culturallyai → Deployments
3. Testuj aplikację na deployment URL

## Następne kroki po pierwszym deploymencie

1. ✅ Skonfiguruj KV namespace dla sesji (patrz wyżej)
2. ✅ Dodaj custom domain w Cloudflare Pages
3. ✅ Skonfiguruj Web Analytics
4. ✅ Sprawdź logi w Real-time Logs
