import { test, expect } from "./fixtures";
import { RegisterPage, LoginPage, GeneratorPage, EventsPage, ProfilePage } from "./pages";

/**
 * Complete User Journey E2E Tests
 * Tests full end-to-end flows simulating real user scenarios
 * from registration through generation to event management
 */

// Helper functions
function generateUniqueEventData(prefix = "Event") {
  const timestamp = Date.now();
  return {
    title: `${prefix} ${timestamp}`,
    city: ["Warszawa", "Kraków", "Gdańsk", "Wrocław"][Math.floor(Math.random() * 4)],
    date: getFutureDate(Math.floor(Math.random() * 30) + 1),
    category: "Koncerty",
    ageCategory: "Dorośli",
    keyInformation: "Krótki test", // IMPORTANT: Keep short to prevent AI from exceeding 500 chars
  };
}

function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

test.describe("Complete User Journey", () => {
  test("should complete full registration to event save journey", async ({ page }) => {
    // 3 minutes - registration + generation + save
    test.setTimeout(180000);

    // 1. Registration
    const email = `journey-${Date.now()}@test.com`;
    const password = "JourneyTest123!";

    const registerPage = new RegisterPage(page);
    await registerPage.goto("/register");
    await registerPage.waitForFormHydration();
    await registerPage.register(email, password, password);

    // NOTE: Registration may redirect to login or auto-login to home
    // Wait for any navigation and check where we ended up
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    await page.waitForTimeout(2000); // Extra time for any redirects
    const currentUrl = page.url();

    if (currentUrl.includes("/login")) {
      // Redirected to login - verify success message and login
      const loginPage = new LoginPage(page);
      await expect(loginPage.getEmailInput()).toBeVisible();
      const successMessage = await loginPage.hasSuccessMessage();
      expect(successMessage).toBeTruthy();

      // 2. Login
      await loginPage.waitForFormHydration();
      await loginPage.login(email, password);
      await page.waitForURL(/\/$/, { timeout: 30000 });
      await page.waitForLoadState("networkidle");
    } else if (currentUrl.includes("/register")) {
      // Still on register page - manually navigate to login
      const loginPage = new LoginPage(page);
      await loginPage.goto("/login");
      await loginPage.waitForFormHydration();
      await loginPage.login(email, password);
      // Wait for navigation after login
      await page.waitForLoadState("networkidle", { timeout: 30000 });
      // May be on home page or remain on login (with redirect query)
      const postLoginUrl = page.url();
      if (postLoginUrl.includes("/login")) {
        // Navigate manually to home
        await page.goto("/");
        await page.waitForLoadState("networkidle");
      }
    } else {
      // Already logged in and redirected to home
      expect(currentUrl).toContain("/");
    }

    // 3. Generate event
    const generatorPage = new GeneratorPage(page);
    const eventData = {
      title: `Journey Event ${Date.now()}`,
      city: "Gdańsk",
      date: getFutureDate(5),
      category: "Festiwale",
      ageCategory: "Nastolatkowie",
      keyInformation: "Festiwal muzyki", // SHORT to prevent exceeding 500 chars
    };

    await generatorPage.fillEventForm(eventData);
    await generatorPage.clickGenerate();

    // Wait for description (90s timeout for AI)
    await generatorPage.waitForDescription(90000);
    const description = await generatorPage.getGeneratedDescription();
    expect(description.length).toBeGreaterThan(0);

    // 4. Rate description
    await generatorPage.rateDescription("positive");
    // Verify button is pressed
    const thumbsUpButton = page.getByRole("button", { name: "Kciuk w górę" });
    await expect(thumbsUpButton).toHaveAttribute("aria-pressed", "true");

    // 5. Save event
    await generatorPage.clickSave();
    // Wait for success message or navigation
    await page.waitForTimeout(3000);

    // 6. Verify saved event
    await page.goto("/events");
    await page.waitForLoadState("networkidle");

    const eventsPage = new EventsPage(page);
    const eventCard = await eventsPage.getEventCardByTitle(eventData.title);
    expect(eventCard).not.toBeNull();

    if (eventCard) {
      // Verify details
      await expect(eventCard).toContainText(eventData.city);
      await expect(eventCard).toContainText(/festiwal/i);
    }

    // 7. Logout
    await page.goto("/profile");
    const profilePage = new ProfilePage(page);
    await profilePage.clickLogout();

    // Verify redirect (may go to / with message or /login)
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    const finalUrl = page.url();
    // Should be on home page or login page (either is acceptable after logout)
    expect(finalUrl).toMatch(/\/(login)?(\?.*)?$/);
  });

  test("should complete guest user journey", async ({ page }) => {
    // 2 minutes
    test.setTimeout(120000);

    // 1. Go to home page
    const generatorPage = new GeneratorPage(page);
    await generatorPage.goto("/");
    await expect(generatorPage.getTitleInput()).toBeVisible();

    // 2. Generate as guest
    const eventData = generateUniqueEventData("Guest Event");
    await generatorPage.fillEventForm(eventData);
    await generatorPage.clickGenerate();

    // Wait for description (90s timeout for AI)
    await generatorPage.waitForDescription(90000);
    const description = await generatorPage.getGeneratedDescription();
    expect(description.length).toBeGreaterThan(0);

    // 3. Try to rate as guest
    // IMPORTANT: Guests CANNOT rate events (feature only for authenticated users)
    // Check if rating buttons are disabled or show auth prompt
    const thumbsUpButton = page.getByRole("button", { name: "Kciuk w górę" });
    const thumbsUpCount = await thumbsUpButton.count();

    if (thumbsUpCount > 0) {
      // If button exists, it should be disabled or trigger auth prompt
      const isDisabled = await thumbsUpButton.isDisabled().catch(() => false);
      if (!isDisabled) {
        // Click might show auth message
        await thumbsUpButton.click();
        const authPrompt = await generatorPage.isAuthPromptVisible();
        // Either disabled or shows auth prompt
        expect(isDisabled || authPrompt).toBeTruthy();
      }
    }

    // 4. Try to save
    const saveButton = generatorPage.getSaveButton();
    const saveButtonExists = (await saveButton.count()) > 0;

    if (saveButtonExists) {
      // Check if button is disabled (guests cannot save)
      const isDisabled = await saveButton.isDisabled().catch(() => false);
      expect(isDisabled).toBeTruthy();

      // If not disabled, clicking should show auth prompt
      if (!isDisabled) {
        await saveButton.click();
        const authPrompt = await generatorPage.isAuthPromptVisible();
        expect(authPrompt).toBeTruthy();
      }
    }

    // 5. Navigate to registration
    // Either click link in message or go manually
    await page.goto("/register");
    const registerPage = new RegisterPage(page);
    await expect(registerPage.getEmailInput()).toBeVisible();
  });

  test("should create multiple events in one session", async ({ authenticatedPage }) => {
    // 5 minutes - 3 generations
    test.setTimeout(300000);

    const page = authenticatedPage;

    // 1. Preparation
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const generatorPage = new GeneratorPage(page);

    // 2. Event 1 - Concert
    const event1Data = {
      title: `Koncert 1 ${Date.now()}`,
      city: "Warszawa",
      date: getFutureDate(3),
      category: "Koncerty",
      ageCategory: "Dorośli",
      keyInformation: "Krótki test",
    };

    await generatorPage.fillEventForm(event1Data);
    await generatorPage.clickGenerate();
    await generatorPage.waitForDescription(90000);
    const desc1 = await generatorPage.getGeneratedDescription();
    expect(desc1.length).toBeGreaterThan(0);

    // Rate positively
    await generatorPage.rateDescription("positive");
    await page.waitForTimeout(1000);

    // Save
    await generatorPage.clickSave();
    await page.waitForTimeout(3000);

    // 3. Event 2 - Exhibition
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Wait for form to be ready
    await page.waitForTimeout(2000);

    const event2Data = {
      title: `Wystawa 2 ${Date.now()}`,
      city: "Kraków",
      date: getFutureDate(7),
      category: "Sztuka i wystawy",
      ageCategory: "Dzieci",
      keyInformation: "Test 2",
    };

    await generatorPage.fillEventForm(event2Data);
    await generatorPage.clickGenerate();
    await generatorPage.waitForDescription(90000);
    const desc2 = await generatorPage.getGeneratedDescription();
    expect(desc2.length).toBeGreaterThan(0);

    // Save without rating
    await generatorPage.clickSave();
    await page.waitForTimeout(3000);

    // 4. Event 3 - Workshop
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Wait for form to be ready
    await page.waitForTimeout(2000);

    const event3Data = {
      title: `Warsztat 3 ${Date.now()}`,
      city: "Wrocław",
      date: getFutureDate(14),
      category: "Teatr i taniec",
      ageCategory: "Nastolatkowie",
      keyInformation: "Test 3",
    };

    await generatorPage.fillEventForm(event3Data);
    await generatorPage.clickGenerate();
    await generatorPage.waitForDescription(90000);
    const desc3 = await generatorPage.getGeneratedDescription();
    expect(desc3.length).toBeGreaterThan(0);

    // Rate negatively
    await generatorPage.rateDescription("negative");
    await page.waitForTimeout(1000);

    // Save
    await generatorPage.clickSave();
    await page.waitForTimeout(3000);

    // 5. Verification
    await page.goto("/events");
    await page.waitForLoadState("networkidle");

    const eventsPage = new EventsPage(page);

    // Verify all 3 events are on the list
    const event1Card = await eventsPage.getEventCardByTitle(event1Data.title);
    const event2Card = await eventsPage.getEventCardByTitle(event2Data.title);
    const event3Card = await eventsPage.getEventCardByTitle(event3Data.title);

    expect(event1Card).not.toBeNull();
    expect(event2Card).not.toBeNull();
    expect(event3Card).not.toBeNull();

    // Verify titles and cities
    if (event1Card) {
      await expect(event1Card).toContainText(event1Data.city);
    }
    if (event2Card) {
      await expect(event2Card).toContainText(event2Data.city);
    }
    if (event3Card) {
      await expect(event3Card).toContainText(event3Data.city);
    }
  });

  test("should handle navigation between pages during journey", async ({ authenticatedPage }) => {
    // 2 minutes
    test.setTimeout(120000);

    const page = authenticatedPage;

    // 1. Start on generator
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const generatorPage = new GeneratorPage(page);
    const eventData = generateUniqueEventData("Nav Event");

    // Partially fill form
    await generatorPage.getTitleInput().fill(eventData.title);
    await page.getByLabel("Gdzie?").fill(eventData.city);

    // 2. Navigate to events
    await page.goto("/events");
    await page.waitForLoadState("networkidle");

    const eventsPage = new EventsPage(page);
    await expect(page.locator("h1")).toBeVisible();

    // 3. Return to generator
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // NOTE: Form data may NOT persist (no state persistence)
    // Fill form again from scratch
    await generatorPage.fillEventForm(eventData);

    // 4. Generate
    await generatorPage.clickGenerate();
    await generatorPage.waitForDescription(90000);
    const description = await generatorPage.getGeneratedDescription();
    expect(description.length).toBeGreaterThan(0);

    // 5. Navigate to profile
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    // 6. Return and save
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if description is still visible
    const descriptionPanel = page.getByRole("region", { name: "Podgląd opisu wydarzenia" });
    const isVisible = await descriptionPanel.isVisible().catch(() => false);

    if (isVisible) {
      // Description persisted - save
      await generatorPage.clickSave();
      await page.waitForTimeout(3000);
    } else {
      // Need to regenerate
      await generatorPage.fillEventForm(eventData);
      await generatorPage.clickGenerate();
      await generatorPage.waitForDescription(90000);
      await generatorPage.clickSave();
      await page.waitForTimeout(3000);
    }

    // 7. Verify
    await page.goto("/events");
    await page.waitForLoadState("networkidle");

    const eventCard = await eventsPage.getEventCardByTitle(eventData.title);
    expect(eventCard).not.toBeNull();
  });

  test("should recover from errors during journey", async ({ page }) => {
    // 2.5 minutes
    test.setTimeout(150000);

    // 1. Login error
    const loginPage = new LoginPage(page);
    await loginPage.goto("/login");
    await loginPage.waitForFormHydration();

    // Try with wrong credentials
    await loginPage.login("wrong@email.com", "WrongPassword123!");
    await page.waitForTimeout(2000);

    // Verify error (should still be on login page)
    const currentUrl = page.url();
    expect(currentUrl).toContain("/login");

    // Login with correct credentials
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
    }

    await loginPage.login(email, password);
    await page.waitForURL(/\/$/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Verify success
    const generatorPage = new GeneratorPage(page);
    await expect(generatorPage.getTitleInput()).toBeVisible();

    // 2. Form validation error
    // Try to generate without filling form
    await generatorPage.clickGenerate();
    await page.waitForTimeout(2000);

    // Verify validation errors
    const hasErrors =
      (await generatorPage.hasValidationError("title")) || (await generatorPage.hasValidationError("city"));
    expect(hasErrors).toBeTruthy();

    // Fill correctly
    const eventData = generateUniqueEventData("Error Recovery");
    await generatorPage.fillEventForm(eventData);

    // Generate (90s timeout)
    await generatorPage.clickGenerate();
    await generatorPage.waitForDescription(90000);
    const description = await generatorPage.getGeneratedDescription();
    expect(description.length).toBeGreaterThan(0);

    // 3. Save event
    await generatorPage.clickSave();
    await page.waitForTimeout(3000);

    // Verify success (should be saved)
    await page.goto("/events");
    await page.waitForLoadState("networkidle");

    const eventsPage = new EventsPage(page);
    const eventCard = await eventsPage.getEventCardByTitle(eventData.title);
    expect(eventCard).not.toBeNull();
  });
});
