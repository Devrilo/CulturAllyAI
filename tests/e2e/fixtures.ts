import { test as base, type Page } from "@playwright/test";
import type AxeBuilder from "@axe-core/playwright";
import { AxeBuilder as AxeBuilderImpl } from "@axe-core/playwright";
import { config as dotenvConfig } from "dotenv";

// Load .env.test in each test worker process
// This ensures E2E_USERNAME, E2E_PASSWORD, etc. are available in fixtures
dotenvConfig({ path: ".env.test" });

/**
 * Playwright Global Setup and Fixtures
 * Extends base test with accessibility testing utilities
 * and authenticated page fixture
 */

/**
 * Auth fixtures interface
 * - makeAxeBuilder: Factory for accessibility testing
 * - authenticatedPage: Auto-logged-in page ready for testing
 */
export interface AuthFixtures {
  makeAxeBuilder: () => AxeBuilder;
  authenticatedPage: Page;
}

// Extend basic test with fixtures
export const test = base.extend<AuthFixtures>({
  // Accessibility testing fixture
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilderImpl({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .exclude("#commonly-reused-element-with-known-issue");
    await use(makeAxeBuilder);
  },

  // Authenticated page fixture - automatically logs in the test user
  authenticatedPage: async ({ page }, use) => {
    // Get credentials from environment
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    }

    // Navigate to login page
    await page.goto("/login");

    // Wait for React hydration - form must be interactive
    await page.locator('form[aria-label="Formularz logowania"]').waitFor({ state: "visible", timeout: 10000 });
    // Wait for button to be ready AND enabled (not disabled)
    const loginButton = page.getByRole("button", { name: "Zaloguj się" });
    await loginButton.waitFor({ state: "visible", timeout: 10000 });
    // Give extra time for React event handlers to attach
    await page.waitForTimeout(4000);

    // Verify button is not disabled before interacting
    const isDisabled = await loginButton.isDisabled();
    if (isDisabled) {
      await page.waitForTimeout(2000); // Extra wait if still disabled
    }

    // Fill in login form using Polish labels
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Hasło").fill(password);

    // Extra wait before clicking to ensure form is ready
    await page.waitForTimeout(1000);

    // Click login button
    await loginButton.click();

    // Wait for navigation to complete (may include query params)
    // Increase timeout for Supabase auth response
    await page.waitForLoadState("networkidle", { timeout: 45000 });

    // Wait for URL to change away from login page with retry logic
    await page
      .waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15000 })
      .catch(() => {
        // If still on login, it might be slow - give one more chance
        return page.waitForTimeout(3000);
      });

    // Additional wait to ensure navigation is complete
    await page.waitForTimeout(2000);

    // Verify we're on homepage (not login page)
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      // Try to see if there's an error message
      const errorAlert = await page.getByRole("alert").count();
      const errorMessage = errorAlert > 0 ? await page.getByRole("alert").first().textContent() : "No error shown";

      // Also check if button is still loading
      const loadingButton = await page.getByRole("button", { name: /logowanie/i }).count();
      const buttonState = loadingButton > 0 ? "Still loading" : "Not loading";

      throw new Error(
        `Authentication failed - still on login page: ${currentUrl}\nPossible error: ${errorMessage}\nButton state: ${buttonState}\nCredentials: ${email}`
      );
    }

    // Pass authenticated page to test
    await use(page);
  },
});

export { expect } from "@playwright/test";
