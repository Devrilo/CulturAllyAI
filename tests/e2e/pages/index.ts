import type { Page } from "@playwright/test";

/**
 * Page Object Model Example
 * Encapsulates page interactions for maintainable E2E tests
 */

export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async getTitle() {
    return this.page.title();
  }

  async isNavigationVisible() {
    const nav = this.page.locator("nav");
    return nav.isVisible();
  }
}

export class GeneratorPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async fillEventForm(data: { title: string; description: string }) {
    await this.page.fill('input[name="title"]', data.title);
    await this.page.fill('textarea[name="description"]', data.description);
  }

  async submitForm() {
    await this.page.click('button[type="submit"]');
  }

  async getGeneratedDescription() {
    const description = this.page.locator('[data-testid="generated-description"]');
    return description.textContent();
  }
}
