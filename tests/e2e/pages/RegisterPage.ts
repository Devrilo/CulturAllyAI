import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class RegisterPage extends BasePage {
  private readonly form: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly submitButton: Locator;
  private readonly loginLink: Locator;
  private readonly passwordStrengthText: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.getByRole("form", { name: "Formularz rejestracji" });
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.locator('input#password[type="password"]');
    this.confirmPasswordInput = page.locator('input#confirmPassword[type="password"]');
    this.submitButton = page.getByRole("button", { name: "Utwórz konto" });
    // Target the link in footer, not navigation - more specific selector
    this.loginLink = page.getByRole("paragraph").filter({ hasText: "Masz już konto?" }).getByRole("link");
    this.passwordStrengthText = page.getByText(/Siła hasła:/);
  }

  async waitForFormHydration(): Promise<void> {
    await this.form.waitFor({ state: "visible" });
    // Wait for submit button to be enabled (sign that React is hydrated)
    await this.submitButton.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000); // Extra time for event handlers to attach
  }

  async register(email: string, password: string, confirmPassword: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }

  async clickLoginLink(): Promise<void> {
    await this.loginLink.click();
  }

  async getPasswordStrength(): Promise<string> {
    return (await this.passwordStrengthText.textContent()) || "";
  }

  async hasValidationError(field: "email" | "password" | "confirmPassword"): Promise<boolean> {
    const errorId = `${field === "confirmPassword" ? "confirmPassword" : field}-error`;
    const errorLocator = this.page.locator(`#${errorId}`);
    return await errorLocator.isVisible();
  }

  async getValidationError(field: "email" | "password" | "confirmPassword"): Promise<string> {
    const errorId = `${field === "confirmPassword" ? "confirmPassword" : field}-error`;
    const errorLocator = this.page.locator(`#${errorId}`);
    return (await errorLocator.textContent()) || "";
  }

  getEmailInput(): Locator {
    return this.emailInput;
  }

  getPasswordInput(): Locator {
    return this.passwordInput;
  }

  getConfirmPasswordInput(): Locator {
    return this.confirmPasswordInput;
  }

  getSubmitButton(): Locator {
    return this.submitButton;
  }
}
