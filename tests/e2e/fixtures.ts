import { test as base } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Playwright Global Setup and Fixtures
 * Extends base test with accessibility testing utilities
 */

// Extend basic test by providing accessibility testing fixture
export const test = base.extend<{ makeAxeBuilder: () => AxeBuilder }>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .exclude("#commonly-reused-element-with-known-issue");
    await use(makeAxeBuilder);
  },
});

export { expect } from "@playwright/test";
