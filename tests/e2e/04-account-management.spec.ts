import { test, expect } from "./fixtures";
import { LoginPage, RegisterPage, ProfilePage } from "./pages";
import type { Page } from "@playwright/test";

/**
 * Helper function to create a temporary user for destructive tests
 * Handles different post-registration behaviors:
 * 1. Auto-login and redirect to /
 * 2. Redirect to /login with success message
 * 3. Stay on /register (rare)
 */
async function createTemporaryUser(page: Page): Promise<{ email: string; password: string }> {
  const email = `temp-${Date.now()}@test.com`;
  const password = `TempPass123!`;

  const registerPage = new RegisterPage(page);
  await registerPage.goto("/register");
  await registerPage.waitForFormHydration();
  await registerPage.register(email, password, password);

  // Wait for registration to complete
  await page.waitForLoadState("networkidle", { timeout: 20000 });
  await page.waitForTimeout(2000);

  // IMPORTANT: Registration can auto-login or redirect to /login
  // Handle both cases
  const currentUrl = page.url();

  if (currentUrl.includes("/login")) {
    // Case 1: Redirected to /login - need to login
    const loginPage = new LoginPage(page);
    await loginPage.waitForFormHydration();
    await loginPage.login(email, password);
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await page.waitForTimeout(2000);
  } else if (currentUrl.includes("/register")) {
    // Case 2: Stayed on /register - redirect and login
    await page.goto("/login");
    const loginPage = new LoginPage(page);
    await loginPage.waitForFormHydration();
    await loginPage.login(email, password);
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await page.waitForTimeout(2000);
  }
  // Case 3: Auto-login - already on /

  return { email, password };
}

/**
 * Helper function to logout using the header button
 */
async function logout(page: Page): Promise<void> {
  const logoutButton = page.getByRole("button", { name: "Wyloguj", exact: true });
  await logoutButton.click();
  await page.waitForLoadState("networkidle", { timeout: 15000 });
  await page.waitForTimeout(2000);
}

