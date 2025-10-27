import { test, expect } from "./fixtures";

/**
 * Example E2E Test
 * Demonstrates Playwright setup with accessibility testing
 */

test.describe("Homepage", () => {
  test("should load successfully", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Verify page loaded
    await expect(page).toHaveTitle(/CulturAllyAI/i);
  });

  test("should pass accessibility tests", async ({ page, makeAxeBuilder }) => {
    // Navigate to homepage
    await page.goto("/");

    // Run accessibility scan
    const accessibilityScanResults = await makeAxeBuilder().analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have navigation elements", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Check for main navigation
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });
});

test.describe("Generator Page", () => {
  test("should display event form", async ({ page }) => {
    // Navigate to generator page (assuming root is generator)
    await page.goto("/");

    // Look for form elements
    const form = page.locator("form");
    await expect(form).toBeVisible();
  });
});
