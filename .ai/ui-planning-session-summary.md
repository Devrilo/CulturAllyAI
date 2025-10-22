# Podsumowanie Planowania Architektury UI dla CulturAllyAI MVP

## Decyzje Projektowe

1. **Guest-first approach**: Natychmiastowy dostęp do generatora bez rejestracji, przycisk "Kopiuj" dla wszystkich, CTA do rejestracji po wygenerowaniu

2. **Struktura widoków**: Osobne widoki Generator vs Moje wydarzenia, brak dedykowanego widoku szczegółów

3. **Stany ładowania AI**: Skeleton loader + spinner + "Generowanie..." + disabled form, timeout >10s

4. **Nawigacja**: Sticky header (Logo + Generator + Moje wydarzenia/Login/Register + User menu), burger menu mobile

5. **Formularz**: Liniowe pola bez sekcji - Tytuł → Data → Gdzie? → Kategoria → Dla kogo? → Najważniejsze informacje → Generuj opis, real-time validation

6. **Ocena**: Kciuk↑ (zielony) + Kciuk↓ (czerwony), po ocenie wybrany filled+disabled, niewybrany faded+disabled

7. **Lista wydarzeń**: Tylko zapisane, filtry (kategoria, kat. wiekowa), sortowanie (data utworzenia default), infinite scroll, 20/batch

8. **Edycja opisu**: Pojedyncze pole "Opis", edycja inline (opis→textarea), akcje: Zapisz+Anuluj, bez "Przywróć oryginał"

9. **Obsługa błędów**: Inline (400), toast+redirect (401/403), modal+retry (500/503)

10. **Zarządzanie kontem**: Jedna sekcja z Email+Zmień hasło+Usuń konto, Supabase Auth client-side

11. **Karta wydarzenia**: Tytuł+Meta+Badge+Pełny opis+Akcje (Edytuj/Kopiuj/Usuń z pop-upem), bez wskaźnika oceny

12. **Auth**: Osobne strony, bez wskaźnika siły hasła, bez regulaminu, redirect do generatora, Supabase

13. **Kopiowanie**: Ikona w prawym górnym rogu opisu, toast 2s, bez zmiany ikony

14. **State management**: React useState (local), React Query (server), Supabase SDK (auth), URL params (filtry)

15. **Design**: Zielony #16a34a, Czerwony #dc2626, Inter font, 8px spacing, Lucide icons, top-right toasts (max 3)

## Kluczowe Zalecenia

1. **Separacja funkcji** - Generator vs Lista upraszcza UX i development
2. **Guest access** - Wyższa adoption rate bez barier wejścia
3. **Progressive disclosure** - Zmniejsza cognitive load
4. **Atomic feedback** - Toast/Modal/Inline dla różnych kontekstów
5. **Lean state** - React Query zamiast Redux/Zustand
6. **Native components** - HTML5 gdzie możliwe, minimalne dependencies
7. **Micro-interactions** - Wyższa perceived performance
8. **Defensive UX** - Pop-upy przy destructive actions
9. **Mobile-first** - Touch-friendly (min 44x44px targets)
10. **Optimistic updates** - Immediate UI feedback przed API response

## Architektura UI

### Tech Stack
Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui, React Query, Supabase Auth

### Routes
```
/           Generator (public)
/login      Logowanie
/register   Rejestracja  
/events     Moje wydarzenia (protected)
/settings   Zarządzanie kontem (protected)
```

### Widoki

**Generator (/):**
- Desktop: Formularz (40%) | Podgląd (60%, sticky)
- Mobile: Vertical stack
- Formularz: 7 pól → "Generuj opis"
- Podgląd: Placeholder → Skeleton → Opis + licznik + kciuki (auth) + "Zapisz" (auth) + ikona kopiowania
- Guest: Toast "Zaloguj się aby zapisać/ocenić"

**Moje wydarzenia (/events):**
- Header: Tytuł + licznik + Filtry + Sortowanie
- Infinite scroll (20/batch) z "Load more" fallback
- Karta: Tytuł + Meta + Badge + Pełny opis + [Edytuj] [Kopiuj] [Usuń]
- Edycja inline: Opis → Textarea + [Zapisz] [Anuluj]
- Usuwanie: Modal z potwierdzeniem
- Empty state: Ilustracja + CTA

**Auth (/login, /register):**
- Centered card
- Login: Email + Password + "Zaloguj się"
- Register: Email + Password + Confirm + "Zarejestruj się"
- Supabase SDK, redirect → Generator

**Ustawienia (/settings):**
- Sekcja "Zarządzanie kontem": Email (read-only) + [Zmień hasło] + [Usuń konto]
- Modals dla zmian

### API Integration
```
POST   /api/events              Generowanie
GET    /api/events              Lista
PATCH  /api/events/:id          Ocena/Zapisanie/Edycja
DELETE /api/events/:id          Usunięcie
GET    /api/categories/events   Kategorie
GET    /api/categories/age      Kategorie wiekowe
```

### State Management
```typescript
// Local UI
useState(formData)

// Server (React Query)
useQuery(['events', filters], fetchEvents, { staleTime: 5*60*1000 })
useMutation(saveEvent, { onMutate: optimisticUpdate })

// Auth
useUser() // Supabase wrapper

// URL
useSearchParams() // Filtry, sortowanie
```

### Responsywność
- Mobile <768px: Vertical, full-width, burger menu
- Tablet 768-1024px: 50/50 split
- Desktop ≥1024px: 40/60 split, sticky

### Accessibility (WCAG 2.1 AA)
- Semantic HTML, ARIA labels, keyboard nav, focus states
- Color contrast min 4.5:1
- Form labels + aria-invalid + aria-describedby

### Design System

**Components:**
Button, Input, Textarea, Select, Toast, Modal, Card, EmptyState, Skeleton, Spinner

**Colors:**
- Primary: Blue-600
- Success: Green-600 (#16a34a)
- Error: Red-600 (#dc2626)
- Neutral: Gray-50 to Gray-900

**Typography:**
- Font: Inter (Google Fonts)
- Sizes: text-sm (12px), text-base (14px), text-lg (16px), text-xl (18px), text-2xl (24px)

**Spacing:**
- Base: 8px (Tailwind: space-2, space-4, space-6, space-8)

**Icons:**
- Lucide React (tree-shakeable)

**Toasts:**
- Position: top-right
- Max: 3 simultaneous
- Auto-dismiss: 2-3s
- Closeable: Yes

### Patterns

**Loading:** Skeleton (content), Spinner (actions), Disabled states

**Feedback:** Toast (quick), Modal (destructive), Inline (validation), Animations (scale/fade)

**Validation:** Real-time (char limits), on-blur (format), on-submit (required)

**Performance:** Code splitting, lazy loading, React Query cache (5min), CSS purging