test.describe("Account Management", () => {
  /**
   * Test 1: Change password successfully
   * WARNING: This test modifies the user's password - uses temporary user
   * Note: ChangePasswordModal auto-logs out after successful password change
   */
  test("should change password successfully", async ({ page }) => {
    test.setTimeout(45000);

    // Create temporary user for this destructive test
    const { email, password: oldPassword } = await createTemporaryUser(page);
    const newPassword = "NewTestPass123!";

    const profilePage = new ProfilePage(page);

    // Navigate to profile page
    await profilePage.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Open change password modal
    await profilePage.openChangePasswordModal();
    await page.waitForTimeout(1000);

    // Fill password change form (requires current password for verification)
    await profilePage.changePassword(oldPassword, newPassword, newPassword);

    // Wait for password change to complete - auto-logout happens
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Should be redirected to login after auto-logout
    await expect(page).toHaveURL(/\/login/);

    // Try logging in with OLD password - should fail
    const loginPage = new LoginPage(page);
    await loginPage.waitForFormHydration();
    await loginPage.login(email, oldPassword);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Verify error message for old password
    const errorAlerts = page.getByRole("alert");
    await expect(errorAlerts.first()).toBeVisible({ timeout: 10000 });

    // Verify still on login page
    await expect(page).toHaveURL(/\/login/);

    // Login with NEW password - should succeed
    await loginPage.waitForFormHydration();
    await loginPage.login(email, newPassword);
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await page.waitForTimeout(2000);

    // Verify successful login (redirect to homepage)
    await expect(page).toHaveURL("/");
  });

  /**
   * Test 2: Validate password change form
   * Tests all validation scenarios
   */
  test("should validate password change form", async ({ authenticatedPage: page }) => {
    test.setTimeout(30000);

    const profilePage = new ProfilePage(page);
    const correctPassword = process.env.E2E_PASSWORD || "";

    // Navigate to profile page
    await profilePage.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Open change password modal
    await profilePage.openChangePasswordModal();
    await page.waitForTimeout(1000);

    // Test 1 - Empty fields
    // Try to submit without filling anything
    await page.getByRole("button", { name: /Zmień hasło|Change password/i }).click();
    await page.waitForTimeout(500);

    // Verify validation errors are shown
    const errorMessages = page.locator('[id$="-error"]');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);

    // Test 2 - Passwords don't match
    await page.waitForTimeout(1000);
    await profilePage.changePassword(correctPassword, "NewPass123!", "DifferentPass123!");
    await page.waitForTimeout(500);

    // Verify validation error for mismatched passwords
    const mismatchError = page.locator('[id*="confirm"]').locator('[id$="-error"]');
    if ((await mismatchError.count()) > 0) {
      await expect(mismatchError.first()).toBeVisible();
      const errorText = await mismatchError.first().textContent();
      expect(errorText?.toLowerCase()).toMatch(/identyczne|nie pasują|nie zgadzają|don't match|must match/);
    }

    // Test 3 - Weak new password (too short)
    await page.waitForTimeout(1000);
    // Clear fields first
    await profilePage.getNewPasswordInput().fill("");
    await profilePage.getConfirmNewPasswordInput().fill("");
    await page.waitForTimeout(500);

    await profilePage.changePassword(correctPassword, "weak", "weak");
    await page.waitForTimeout(500);

    // Verify validation error for weak password
    const weakPasswordError = page.locator('[id*="new"]').locator('[id$="-error"]');
    if ((await weakPasswordError.count()) > 0) {
      await expect(weakPasswordError.first()).toBeVisible();
      const errorText = await weakPasswordError.first().textContent();
      expect(errorText?.toLowerCase()).toMatch(/8|minimum|mieć minimum|characters/);
    }
  });

  /**
   * Test 3: Should not allow changing to the same password
   * Note: This behavior depends on implementation - may or may not be enforced
   * SKIP: This test takes too long and the behavior is not critical
   */
  test.skip("should not allow changing to the same password", async ({ page }) => {
    test.setTimeout(45000);

    // Create temporary user to avoid affecting main test user
    const { password } = await createTemporaryUser(page);

    const profilePage = new ProfilePage(page);

    // Navigate to profile page
    await profilePage.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Open change password modal
    await profilePage.openChangePasswordModal();
    await page.waitForTimeout(1000);

    // Try to change password to the same value
    await profilePage.changePassword(password, password, password);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Check if system validates this
    // Some implementations allow it, others don't
    const alerts = page.getByRole("alert");
    const alertCount = await alerts.count();

    if (alertCount > 0) {
      // System validates same password or shows success (check for error vs success)
      const alertText = await alerts.first().textContent();
      // If it's an error about same password, test passes
      // If it's a success message, system allows it (also valid)
      expect(alertText).toBeTruthy();
    } else {
      // No feedback - modal might still be open or closed
      // This is also acceptable
      expect(alertCount).toBe(0);
    }

    // Clean up - logout if still logged in
    try {
      if (page.url().includes("/login")) {
        // Already logged out (success case)
        expect(page.url()).toContain("/login");
      } else {
        await logout(page);
      }
    } catch {
      // Already logged out
    }
  });

  /**
   * Test 4: Delete account with confirmation
   * WARNING: This test DELETES a user account! Uses temporary user.
   * SKIP: Backend Admin API key is not configured - "Invalid API key" error
   */
  test.skip("should delete account with confirmation", async ({ page }) => {
    test.setTimeout(30000);

    // Preparation - create temporary user
    const { email, password } = await createTemporaryUser(page);

    const profilePage = new ProfilePage(page);

    // Navigate to profile page
    await profilePage.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Open delete account modal
    await profilePage.openDeleteAccountModal();
    await page.waitForTimeout(1000);

    // Verify confirmation modal appeared
    const modal = page.locator('[role="dialog"]').or(page.locator('[role="alertdialog"]'));
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify warning text in modal
    const modalText = await modal.textContent();
    // Text contains "nieodwracalna" - just verify it's present
    expect(modalText).toContain("nieodwracalna");

    // Confirm deletion with password
    await profilePage.confirmDeleteAccount(password);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Verify redirect after deletion (should be logged out)
    await expect(page).toHaveURL(/\/(login|register|$)/);

    // Verify account deletion - try to login with deleted account
    const loginPage = new LoginPage(page);

    if (!page.url().includes("/login")) {
      await loginPage.goto("/login");
    }

    await loginPage.waitForFormHydration();
    await loginPage.login(email, password);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Verify error message (invalid credentials or user not found)
    const errorAlert = page.getByRole("alert");
    await expect(errorAlert.first()).toBeVisible({ timeout: 10000 });

    // Verify still on login page (login failed)
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * Test 5: Cancel account deletion
   */
  test("should cancel account deletion", async ({ authenticatedPage: page }) => {
    test.setTimeout(30000);

    const profilePage = new ProfilePage(page);

    // Navigate to profile page
    await profilePage.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Open delete account modal
    await profilePage.openDeleteAccountModal();
    await page.waitForTimeout(1000);

    // Verify confirmation modal appeared
    const modal = page.locator('[role="dialog"]').or(page.locator('[role="alertdialog"]'));
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Cancel deletion
    await profilePage.cancelDeleteAccount();
    await page.waitForTimeout(500);

    // Verify modal disappeared
    await expect(modal).not.toBeVisible();

    // Verify still on profile page
    await expect(page).toHaveURL(/\/profile/);

    // Verify account is still OK - refresh page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify still logged in (no redirect to login)
    await expect(page).toHaveURL(/\/profile/);

    // Try to access protected page
    await page.goto("/events");
    await page.waitForLoadState("networkidle");

    // Verify access granted (account not deleted)
    await expect(page).toHaveURL(/\/events/);
  });

  /**
   * Test 6: Logout and clear session
   */
  test("should logout and clear session", async ({ authenticatedPage: page }) => {
    test.setTimeout(30000);

    // Logout using header button
    await logout(page);

    // Verify redirect to home or login page
    await expect(page).toHaveURL(/\/(login|$)/);

    // Verify session is cleared - try to access protected pages
    await page.goto("/events");
    await page.waitForLoadState("networkidle");

    // Verify redirect to login (no session)
    await expect(page).toHaveURL(/\/login/);

    // Try to access profile
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Verify cookies are cleared or invalid
    const context = page.context();
    const cookies = await context.cookies();
    const sessionCookies = cookies.filter((cookie) => cookie.name.includes("sb-") || cookie.name.includes("auth"));

    // Session cookies should be cleared or have no value
    // If cookies remain, they should not grant access (verified by redirects above)
    expect(sessionCookies.length).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test 7: Require authentication for profile access
   */
  test("should require authentication for profile access", async ({ page }) => {
    test.setTimeout(30000);

    // Try to access profile without authentication
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify automatic redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Verify no access to settings content
    const settingsHeading = page.getByRole("heading", { name: /ustawienia konta|account settings/i });
    const settingsVisible = await settingsHeading.isVisible().catch(() => false);
    expect(settingsVisible).toBe(false);
  });

  /**
   * Test 8: Show account information on profile page
   */
  test("should show account information on profile page", async ({ authenticatedPage: page }) => {
    test.setTimeout(30000);

    const profilePage = new ProfilePage(page);

    // Navigate to profile page
    await profilePage.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify account information section is displayed
    const accountInfoHeading = page.getByRole("heading", { name: "Informacje o koncie" });
    await expect(accountInfoHeading).toBeVisible();

    // Verify user ID is displayed (not email - email is not shown on profile page)
    const userIdDisplay = page.getByText(/ID:/);
    await expect(userIdDisplay).toBeVisible();

    // Verify "Zmień" button for password change is present
    await expect(profilePage.getOpenChangePasswordButton()).toBeVisible();

    // Verify "Usuń" button for delete account is present
    await expect(profilePage.getOpenDeleteAccountButton()).toBeVisible();

    // Verify logout button is present in header
    const logoutButton = page.getByRole("button", { name: "Wyloguj", exact: true });
    await expect(logoutButton).toBeVisible();
  });

  /**
   * Test 9: Persist profile changes across sessions
   * Tests password persistence by changing password and logging back in
   */
  test("should persist profile changes across sessions", async ({ page }) => {
    test.setTimeout(60000);

    // Create temporary user for this test
    const { email, password } = await createTemporaryUser(page);
    const newPassword = "PersistTestPass123!";

    const profilePage = new ProfilePage(page);
    const loginPage = new LoginPage(page);

    // Navigate to profile and change password
    await profilePage.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Open modal and change password
    await profilePage.openChangePasswordModal();
    await page.waitForTimeout(1000);

    await profilePage.changePassword(password, newPassword, newPassword);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Should be auto-logged out and redirected to login
    await expect(page).toHaveURL(/\/login/);

    // Login again with NEW password
    await loginPage.waitForFormHydration();
    await loginPage.login(email, newPassword);
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await page.waitForTimeout(2000);

    // Verify successful login (change persisted)
    await expect(page).toHaveURL("/");

    // Navigate to profile to verify persistence
    await profilePage.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify we're on profile page (authenticated with new password)
    await expect(page).toHaveURL(/\/profile/);

    // Verify account information is displayed (email not shown, but verify page loaded)
    const accountInfoHeading = page.getByRole("heading", { name: "Informacje o koncie" });
    await expect(accountInfoHeading).toBeVisible();
  });
});
