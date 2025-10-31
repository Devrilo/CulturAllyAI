import { test, expect } from "./fixtures";
import { LoginPage, RegisterPage, ProfilePage } from "./pages";

test.describe("Authentication Flow", () => {
  test("should register new user with valid credentials", async ({ page }) => {
    test.setTimeout(30000);

    const registerPage = new RegisterPage(page);
    const email = `test-${Date.now()}@example.com`;
    const password = "TestPass123!";

    // Navigate to register page
    await registerPage.goto("/register");
    await registerPage.waitForFormHydration();

    // Register new user
    await registerPage.register(email, password, password);

    // Wait for navigation to complete (increased timeout for Supabase)
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Check if there are any error messages on the page
    const errorAlerts = await page.getByRole("alert").count();
    if (errorAlerts > 0) {
      const errorText = await page.getByRole("alert").first().textContent();
      throw new Error(`Registration failed with error: ${errorText}`);
    }

    // Accept redirect to login page OR homepage (if auto-login happens)
    // Use regex to allow query params
    await expect(page).toHaveURL(/\/(login|$)/);
  });

  test("should login with valid credentials", async ({ page }) => {
    test.setTimeout(30000);

    const loginPage = new LoginPage(page);
    const email = process.env.E2E_USERNAME || "";
    const password = process.env.E2E_PASSWORD || "";

    // Navigate to login page
    await loginPage.goto("/login");
    await loginPage.waitForFormHydration();

    // Login with valid credentials
    await loginPage.login(email, password);

    // Wait for navigation to complete (increased timeout for Supabase)
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Verify redirect to homepage (wait for navigation)
    await expect(page).toHaveURL("/");
  });

  test("should show error for invalid login credentials", async ({ page }) => {
    test.setTimeout(30000);

    const loginPage = new LoginPage(page);

    // Navigate to login page
    await loginPage.goto("/login");
    await loginPage.waitForFormHydration();

    // Attempt login with invalid credentials
    await loginPage.login("wrong@email.com", "wrongpassword");

    // Wait for error response and UI update (increased timeout for Supabase)
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Verify error message is displayed - should contain Polish error text
    // Alert should be visible somewhere on the page
    const alerts = page.getByRole("alert");
    await expect(alerts.first()).toBeVisible({ timeout: 10000 });

    // Verify still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should logout successfully", async ({ authenticatedPage: page }) => {
    test.setTimeout(30000);

    const profilePage = new ProfilePage(page);

    // Navigate to profile page
    await profilePage.goto("/profile");

    // Click logout button
    await profilePage.clickLogout();

    // Verify redirect to login page OR homepage (both are valid after logout)
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/(login|$)/);

    // Try to access protected page
    await page.goto("/events");

    // Verify redirect back to login (middleware protection - may have query params)
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect to login when accessing protected page", async ({ page }) => {
    test.setTimeout(30000);

    // Try to access /events (protected)
    await page.goto("/events");

    // Verify automatic redirect to login (may have query params)
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/login/);

    // Try to access /profile (protected)
    await page.goto("/profile");

    // Verify automatic redirect to login (may have query params)
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should persist session across page reloads", async ({ authenticatedPage: page }) => {
    test.setTimeout(30000);

    // Verify starting on homepage
    await expect(page).toHaveURL("/");

    // Reload the page
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Navigate to protected page
    await page.goto("/events");

    // Verify no redirect to login (session persists)
    // Allow query params like ?sort=created_at&order=desc
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/events/);
  });

  test("should navigate between login and register pages", async ({ page }) => {
    test.setTimeout(30000);

    const loginPage = new LoginPage(page);

    // Navigate to login page
    await loginPage.goto("/login");
    await loginPage.waitForFormHydration();

    // Click register link
    await loginPage.clickRegisterLink();

    // Verify redirect to register page
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/register");

    // Wait for register form hydration
    const registerPage = new RegisterPage(page);
    await registerPage.waitForFormHydration();

    // Click login link
    await registerPage.clickLoginLink();

    // Verify redirect back to login page
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/login");
  });

  test("should validate registration form fields", async ({ page }) => {
    test.setTimeout(30000);

    const registerPage = new RegisterPage(page);

    // Navigate to register page
    await registerPage.goto("/register");
    await registerPage.waitForFormHydration();

    // Click submit without filling fields
    await registerPage.getSubmitButton().click();

    // Wait for validation errors
    await page.waitForTimeout(500);

    // Verify validation errors for all fields
    await expect(registerPage.hasValidationError("email")).resolves.toBe(true);
    await expect(registerPage.hasValidationError("password")).resolves.toBe(true);
    await expect(registerPage.hasValidationError("confirmPassword")).resolves.toBe(true);

    // Fill email correctly
    await registerPage.getEmailInput().fill("valid@email.com");

    // Fill password with too short value (less than 8 chars)
    await registerPage.getPasswordInput().fill("Pass1");
    await registerPage.getSubmitButton().click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Verify password validation error (minimum 8 characters)
    await expect(registerPage.hasValidationError("password")).resolves.toBe(true);
    const passwordError = await registerPage.getValidationError("password");
    expect(passwordError.toLowerCase()).toMatch(/8|minimum|mieć minimum/);

    // Fill valid password
    await registerPage.getPasswordInput().fill("ValidPass123!");

    // Fill non-matching confirm password
    await registerPage.getConfirmPasswordInput().fill("DifferentPass123!");
    await registerPage.getSubmitButton().click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Verify passwords don't match error
    await expect(registerPage.hasValidationError("confirmPassword")).resolves.toBe(true);
    const confirmError = await registerPage.getValidationError("confirmPassword");
    expect(confirmError.toLowerCase()).toMatch(/identyczne|nie pasują|nie zgadzają|don't match|must match/);
  });

  test("should show password strength indicator", async ({ page }) => {
    test.setTimeout(30000);

    const registerPage = new RegisterPage(page);

    // Navigate to register page
    await registerPage.goto("/register");
    await registerPage.waitForFormHydration();

    // Fill password with weak value
    await registerPage.getPasswordInput().fill("weak");
    await page.waitForTimeout(300);

    // Verify weak password strength (0-1 points = "Bardzo słabe" or "Słabe")
    let strength = await registerPage.getPasswordStrength();
    expect(strength.toLowerCase()).toMatch(/bardzo słabe|słabe/);

    // Fill password with medium strength (2 points = "Średnie")
    await registerPage.getPasswordInput().fill("password1");
    await page.waitForTimeout(300);

    // Verify medium strength level
    strength = await registerPage.getPasswordStrength();
    expect(strength.toLowerCase()).toMatch(/średnie/);

    // Fill password with strong value (3-4 points = "Silne" or "Bardzo silne")
    await registerPage.getPasswordInput().fill("StrongP@ss123!");
    await page.waitForTimeout(300);

    // Verify strong password strength
    strength = await registerPage.getPasswordStrength();
    expect(strength.toLowerCase()).toMatch(/silne|bardzo silne/);
  });
});
