import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class GeneratorPage extends BasePage {
  private readonly titleInput: Locator;
  private readonly cityInput: Locator;
  private readonly dateInput: Locator;
  private readonly categorySelect: Locator;
  private readonly ageCategorySelect: Locator;
  private readonly keyInformationTextarea: Locator;
  private readonly generateButton: Locator;
  private readonly descriptionPanel: Locator;
  private readonly saveButton: Locator;
  private readonly copyButton: Locator;
  private readonly thumbsUpButton: Locator;
  private readonly thumbsDownButton: Locator;
  private readonly authPrompt: Locator;

  constructor(page: Page) {
    super(page);
    this.titleInput = page.getByLabel("Tytuł wydarzenia");
    this.cityInput = page.getByLabel("Gdzie?");
    this.dateInput = page.getByLabel("Data wydarzenia");
    this.categorySelect = page.locator("#category");
    this.ageCategorySelect = page.locator("#age_category");
    this.keyInformationTextarea = page.getByLabel("Najważniejsze informacje");
    this.generateButton = page.getByRole("button", { name: "Generuj opis" });
    this.descriptionPanel = page.getByRole("region", { name: "Podgląd opisu wydarzenia" });
    this.saveButton = page.getByRole("button", { name: "Zapisz" });
    this.copyButton = page.getByRole("button", { name: "Kopiuj do schowka" });
    this.thumbsUpButton = page.getByRole("button", { name: "Kciuk w górę" });
    this.thumbsDownButton = page.getByRole("button", { name: "Kciuk w dół" });
    this.authPrompt = page.getByText(/Musisz być zalogowany/i);
  }

  async fillEventForm(data: {
    title: string;
    city: string;
    date: string;
    category: string;
    ageCategory: string;
    keyInformation: string;
  }): Promise<void> {
    await this.titleInput.fill(data.title);
    await this.cityInput.fill(data.city);
    await this.dateInput.fill(data.date);

    // Category select - this is a Radix UI combobox, not native select
    await this.categorySelect.click();
    await this.page.waitForTimeout(1000); // Wait for dropdown to fully open
    // Find option that contains the category text (more flexible matching)
    const categoryOption = this.page.getByRole("option").filter({ hasText: new RegExp(data.category, "i") });
    await categoryOption.first().click({ timeout: 10000 });

    // Age category select
    await this.ageCategorySelect.click();
    await this.page.waitForTimeout(1000); // Wait for dropdown to fully open
    // Find option that contains the age category text
    const ageCategoryOption = this.page.getByRole("option").filter({ hasText: new RegExp(data.ageCategory, "i") });
    await ageCategoryOption.first().click({ timeout: 10000 });
    await this.keyInformationTextarea.fill(data.keyInformation);
  }

  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  async waitForDescription(timeout = 60000): Promise<void> {
    await this.descriptionPanel.waitFor({ state: "visible", timeout });
    await this.page.waitForTimeout(1000);
  }

  async getGeneratedDescription(): Promise<string> {
    const descriptionElement = this.descriptionPanel.locator("p").first();
    return (await descriptionElement.textContent()) || "";
  }

  async rateDescription(rating: "positive" | "negative"): Promise<void> {
    const button = rating === "positive" ? this.thumbsUpButton : this.thumbsDownButton;

    // Wait for button to be visible
    await button.waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(1000); // Additional wait for React state update

    // Wait for button to be enabled (retry up to 10 times with 1 second delay)
    let attempts = 0;
    while (attempts < 10) {
      const isDisabled = await button.isDisabled();
      if (!isDisabled) {
        break;
      }
      await this.page.waitForTimeout(1000);
      attempts++;
    }

    await button.click();
  }

  async clickSave(): Promise<void> {
    // Wait for save API response
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/events") && response.request().method() === "POST",
      { timeout: 10000 }
    );

    await this.saveButton.click();

    // Wait for response to complete
    try {
      await responsePromise;
      // Additional wait for UI to update
      await this.page.waitForTimeout(1000);
    } catch {
      // If no API call detected, still wait a bit
      await this.page.waitForTimeout(2000);
    }
  }

  async clickCopy(): Promise<void> {
    await this.copyButton.click();
  }

  async isAuthPromptVisible(): Promise<boolean> {
    return await this.authPrompt.isVisible();
  }

  async hasValidationError(field: string): Promise<boolean> {
    const errorLocator = this.page.locator(`#${field}-error`);
    return await errorLocator.isVisible();
  }

  async getValidationError(field: string): Promise<string> {
    const errorLocator = this.page.locator(`#${field}-error`);
    return (await errorLocator.textContent()) || "";
  }

  getTitleInput(): Locator {
    return this.titleInput;
  }

  getGenerateButton(): Locator {
    return this.generateButton;
  }

  getSaveButton(): Locator {
    return this.saveButton;
  }
}
