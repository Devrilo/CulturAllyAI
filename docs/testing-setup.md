# Testing Environment Setup Documentation

This document describes the testing infrastructure for CulturAllyAI.

## Overview

The project uses a comprehensive testing approach:
- **Vitest** for unit and integration tests
- **Playwright** for end-to-end tests
- **@testing-library/react** for component testing
- **@axe-core/playwright** for accessibility testing
- **MSW** for mocking API requests
- **Nock** for mocking HTTP requests in Node.js
- **Testcontainers** for isolated database testing

## Test Structure

```
.
├── src/
│   └── __tests__/
│       ├── setup.ts           # Global test setup
│       └── *.test.{ts,tsx}    # Unit tests
├── tests/
│   ├── e2e/
│   │   ├── fixtures.ts        # Playwright fixtures
│   │   ├── pages/             # Page Object Models
│   │   └── *.spec.ts          # E2E tests
│   └── README.md
├── vitest.config.ts           # Vitest configuration
└── playwright.config.ts       # Playwright configuration
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run in watch mode
npm run test:watch

# Open Vitest UI
npm run test:ui

# Run with coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Configuration

### Vitest (vitest.config.ts)

- **Environment**: jsdom for DOM testing
- **Coverage**: 80% threshold for lines, functions, branches, and statements
- **Setup**: Global mocks for window.matchMedia, IntersectionObserver, ResizeObserver
- **Path Aliases**: Configured to match tsconfig.json (@/ -> ./src/)

### Playwright (playwright.config.ts)

- **Browser**: Chromium only (Desktop Chrome)
- **Base URL**: http://localhost:4321
- **Features**: 
  - Automatic dev server startup
  - Trace on first retry
  - Screenshots and videos on failure
  - HTML and JSON reporting

## Writing Tests

### Unit Tests Example

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Component", () => {
  it("should render correctly", () => {
    render(<Component />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

### E2E Tests Example

```typescript
import { test, expect } from "./fixtures";

test("should pass accessibility check", async ({ page, makeAxeBuilder }) => {
  await page.goto("/");
  const results = await makeAxeBuilder().analyze();
  expect(results.violations).toEqual([]);
});
```

### Page Object Model Example

```typescript
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}
```

## Coverage Requirements

According to project guidelines:
- Minimum 80% coverage for validators and services
- Focus on meaningful tests over arbitrary coverage percentages
- Use coverage reports to identify untested critical paths

## Mocking Strategies

### API Mocking with MSW

```typescript
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.get("/api/events", () => {
    return HttpResponse.json([{ id: 1, title: "Event" }]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Function Mocking with Vitest

```typescript
import { vi } from "vitest";

// Mock a function
const mockFn = vi.fn();

// Spy on existing function
const spy = vi.spyOn(object, "method");

// Mock module
vi.mock("@/lib/services/events", () => ({
  getEvents: vi.fn(() => Promise.resolve([])),
}));
```

## Accessibility Testing

All E2E tests include accessibility fixtures using @axe-core/playwright:

```typescript
test("accessibility", async ({ page, makeAxeBuilder }) => {
  await page.goto("/");
  const results = await makeAxeBuilder().analyze();
  expect(results.violations).toEqual([]);
});
```

## CI/CD Integration

Tests are designed to run in CI environments:
- Playwright retries failed tests 2x on CI
- No parallel execution on CI for consistency
- JSON reports for integration with CI tools

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Early Returns**: Handle error cases first
4. **Isolation**: Each test should be independent
5. **Realistic Mocks**: Mock external dependencies realistically
6. **Type Safety**: Maintain TypeScript types in tests
7. **Accessibility**: Include accessibility checks in E2E tests

## Troubleshooting

### Tests Running Slowly
- Use `test.only()` to focus on specific tests
- Check for unnecessary `await` statements
- Ensure proper cleanup in afterEach hooks

### Flaky E2E Tests
- Use `page.waitForSelector()` instead of arbitrary timeouts
- Check for race conditions
- Use `{ strict: true }` in locators for unique elements

### Coverage Not Meeting Threshold
- Run `npm run test:coverage` to see detailed report
- Focus on validators and services first
- Consider if all code needs 80% coverage or just critical paths

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Axe Accessibility](https://github.com/dequelabs/axe-core)
