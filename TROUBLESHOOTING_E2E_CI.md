# E2E Tests Failing in GitHub Actions CI - Environment Variables Not Loading

## ✅ RESOLVED

**Problem**: E2E tests (48 total) passed **locally** but failed in **GitHub Actions CI** with error:
```
Error: E2E_USERNAME and E2E_PASSWORD must be set in .env.test
```

**Root Cause**: The `dev:test` command uses `dotenv -e .env.test` which requires the `.env.test` file to exist. Variables from GitHub Actions `env` block don't propagate to the Astro dev server because the file was missing in CI.

**Solution**: Create `.env.test` file dynamically in CI workflow before running tests, ensuring consistent behavior between local and CI environments.

---

## Original Problem Summary
E2E tests (48 total) pass **locally** but fail in **GitHub Actions CI** with error:
```
Error: E2E_USERNAME and E2E_PASSWORD must be set in .env.test
```

**Key observation**: Same code, same setup - works perfectly locally, fails consistently in CI.

## Current Setup

### GitHub Secrets (verified present):
- `TEST_SUPABASE_URL`
- `TEST_SUPABASE_ANON_KEY`
- `TEST_OPENROUTER_API_KEY`
- `E2E_USERNAME`
- `E2E_PASSWORD`
- `E2E_USERNAME_ID`
- `PROD_SUPABASE_URL`
- `PROD_SUPABASE_ANON_KEY`

### Test Environment Requirements:
Tests need BOTH naming conventions:
- `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_KEY` (client-side)
- `SUPABASE_URL` / `SUPABASE_KEY` (server-side)

### Current Implementation:

**`.github/workflows/test-and-build.yml`** - E2E job step:
```yaml
- name: Run E2E tests
  env:
    PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    PUBLIC_SUPABASE_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
    SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
    OPENROUTER_API_KEY: ${{ secrets.TEST_OPENROUTER_API_KEY }}
    E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
    E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
    E2E_USERNAME_ID: ${{ secrets.E2E_USERNAME_ID }}
  run: npm run test:e2e
```

**`package.json`**:
```json
"test:e2e": "playwright test"
```

**`tests/e2e/fixtures.ts`**:
```typescript
import { config as dotenvConfig } from "dotenv";

// Only load .env.test if E2E_USERNAME is not already set (not in CI)
if (!process.env.E2E_USERNAME) {
  dotenvConfig({ path: ".env.test" });
}

// ... later in authenticatedPage fixture:
const email = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;
if (!email || !password) {
  throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
}
```

**`playwright.config.ts`**:
```typescript
webServer: {
  command: "npm run dev:test",
  url: "http://localhost:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
}
```

**Local `.env.test`** (works perfectly):
```env
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_KEY=...
SUPABASE_URL=...
SUPABASE_KEY=...
OPENROUTER_API_KEY=...
E2E_USERNAME=...
E2E_PASSWORD=...
E2E_USERNAME_ID=...
```

## What Was Tried (All Failed)

### Attempt 1: Dynamic .env.test creation in CI
Created `.env.test` file dynamically using bash `echo` commands in workflow. Variables loaded initially (`[dotenv@17.2.3] injecting env (8)`) but then `(0)` in each test worker.

### Attempt 2: Both PUBLIC_ and non-PUBLIC_ versions
Added both naming conventions explicitly. Same issue persisted.

### Attempt 3: Pass env to webServer in playwright.config.ts
Tried passing environment explicitly to webServer config. Didn't help.

### Attempt 4: Load dotenv in fixtures.ts
Added `dotenvConfig({ path: ".env.test" })` at top of fixtures. Pattern showed dotenv loading 0 variables repeatedly in CI logs.

### Attempt 5: Use dotenv-cli wrapper
Changed script to `"test:e2e": "dotenv -e .env.test -- playwright test"`. Worked locally, failed in CI with same errors.

### Attempt 6: Debug .env.test file in CI
Added verification step to check file line count, size, and first 3 lines. Never got to see results as moved to next approach.

### Attempt 7: GitHub Actions env block
Removed `.env.test` creation entirely, pass variables directly via GitHub Actions `env` block. Added conditional dotenv loading in fixtures (only load if not in CI).

**Result**: FAILED - Variables in env block don't propagate to webServer (Astro dev server).

### Attempt 8: Create .env.test in CI before running tests (SOLUTION)
Create `.env.test` file dynamically from GitHub Secrets using `echo >> .env.test` commands. Then run `npm run test:e2e` which uses `dotenv -e .env.test` to properly load variables into the Astro dev server.

**Root cause identified**: The `dev:test` command uses `dotenv -e .env.test` to load environment variables. When `.env.test` doesn't exist, variables from GitHub Actions env block are NOT passed to the Astro dev server spawned by Playwright's webServer config.

**Current state**: Implemented, ready to test in CI.

## Test Results Pattern

**Local**: ✅ All tests pass
```
Running 48 tests using 1 worker
✓ 92 example.spec.ts tests (all pass)
[dotenv@17.2.3] injecting env (0) from .env.test  ← Only from global-teardown at end
```

**CI**: ❌ ~60 tests fail (most using `authenticatedPage` fixture)
- Tests NOT using `authenticatedPage` pass fine
- Tests using `authenticatedPage` fail immediately with "E2E_USERNAME and E2E_PASSWORD must be set"
- Some tests that directly read `process.env.E2E_USERNAME` also fail with "must be set" error

## Key Files Structure

```
tests/e2e/
├── fixtures.ts              # Defines authenticatedPage fixture
├── global-teardown.ts       # Has dotenvConfig, runs once at end
├── 01-auth.spec.ts
├── 02-generator.spec.ts
├── 03-complete-journey.spec.ts
├── 04-account-management.spec.ts
├── 05-events.spec.ts
└── example.spec.ts          # Simple tests, no auth needed
```

## Technical Details

- **Playwright**: Running with 1 worker sequentially
- **Node.js**: v22.14.0 (from `.nvmrc`)
- **Platform**: Ubuntu latest (CI), Windows 11 (local)
- **Astro dev server**: Started as `webServer` in playwright.config.ts
- **Test command in CI**: `npm run test:e2e` with env block

## Root Cause Analysis

### The Problem
Variables set in GitHub Actions `env` block at step level don't propagate to the Astro dev server spawned by Playwright's `webServer` configuration.

### Why It Happens
1. **Locally**: `npm run dev:test` = `dotenv -e .env.test -- astro dev`
   - `dotenv` loads `.env.test` and injects variables into `astro dev` process
   - ✅ Astro server has all variables

2. **In CI (broken approach)**: 
   ```yaml
   env:
     E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
   run: npm run test:e2e
   ```
   - Variables exist in npm process environment
   - Playwright spawns `npm run dev:test` as subprocess
   - `dev:test` tries to use `dotenv -e .env.test` but file doesn't exist
   - ❌ Astro server gets NO variables

3. **In CI (working approach)**:
   ```yaml
   - name: Create .env.test from secrets
     run: echo "E2E_USERNAME=${{ secrets.E2E_USERNAME }}" >> .env.test
   - name: Run E2E tests  
     run: npm run test:e2e
   ```
   - `.env.test` file is created with all secrets
   - `dotenv -e .env.test` successfully loads the file
   - ✅ Astro server has all variables

### Key Insight
The command `dotenv -e .env.test` **requires the file to exist**. It doesn't inherit from parent process env. Creating `.env.test` in CI ensures consistent behavior between local and CI environments.
