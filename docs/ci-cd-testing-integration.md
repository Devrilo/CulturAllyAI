# GitHub Actions CI/CD Configuration for Testing

This file provides a template for integrating the testing environment with GitHub Actions CI/CD pipeline.

## Workflow Configuration

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [master, main, develop]
  pull_request:
    branches: [master, main, develop]

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests with coverage
        run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: Check coverage thresholds
        run: npm run test:coverage
        env:
          CI: true

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots
          path: test-results/
          retention-days: 7

  accessibility-tests:
    name: Accessibility Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Run accessibility tests
        run: npm run test:e2e -- --grep "accessibility"
        env:
          CI: true

      - name: Upload accessibility report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: accessibility-report
          path: test-results/
          retention-days: 30
```

## Environment Variables

Add these to your GitHub repository secrets:

- `CODECOV_TOKEN` - For coverage reporting (optional)
- `BASE_URL` - Base URL for E2E tests (if different from default)

## Badge Configuration

Add test status badges to your README.md:

```markdown
![Tests](https://github.com/YOUR_USERNAME/CulturAllyAI/workflows/Tests/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/CulturAllyAI/branch/master/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/CulturAllyAI)
```

## Additional Workflows

### Nightly Tests

Create `.github/workflows/nightly.yml` for comprehensive testing:

```yaml
name: Nightly Tests

on:
  schedule:
    - cron: "0 2 * * *" # Run at 2 AM UTC daily
  workflow_dispatch: # Allow manual trigger

jobs:
  full-test-suite:
    name: Full Test Suite
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run all tests
        run: |
          npm run lint
          npm run test:coverage
          npm run test:e2e

      - name: Upload all reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: nightly-reports
          path: |
            coverage/
            playwright-report/
            test-results/
          retention-days: 30
```

## Coverage Requirements

Configure coverage gates in your workflow:

```yaml
- name: Check coverage
  run: |
    npm run test:coverage
    # Fail if coverage below threshold
    node -e "
    const coverage = require('./coverage/coverage-summary.json');
    const threshold = 80;
    const { statements, branches, functions, lines } = coverage.total;
    const metrics = { statements, branches, functions, lines };

    Object.entries(metrics).forEach(([key, value]) => {
      if (value.pct < threshold) {
        console.error(\`Coverage for \${key} (\${value.pct}%) is below threshold (\${threshold}%)\`);
        process.exit(1);
      }
    });
    "
```

## Performance Optimization

Cache Playwright browsers:

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-playwright-
```

## Test Reporting

Use GitHub Actions test reporting:

```yaml
- name: Publish test results
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: Test Results
    path: "test-results/**/*.xml"
    reporter: jest-junit
```

## Manual Test Workflow

Create `.github/workflows/manual-test.yml`:

```yaml
name: Manual Tests

on:
  workflow_dispatch:
    inputs:
      test-type:
        description: "Type of tests to run"
        required: true
        default: "all"
        type: choice
        options:
          - all
          - unit
          - e2e
          - accessibility

jobs:
  run-tests:
    name: Run Selected Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: |
          case "${{ github.event.inputs.test-type }}" in
            unit) npm run test:coverage ;;
            e2e) npm run test:e2e ;;
            accessibility) npm run test:e2e -- --grep "accessibility" ;;
            *) npm run test:coverage && npm run test:e2e ;;
          esac
```

## Deployment Gate

Add test requirement before deployment:

```yaml
deploy:
  name: Deploy to Production
  needs: [unit-tests, e2e-tests, accessibility-tests]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'

  steps:
    - name: Deploy
      run: echo "Deploying to production..."
      # Add your deployment steps here
```

## Next Steps

1. Create `.github/workflows/` directory
2. Add test workflow file
3. Configure repository secrets
4. Enable Actions in repository settings
5. Test workflow with a commit
6. Monitor test results in Actions tab

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [Vitest CI Documentation](https://vitest.dev/guide/ci.html)
