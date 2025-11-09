# GitHub Actions Workflows - CulturAllyAI

Ten folder zawiera automatyczne scenariusze CI/CD dla projektu CulturAllyAI.

## 📋 Dostępne Workflows

### 1. Pull Request (`pull-request.yml`)

Automatyczny workflow uruchamiany przy każdym Pull Request do brancha `master`.

**Wykonywane zadania:**
- Lint kodu (ESLint)
- Testy jednostkowe z coverage
- Testy E2E (Playwright)
- Automatyczny komentarz w PR z wynikami testów

### 2. Update CHANGELOG (`update-changelog.yml`)

Workflow do automatycznego generowania wpisów w CHANGELOG.md przy użyciu Gemini Flash AI.

**Wykonywane zadania:**
- Pobiera ostatnie 10 commitów z repozytorium
- Analizuje zmiany przy użyciu Gemini Flash
- Generuje zwięzły wpis w języku polskim
- Aktualizuje plik CHANGELOG.md
- Tworzy nowy branch i Pull Request ze zmianami

**Uruchamianie:** Manualnie z zakładki Actions w GitHub

## 🔑 Wymagane Secrets

Aby workflows działały prawidłowo, musisz skonfigurować następujące sekrety w ustawieniach repozytorium:

### Dla workflow `update-changelog.yml`

#### `GOOGLE_API_KEY`

Klucz API do Google AI Studio wymagany do korzystania z modelu Gemini Flash.

**Jak uzyskać klucz:**

1. Przejdź do [Google AI Studio](https://aistudio.google.com/apikey)
2. Zaloguj się swoim kontem Google
3. Kliknij przycisk **"Get API Key"** lub **"Create API Key"**
4. Skopiuj wygenerowany klucz (zaczyna się od `AIza...`)

**Jak dodać do GitHub Secrets:**

1. Przejdź do ustawień repozytorium: `https://github.com/{owner}/{repo}/settings/secrets/actions`
2. Kliknij **"New repository secret"**
3. Wpisz nazwę: `GOOGLE_API_KEY`
4. Wklej skopiowany klucz API
5. Kliknij **"Add secret"**

⚠️ **Uwaga:** Klucz API z Google AI Studio jest darmowy z limitami:
- 15 requestów na minutę
- 1500 requestów dziennie
- 1 milion tokenów dziennie

Dla większych projektów rozważ płatny Google Cloud API key.

#### `GITHUB_TOKEN`

Token ten jest automatycznie dostarczany przez GitHub Actions - **nie musisz go konfigurować ręcznie**.

Workflow używa tego tokena do:
- Tworzenia nowych branchy
- Commitowania zmian
- Tworzenia Pull Requestów

### Dla workflow `pull-request.yml`

Workflow ten wykorzystuje environment `TEST` z następującymi secretami:
- `SUPABASE_URL` i `SUPABASE_KEY` - dostęp do testowej bazy danych
- `OPENROUTER_API_KEY` - klucz do OpenRouter AI
- `E2E_*` - dane testowe użytkowników

Szczegóły konfiguracji znajdziesz w dokumentacji: `docs/ci-cd-setup.md`

## 🚀 Jak uruchomić Update CHANGELOG

1. Upewnij się, że masz skonfigurowany sekret `GOOGLE_API_KEY` (patrz wyżej)
2. Przejdź do zakładki **Actions** w repozytorium GitHub
3. Wybierz workflow **"Update CHANGELOG"** z lewej strony
4. Kliknij przycisk **"Run workflow"** po prawej stronie
5. Wybierz branch (domyślnie `master`) i kliknij **"Run workflow"**

Workflow:
- Przeanalizuje ostatnie 10 commitów
- Wygeneruje wpis przy użyciu AI
- Utworzy Pull Request z proponowanymi zmianami

6. Sprawdź utworzony PR i zatwierdź go, jeśli zmiany są poprawne

## 📝 Format CHANGELOG

Wpisy w CHANGELOG.md są generowane w formacie:

```markdown
## DD.MM.YYYY - DD.MM.YYYY

- Opis zmiany 1
- Opis zmiany 2
- Opis zmiany 3
```

Jeśli wszystkie commity są z tego samego dnia:

```markdown
## DD.MM.YYYY

- Opis zmiany 1
- Opis zmiany 2
```

## 🔧 Troubleshooting

### Błąd: "GOOGLE_API_KEY not found"

Upewnij się, że:
1. Dodałeś sekret w ustawieniach repozytorium (nie w environment)
2. Nazwa sekretu to dokładnie `GOOGLE_API_KEY` (case-sensitive)
3. Klucz jest prawidłowy i aktywny w Google AI Studio

### Błąd: "Failed to create PR"

Sprawdź czy:
1. Workflow ma odpowiednie uprawnienia (`contents: write`, `pull-requests: write`)
2. Branch protection rules pozwalają na push z Actions
3. `GITHUB_TOKEN` ma wystarczające uprawnienia (powinien mieć automatycznie)

### Workflow nie tworzy PR mimo zmian

Jeśli git nie wykryje zmian w CHANGELOG.md, workflow automatycznie zakończy się bez tworzenia PR. To normalne zachowanie gdy:
- Ostatnie 10 commitów to mergey lub commity bez znaczących zmian
- AI wygenerował identyczny wpis jak już istniejący

## 📚 Dodatkowe Zasoby

- [Dokumentacja GitHub Actions](https://docs.github.com/en/actions)
- [Dokumentacja Gemini API](https://ai.google.dev/docs)
- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
