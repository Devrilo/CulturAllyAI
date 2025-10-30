import type { Page } from "@playwright/test";

/**
 * Base Page Object class
 * Provides common functionality for all page objects
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navigate to a specific path
   * @param path - The path to navigate to (e.g., "/login")
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for the page URL to match the expected path
   * @param path - The expected path
   * @param timeout - Maximum time to wait in milliseconds (default: 10000)
   */
  async waitForURL(path: string, timeout = 10000): Promise<void> {
    await this.page.waitForURL(path, { timeout });
  }
}
