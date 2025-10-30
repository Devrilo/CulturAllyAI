import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  private readonly form: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly registerLink: Locator;
  private readonly successAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.getByRole("form", { name: "Formularz logowania" });
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Hasło");
    this.submitButton = page.getByRole("button", { name: "Zaloguj się" });
    // Target the link in footer, not navigation - more specific selector
    this.registerLink = page.getByRole("paragraph").filter({ hasText: "Nie masz konta?" }).getByRole("link");
    this.successAlert = page.getByText("Rejestracja przebiegła pomyślnie");
  }

  async waitForFormHydration(): Promise<void> {
    await this.form.waitFor({ state: "visible" });
    // Wait for submit button to be enabled (sign that React is hydrated)
    await this.submitButton.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000); // Extra time for event handlers to attach
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async clickRegisterLink(): Promise<void> {
    await this.registerLink.click();
  }

  async hasSuccessMessage(): Promise<boolean> {
    return await this.successAlert.isVisible();
  }

  getEmailInput(): Locator {
    return this.emailInput;
  }

  getPasswordInput(): Locator {
    return this.passwordInput;
  }

  getSubmitButton(): Locator {
    return this.submitButton;
  }
}
