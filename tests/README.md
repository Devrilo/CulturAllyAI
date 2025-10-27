# Tests Directory

This directory contains all testing files for the CulturAllyAI application.

## Structure

- `e2e/` - End-to-end tests using Playwright
  - `pages/` - Page Object Model implementations
  - `fixtures.ts` - Custom Playwright fixtures with accessibility testing
- `src/__tests__/` - Unit tests using Vitest
  - `setup.ts` - Global test setup and mocks

## Running Tests

### Unit Tests
```bash
npm test                # Run all unit tests
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Open Vitest UI
npm run test:coverage   # Run tests with coverage report
```

### E2E Tests
```bash
npm run test:e2e        # Run Playwright tests
npm run test:e2e:ui     # Run Playwright tests with UI
npm run test:e2e:debug  # Debug Playwright tests
```

## Guidelines

- Follow the Page Object Model pattern for E2E tests
- Maintain 80% code coverage for validators and services
- Use accessibility testing with @axe-core/playwright
- Mock external services appropriately
- Write descriptive test names using the Arrange-Act-Assert pattern
