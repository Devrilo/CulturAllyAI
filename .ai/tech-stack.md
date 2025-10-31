Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Testing - kompleksowe podejście do jakości kodu:

- Vitest + @testing-library/react do testów jednostkowych i integracyjnych (szybkie, natywna integracja z Vite)
- @vitest/coverage-v8 do raportowania pokrycia kodu (min. 80% dla walidatorów i serwisów)
- Playwright do testów end-to-end (wieloprzeglądarkowe: Chrome, Firefox, Safari, Edge)
- @axe-core/playwright do automatyzacji testów dostępności (WCAG 2.1 AA)
- Nock do mockowania HTTP requests w testach Node.js/Astro backend
- msw (Mock Service Worker) do mockowania API w testach komponentów React
- k6 do testów wydajnościowych i load testingu API
- testcontainers-node do izolowanych testów bazy danych PostgreSQL z RLS policies

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszty
- Pozwala na ustawianie limitów finansowych na klucze API

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD (lint → test → e2e → build → deploy)
- Cloudflare Pages (plan Hobby) do hostowania aplikacji z natywnym wsparciem dla Astro SSR
  - Workers Runtime dla API routes i middleware
  - Globalny CDN z zero cold starts
  - Unlimited requests i 100k requests/day dla Workers (plan Free)
  - Automatyczne preview deployments dla każdego pull requesta
  - Brak per-seat pricing - idealne dla rozwijającego się zespołu
  - Integracja z GitHub dla automatic deployments
- Supabase CLI do zarządzania migracjami bazy danych i lokalnym środowiskiem deweloperskim
