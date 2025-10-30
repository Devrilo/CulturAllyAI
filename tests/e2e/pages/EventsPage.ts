import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class EventsPage extends BasePage {
  private readonly eventsList: Locator;
  private readonly emptyStateHeading: Locator;
  private readonly emptyStateButton: Locator;
  private readonly backToGeneratorLink: Locator;
  private readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);
    this.eventsList = page.locator("article").first().locator("..");
    this.emptyStateHeading = page.getByRole("heading", { name: /nie masz jeszcze/i });
    this.emptyStateButton = page.getByRole("link", { name: /wygeneruj pierwsze wydarzenie/i });
    this.backToGeneratorLink = page.getByRole("link", { name: /wygeneruj/i });
    this.loadingSpinner = page.locator(".animate-spin");
  }

  async waitForPageReady(): Promise<void> {
    // Wait for loading spinner to disappear
    await this.page.waitForTimeout(1000);
    const spinnerVisible = await this.loadingSpinner.isVisible().catch(() => false);
    if (spinnerVisible) {
      await this.loadingSpinner.waitFor({ state: "hidden", timeout: 10000 });
    }
    // Additional wait for React Query to settle
    await this.page.waitForTimeout(1000);
  }

  async getEventCards(): Promise<Locator[]> {
    const articles = await this.page.locator("article").all();
    return articles;
  }

  async getEventCardByTitle(title: string): Promise<Locator | null> {
    const card = this.page.locator("article").filter({ hasText: title });
    const count = await card.count();
    return count > 0 ? card.first() : null;
  }

  async hasEmptyState(): Promise<boolean> {
    return await this.emptyStateHeading.isVisible();
  }

  async clickBackToGenerator(): Promise<void> {
    if (await this.hasEmptyState()) {
      await this.emptyStateButton.click();
    } else {
      await this.backToGeneratorLink.click();
    }
  }

  async getEventCount(): Promise<number> {
    const articles = await this.page.locator("article").all();
    return articles.length;
  }

  async deleteEvent(title: string): Promise<void> {
    const card = await this.getEventCardByTitle(title);
    if (!card) return;
    const deleteButton = card.getByRole("button", { name: /usuń/i });
    await deleteButton.click();
    const confirmButton = this.page.getByRole("button", { name: /potwierdź/i });
    await confirmButton.click();
  }

  async copyEventDescription(title: string): Promise<void> {
    const card = await this.getEventCardByTitle(title);
    if (!card) return;
    const copyButton = card.getByRole("button", { name: /kopiuj/i });
    await copyButton.click();
  }

  getEmptyStateHeading(): Locator {
    return this.emptyStateHeading;
  }
}
