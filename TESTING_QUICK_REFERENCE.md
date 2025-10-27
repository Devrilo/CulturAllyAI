# Testing Quick Reference

## 🚀 Quick Commands

```bash
# Unit Tests
npm test                    # Run all tests
npm run test:watch          # Watch mode - auto-rerun on changes
npm run test:ui             # Visual UI for debugging
npm run test:coverage       # Coverage report

# E2E Tests
npm run test:e2e            # Run E2E tests
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:debug      # Step-by-step debugging
npm run test:e2e:report     # View last test report
```

## 📝 Test File Patterns

- Unit tests: `src/**/*.test.{ts,tsx}`
- E2E tests: `tests/e2e/*.spec.ts`
- Setup: `src/__tests__/setup.ts`
- Mocks: `src/__tests__/mocks/**/*.ts`

## 🎯 Coverage Goals

- **Validators**: 80% minimum
- **Services**: 80% minimum
- **Components**: Test critical functionality
- **Utilities**: Test edge cases

## 💡 Common Patterns

### Unit Test Structure
```typescript
describe("Feature", () => {
  it("should do something", () => {
    // Arrange
    const input = setupTestData();
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Component Test
```typescript
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

it("handles user interaction", async () => {
  const user = userEvent.setup();
  render(<Component />);
  
  await user.click(screen.getByRole("button"));
  
  expect(screen.getByText("Result")).toBeInTheDocument();
});
```

### E2E Test
```typescript
import { test, expect } from "./fixtures";

test("user flow", async ({ page }) => {
  await page.goto("/");
  await page.click('button[type="submit"]');
  await expect(page.locator(".success")).toBeVisible();
});
```

### Mock API
```typescript
import { http, HttpResponse } from "msw";
import { server } from "./__tests__/mocks/handlers";

server.use(
  http.get("/api/data", () => {
    return HttpResponse.json({ data: "mock" });
  })
);
```

## 🔍 Debugging

### Vitest
- Use `it.only()` to run single test
- Use `--no-coverage` for faster runs
- Check browser console with `--browser`

### Playwright
- Use `test.only()` for single test
- Use `--debug` for step-through
- Use `--headed` to see browser

## ⚠️ Common Issues

### Test timeout
```typescript
test("slow operation", async () => {
  // Increase timeout for this test
}, { timeout: 60000 });
```

### Flaky selectors
```typescript
// Bad
await page.click("button");

// Good
await page.click('button[data-testid="submit"]');
```

### Missing cleanup
```typescript
afterEach(() => {
  cleanup(); // React Testing Library
  vi.clearAllMocks(); // Vitest
});
```

## 📚 Documentation

- Full guide: `docs/testing-setup.md`
- Examples: `src/__tests__/example.test.tsx`
- E2E examples: `tests/e2e/example.spec.ts`
