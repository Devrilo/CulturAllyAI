import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ProfilePage extends BasePage {
  // Main page buttons (open modals)
  private readonly openChangePasswordButton: Locator;
  private readonly openDeleteAccountButton: Locator;
  private readonly logoutButton: Locator;

  // Change Password Modal elements
  private readonly currentPasswordInput: Locator;
  private readonly newPasswordInput: Locator;
  private readonly confirmNewPasswordInput: Locator;
  private readonly submitChangePasswordButton: Locator;

  // Delete Account Modal elements
  private readonly deletePasswordInput: Locator;
  private readonly confirmDeletionCheckbox: Locator;
  private readonly submitDeleteButton: Locator;
  private readonly cancelDeleteButton: Locator;

  // Common elements
  private readonly successMessage: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Main page buttons - these open the modals
    // Security section has "Zmień" and "Usuń" buttons
    this.openChangePasswordButton = page.getByRole("button", { name: "Zmień", exact: true });
    this.openDeleteAccountButton = page.getByRole("button", { name: "Usuń", exact: true });
    this.logoutButton = page.getByRole("button", { name: /Wyloguj|Logout/i });

    // Change Password Modal - fields that appear after clicking "Zmień"
    this.currentPasswordInput = page.locator('input#currentPassword[type="password"]');
    this.newPasswordInput = page.locator('input#newPassword[type="password"]');
    this.confirmNewPasswordInput = page.locator('input#confirmPassword[type="password"]');
    this.submitChangePasswordButton = page.getByRole("button", { name: /Zmień hasło|Change password/i });

    // Delete Account Modal - fields that appear after clicking "Usuń"
    this.deletePasswordInput = page.locator('input#password[type="password"]');
    // Checkbox might be rendered as button with role="checkbox" or as input
    this.confirmDeletionCheckbox = page.locator("#confirmDeletion");
    this.submitDeleteButton = page.getByRole("button", { name: "Usuń konto", exact: true });
    this.cancelDeleteButton = page.getByRole("button", { name: "Anuluj", exact: true });

    // Messages
    this.successMessage = page.locator('[role="alert"]').filter({ hasText: /sukces|success/i });
    this.errorMessage = page.locator('[role="alert"]');
  }

  // Open modals
  async openChangePasswordModal(): Promise<void> {
    await this.openChangePasswordButton.click();
    // Wait for modal to appear
    await this.page.waitForSelector('[role="dialog"]', { state: "visible", timeout: 5000 });
  }

  async openDeleteAccountModal(): Promise<void> {
    await this.openDeleteAccountButton.click();
    // Wait for modal to appear
    await this.page.waitForSelector('[role="dialog"]', { state: "visible", timeout: 5000 });
  }

  // Change password flow
  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmNewPasswordInput.fill(confirmPassword);
    await this.submitChangePasswordButton.click();
  }

  // Delete account flow
  async confirmDeleteAccount(password: string): Promise<void> {
    await this.deletePasswordInput.fill(password);
    // Checkbox is hidden (sr-only), click with force or click the label
    await this.confirmDeletionCheckbox.click({ force: true });
    await this.submitDeleteButton.click();
  }

  async cancelDeleteAccount(): Promise<void> {
    await this.cancelDeleteButton.click();
  }

  async hasSuccessMessage(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }

  async hasErrorMessage(): Promise<boolean> {
    return (await this.errorMessage.count()) > 0;
  }

  // Getters for direct access to elements
  getOpenChangePasswordButton(): Locator {
    return this.openChangePasswordButton;
  }

  getCurrentPasswordInput(): Locator {
    return this.currentPasswordInput;
  }

  getNewPasswordInput(): Locator {
    return this.newPasswordInput;
  }

  getConfirmNewPasswordInput(): Locator {
    return this.confirmNewPasswordInput;
  }

  getOpenDeleteAccountButton(): Locator {
    return this.openDeleteAccountButton;
  }

  getDeletePasswordInput(): Locator {
    return this.deletePasswordInput;
  }

  getConfirmDeletionCheckbox(): Locator {
    return this.confirmDeletionCheckbox;
  }

  // Logout functionality
  async clickLogout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForLoadState("networkidle");
  }
}
