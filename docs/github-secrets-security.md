# Bezpieczeństwo GitHub Secrets - FAQ

## ❓ Czy GitHub Secrets są bezpieczne w publicznym repozytorium?

### ✅ **TAK - GitHub Secrets są całkowicie bezpieczne!**

## 🔒 Jak to działa?

### 1. Szyfrowanie
- Wszystkie sekrety są **szyfrowane** algorytmem AES-256-GCM
- Klucze deszyfrujące przechowywane są oddzielnie od samych sekretów
- Nikt (nawet GitHub) nie może odczytać wartości sekretów po ich zapisaniu

### 2. Brak dostępu z kodu
- Sekrety **NIE są dostępne** w kodzie źródłowym
- **NIE pojawiają się** w commitach, PR-ach, issues
- **NIE można** ich odczytać przez GitHub API

### 3. Maskowanie w logach
- Wartości sekretów są **automatycznie maskowane** w logach Actions
- Zamiast wartości zobaczysz: `***`
- Nawet jeśli przypadkowo wyprintujesz sekret, GitHub go ukryje

### 4. Kontrola dostępu
- Sekrety są dostępne **TYLKO** podczas wykonywania workflow
- **NIE są dostępne** w pull requestach z forków (ochrona przed atakami)
- Wymagają uprawnień write do repozytorium

## 📊 Porównanie z innymi metodami

| Metoda | Bezpieczeństwo | Łatwość użycia | CI/CD Ready |
|--------|----------------|----------------|-------------|
| GitHub Secrets | ✅ Bardzo wysokie | ✅ Łatwe | ✅ Tak |
| .env w repo | ❌ NIEBEZPIECZNE | ✅ Łatwe | ❌ Nie |
| .gitignore + .env | ⚠️ Lokalne tylko | ⚠️ Średnie | ❌ Nie |
| Zewnętrzny Vault | ✅ Bardzo wysokie | ❌ Skomplikowane | ⚠️ Wymaga setup |

## 🔑 Jakie klucze używamy?

### TEST_SUPABASE_URL i TEST_SUPABASE_ANON_KEY
- **Czy to wrażliwe?** ⚠️ Częściowo
- **Anon Key** to **klucz publiczny** - jest bezpieczny do użycia w aplikacjach frontend
- Jest przeznaczony do publicznego użycia (dlatego nazwa "anon")
- **RLS (Row Level Security)** w bazie danych chroni dane przed nieautoryzowanym dostępem
- Użytkownik z anon key może **tylko** czytać/zapisywać swoje własne dane

### TEST_OPENROUTER_API_KEY
- **Czy to wrażliwe?** ✅ TAK
- Daje dostęp do API OpenRouter (generowanie opisów AI)
- Może generować koszty (zużycie API)
- **Musi być przechowywany bezpiecznie** - GitHub Secrets idealnie nadają się do tego

### SUPABASE_SERVICE_ROLE_KEY
- **Czy to wrażliwe?** ⚠️ BARDZO! (dlatego go usunęliśmy)
- Ma pełne uprawnienia administratora (bypass RLS)
- Może usuwać użytkowników, modyfikować wszystkie dane
- **Używaliśmy tylko do czyszczenia testowej bazy**
- **Teraz nie jest wymagany** - pipeline działa bez niego!

## 🛡️ Dodatkowe środki bezpieczeństwa

### 1. Użyj oddzielnych projektów Supabase
```
✅ Rekomendowane:
- Projekt testowy dla E2E testów
- Projekt produkcyjny dla aplikacji

⚠️ Akceptowalne dla MVP:
- Ten sam projekt dla testów i produkcji
```

### 2. Ogranicz uprawnienia kluczy OpenRouter
- Ustaw limity finansowe w dashboard OpenRouter
- Monitoruj zużycie API regularnie

### 3. Rotacja kluczy
```bash
# Co jakiś czas (np. co 6 miesięcy):
1. Wygeneruj nowe klucze w Supabase/OpenRouter
2. Zaktualizuj GitHub Secrets
3. Usuń stare klucze
```

## 📚 Materiały źródłowe

- [GitHub Docs - Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Security best practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Supabase - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ Podsumowanie

**GitHub Secrets są standardową i zalecaną praktyką w DevOps:**

- Używane przez **miliony projektów** (w tym największe open source)
- **Bezpieczniejsze** niż alternatywy (pliki .env, zmienne środowiskowe)
- **Łatwe w użyciu** i zarządzaniu
- **Darmowe** dla wszystkich użytkowników GitHub

**W CulturAllyAI używamy tylko:**
- Publicznych kluczy (anon key) - bezpieczne z designu
- Kluczy API z limitami finansowymi (OpenRouter)
- **NIE używamy** service role key (został usunięty!)

## 💡 Pytania?

Jeśli masz wątpliwości:
1. Sprawdź [dokumentację GitHub](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
2. Zobacz, jak robią to duże projekty open source (np. Next.js, React, Vue)
3. Pamiętaj: **szyfrowanie działa** - miliony projektów polega na GitHub Secrets codziennie!
