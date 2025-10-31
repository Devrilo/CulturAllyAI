# E2E Tests - CI Environment Setup Guide

## Overview
This document explains how environment variables are handled for E2E tests in both local development and CI environments.

## Architecture

### Local Development
```bash
npm run test:e2e
  ↓
playwright test
  ↓ (spawns webServer)
npm run dev:test
  ↓
cross-env ASTRO_ENV=test dotenv -e .env.test -- astro dev --mode test
  ↓
.env.test is loaded → Variables available to Astro server
```

### CI Environment (GitHub Actions)
```bash
Create .env.test from GitHub Secrets
  ↓
npm run test:e2e
  ↓
playwright test
  ↓ (spawns webServer)
npm run dev:test
  ↓
cross-env ASTRO_ENV=test dotenv -e .env.test -- astro dev --mode test
  ↓
.env.test is loaded → Variables available to Astro server
```

## Key Insight

**The `dotenv -e .env.test` command requires the file to exist.** It does NOT inherit from parent process environment variables.

This is why we must create `.env.test` dynamically in CI from GitHub Secrets.

## Required Environment Variables

### For Astro Dev Server (Client & Server)
- `PUBLIC_SUPABASE_URL` - Client-side Supabase URL
- `PUBLIC_SUPABASE_KEY` - Client-side Supabase anon key
- `SUPABASE_URL` - Server-side Supabase URL (same value)
- `SUPABASE_KEY` - Server-side Supabase key (same value)
- `OPENROUTER_API_KEY` - AI generation API key

### For E2E Test Fixtures
- `E2E_USERNAME` - Test user email
- `E2E_PASSWORD` - Test user password
- `E2E_USERNAME_ID` - Test user UUID (for cleanup)

## CI Workflow Setup

### Step 1: Configure GitHub Secrets
Add these secrets in repository settings:
- `TEST_SUPABASE_URL`
- `TEST_SUPABASE_ANON_KEY`
- `TEST_OPENROUTER_API_KEY`
- `E2E_USERNAME`
- `E2E_PASSWORD`
- `E2E_USERNAME_ID`

### Step 2: Create .env.test in Workflow
```yaml
- name: Create .env.test from secrets
  run: |
    echo "PUBLIC_SUPABASE_URL=${{ secrets.TEST_SUPABASE_URL }}" >> .env.test
    echo "PUBLIC_SUPABASE_KEY=${{ secrets.TEST_SUPABASE_ANON_KEY }}" >> .env.test
    echo "SUPABASE_URL=${{ secrets.TEST_SUPABASE_URL }}" >> .env.test
    echo "SUPABASE_KEY=${{ secrets.TEST_SUPABASE_ANON_KEY }}" >> .env.test
    echo "OPENROUTER_API_KEY=${{ secrets.TEST_OPENROUTER_API_KEY }}" >> .env.test
    echo "E2E_USERNAME=${{ secrets.E2E_USERNAME }}" >> .env.test
    echo "E2E_PASSWORD=${{ secrets.E2E_PASSWORD }}" >> .env.test
    echo "E2E_USERNAME_ID=${{ secrets.E2E_USERNAME_ID }}" >> .env.test
```

### Step 3: Run Tests
```yaml
- name: Run E2E tests
  run: npm run test:e2e
```

## Why NOT Use `env` Block?

❌ **This approach does NOT work:**
```yaml
- name: Run E2E tests
  env:
    E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
    # ... other variables
  run: npm run test:e2e
```

**Reason**: Variables in the `env` block are available to the `npm run test:e2e` process, but they are NOT passed to the Astro dev server spawned by Playwright's `webServer` configuration because `dotenv -e .env.test` requires the file to exist.

## Troubleshooting

### Tests Pass Locally But Fail in CI
1. ✅ Verify GitHub Secrets are configured
2. ✅ Check `.env.test` creation step runs before tests
3. ✅ Ensure all 8 variables are written to `.env.test`

### "E2E_USERNAME must be set" Error
- ❌ `.env.test` file doesn't exist or is incomplete
- ❌ `dotenv -e .env.test` command failed to load variables
- ✅ Add debug step to verify file content:
  ```yaml
  - name: Verify .env.test
    run: |
      echo "File exists: $(test -f .env.test && echo 'YES' || echo 'NO')"
      echo "Line count: $(wc -l < .env.test)"
      echo "First 3 lines:"
      head -n 3 .env.test
  ```

### Variables Not Available in Astro Server
- Check `dev:test` command in `package.json` includes `dotenv -e .env.test`
- Verify `playwright.config.ts` uses `npm run dev:test` for `webServer.command`

## Security Notes

- `.env.test` is in `.gitignore` - never commit it
- GitHub Secrets are encrypted and only exposed during workflow execution
- Use dedicated test database and API keys, never production credentials
- Test user should have minimal permissions

## Related Files

- `.github/workflows/test-and-build.yml` - CI workflow with .env.test creation
- `playwright.config.ts` - Playwright config with webServer setup
- `package.json` - Contains `dev:test` script with dotenv-cli
- `tests/e2e/fixtures.ts` - E2E test fixtures reading environment
- `tests/e2e/global-teardown.ts` - Cleanup script reading environment
- `TROUBLESHOOTING_E2E_CI.md` - Detailed investigation history
