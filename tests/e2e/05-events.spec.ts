import { test, expect } from "./fixtures";
import { LoginPage, RegisterPage, GeneratorPage, EventsPage } from "./pages";
import type { Page } from "@playwright/test";

/**
 * Helper function to create a temporary user for tests
 * Handles different post-registration behaviors
 */
async function createTemporaryUser(page: Page): Promise<{ email: string; password: string }> {
  const email = `temp.events.${Date.now()}@test.com`;
  const password = "TempPass123!";

  const registerPage = new RegisterPage(page);
  await registerPage.goto("/register");
  await registerPage.waitForFormHydration();
  await registerPage.register(email, password, password);

  // Wait for registration to complete
  await page.waitForLoadState("networkidle", { timeout: 20000 });
  await page.waitForTimeout(2000);

  // Handle different post-registration scenarios
  const currentUrl = page.url();

  if (currentUrl.includes("/login")) {
    // Redirected to login - need to login
    const loginPage = new LoginPage(page);
    await loginPage.waitForFormHydration();
    await loginPage.login(email, password);
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await page.waitForTimeout(2000);
  } else if (currentUrl.includes("/register")) {
    // Stayed on register - navigate and login
    await page.goto("/login");
    const loginPage = new LoginPage(page);
    await loginPage.waitForFormHydration();
    await loginPage.login(email, password);
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await page.waitForTimeout(2000);
  }
  // Else: Auto-login - already on /

  return { email, password };
}

/**
 * Helper function to generate future dates
 */
function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Helper function to create multiple events
 * IMPORTANT: Uses short keyInformation to avoid AI exceeding 500 char limit
 * IMPORTANT: Uses 90s timeout for AI generation
 */
async function createMultipleEvents(page: Page, count: number): Promise<string[]> {
  const generator = new GeneratorPage(page);
  const titles: string[] = [];

  for (let i = 0; i < count; i++) {
    const title = `Test Event ${i} - ${Date.now()}`;
    titles.push(title);

    await generator.goto("/");
    await generator.fillEventForm({
      title,
      city: "TestCity",
      date: getFutureDate(i + 1),
      category: "Koncerty", // CAPITALIZED! Not "koncerty"
      ageCategory: "Dorośli", // CAPITALIZED! Not "dorośli"
      keyInformation: `Test ${i}`, // SHORT!
    });

    await generator.clickGenerate();
    await generator.waitForDescription(90000); // 90s timeout (not 80s!)
    await generator.clickSave();
    await page.waitForTimeout(2000); // Wait for save to complete
  }

  return titles;
}

test.describe("Events List Management", () => {
  /**
   * Test 1: Display user events list
   * Verifies basic event list display functionality
   */
  test("should display user events list", async ({ authenticatedPage: page }) => {
    test.setTimeout(30000);

    const eventsPage = new EventsPage(page);

    // Navigate to events page
    await eventsPage.goto("/events");
    await page.waitForLoadState("networkidle");
    await eventsPage.waitForPageReady();

    // Verify page loaded
    await expect(page).toHaveURL(/\/events/);

    // Check if there are any events (may be empty for new user)
    const eventCount = await eventsPage.getEventCount();

    if (eventCount > 0) {
      // Verify event cards contain expected elements
      const cards = await eventsPage.getEventCards();
      expect(cards.length).toBeGreaterThan(0);

      // Check first event card structure
      const firstCard = cards[0];
      await expect(firstCard).toBeVisible();

      // Verify card contains article element (semantic HTML)
      const article = firstCard.locator("xpath=self::article | .//article");
      await expect(article).toBeVisible();
    } else {
      // No events - verify empty state (covered in test 2)
      const hasEmpty = await eventsPage.hasEmptyState();
      expect(hasEmpty).toBe(true);
    }
  });

  /**
   * Test 2: Show empty state when no events
   * Uses temporary user to guarantee empty state
   */
  test("should show empty state when no events", async ({ page }) => {
    test.setTimeout(45000);

    // Create temporary user with no events
    await createTemporaryUser(page);

    const eventsPage = new EventsPage(page);

    // Navigate to events page
    await eventsPage.goto("/events");
    await page.waitForLoadState("networkidle");
    await eventsPage.waitForPageReady();

    // Verify empty state is visible
    const hasEmpty = await eventsPage.hasEmptyState();
    expect(hasEmpty).toBe(true);

    // Verify empty state heading
    const emptyHeading = eventsPage.getEmptyStateHeading();
    await expect(emptyHeading).toBeVisible();
    await expect(emptyHeading).toContainText(/nie masz jeszcze/i);

    // Verify link to generator
    const generatorLink = page.getByRole("link", { name: /wygeneruj pierwsze wydarzenie/i });
    await expect(generatorLink).toBeVisible();

    // Click link and verify redirect
    await generatorLink.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/");

    // Verify generator form is visible
    const generator = new GeneratorPage(page);
    await expect(generator.getTitleInput()).toBeVisible();
  });

  /**
   * Test 3: Navigate from events to generator
   * Tests that user can get back to generator from events page
   * Note: Link visibility depends on whether user has events or not
   */
  test("should navigate from events to generator", async ({ authenticatedPage: page }) => {
    test.setTimeout(30000);

    const eventsPage = new EventsPage(page);
    const generator = new GeneratorPage(page);

    // Navigate to events page
    await eventsPage.goto("/events");
    await page.waitForLoadState("networkidle");
    await eventsPage.waitForPageReady();

    // Check if there's a link to generator (exists in empty state or header)
    const generatorLink = page.getByRole("link", { name: /wygeneruj/i }).first();
    const linkCount = await generatorLink.count();

    if (linkCount > 0) {
      // If link exists, click it
      await generatorLink.click();
      await page.waitForLoadState("networkidle");
    } else {
      // If no link (user has events), navigate directly
      await generator.goto("/");
      await page.waitForLoadState("networkidle");
    }

    // Verify we're on generator page
    await expect(page).toHaveURL("/");

    // Verify generator form is visible
    await expect(generator.getTitleInput()).toBeVisible();
    await expect(generator.getGenerateButton()).toBeVisible();
  });

  /**
   * Test 4: Display event details correctly
   * Creates a test event and verifies all details are shown properly
   * IMPORTANT: Uses Kapitalizowane category values!
   */
  test("should display event details correctly", async ({ authenticatedPage: page }) => {
    test.setTimeout(120000);

    const generator = new GeneratorPage(page);
    const eventsPage = new EventsPage(page);

    // Create test event with specific data
    const testTitle = `Detail Test ${Date.now()}`;
    const testCity = "Poznań";
    const testDate = getFutureDate(10);

    await generator.goto("/");
    await generator.fillEventForm({
      title: testTitle,
      city: testCity,
      date: testDate,
      category: "Koncerty", // KAPITALIZACJA!
      ageCategory: "Dorośli", // KAPITALIZACJA!
      keyInformation: "Test detali", // SHORT!
    });

    await generator.clickGenerate();
    await generator.waitForDescription(90000); // 90s timeout
    await generator.clickSave();
    await page.waitForTimeout(2000);

    // Navigate to events page
    await eventsPage.goto("/events");
    await page.waitForLoadState("networkidle");
    await eventsPage.waitForPageReady();

    // Find event by title
    const eventCard = await eventsPage.getEventCardByTitle(testTitle);
    expect(eventCard).not.toBeNull();

    if (eventCard) {
      // Verify card is visible
      await expect(eventCard).toBeVisible();

      // Verify title
      await expect(eventCard).toContainText(testTitle);

      // Verify city
      await expect(eventCard).toContainText(testCity);

      // Verify category label (should contain "Koncerty")
      await expect(eventCard).toContainText(/koncert/i);

      // Verify description is visible (may be truncated)
      const descriptionText = await eventCard.textContent();
      expect(descriptionText).toBeTruthy();
      if (descriptionText) {
        expect(descriptionText.length).toBeGreaterThan(testTitle.length);
      }
    }
  });

  /**
   * Test 5: Require authentication
   * Verifies middleware redirects unauthenticated users
   */
  test("should require authentication", async ({ page }) => {
    test.setTimeout(30000);

    // Try to access /events without authentication
    await page.goto("/events");
    await page.waitForLoadState("networkidle");

    // Verify automatic redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Verify events page content is not accessible
    const eventsHeading = page.getByRole("heading", { name: /wydarzenia|events/i });
    const isVisible = await eventsHeading.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  /**
   * Test 6: Show multiple events
   * Creates 3 events and verifies they all appear in the list
   * IMPORTANT: Long test with 3x AI generation (3x 90s)
   */
  test("should show multiple events", async ({ authenticatedPage: page }) => {
    test.setTimeout(360000); // 6 minutes for 3 generations (120s each)

    const eventsPage = new EventsPage(page);

    // Create 3 test events
    const titles = await createMultipleEvents(page, 3);

    // Navigate to events page
    await eventsPage.goto("/events");
    await page.waitForLoadState("networkidle");
    await eventsPage.waitForPageReady();

    // Verify event count (should have at least 3)
    const eventCount = await eventsPage.getEventCount();
    expect(eventCount).toBeGreaterThanOrEqual(3);

    // Verify all 3 new events are visible
    for (const title of titles) {
      const card = await eventsPage.getEventCardByTitle(title);
      expect(card).not.toBeNull();

      if (card) {
        await expect(card).toBeVisible();
        await expect(card).toContainText(title);
      }
    }

    // Verify getEventCards() returns all cards
    const allCards = await eventsPage.getEventCards();
    expect(allCards.length).toBe(eventCount);
  });

  /**
   * Test 7: Handle long event titles gracefully
   * Tests truncation or wrapping of very long titles
   */
  test("should handle long event titles gracefully", async ({ authenticatedPage: page }) => {
    test.setTimeout(120000);

    const generator = new GeneratorPage(page);
    const eventsPage = new EventsPage(page);

    // Create event with very long title
    const longTitle = `Very Long Event Title That Should Be Truncated Or Wrapped Properly On The Event Card ${Date.now()}`;

    await generator.goto("/");
    await generator.fillEventForm({
      title: longTitle,
      city: "Wrocław",
      date: getFutureDate(5),
      category: "Teatr i taniec",
      ageCategory: "Wszystkie",
      keyInformation: "Długi tytuł", // SHORT to avoid 500 char limit
    });

    await generator.clickGenerate();
    await generator.waitForDescription(90000); // 90s timeout
    await generator.clickSave();
    await page.waitForTimeout(2000);

    // Navigate to events page
    await eventsPage.goto("/events");
    await page.waitForLoadState("networkidle");
    await eventsPage.waitForPageReady();

    // Find event
    const eventCard = await eventsPage.getEventCardByTitle(longTitle);
    expect(eventCard).not.toBeNull();

    if (eventCard) {
      // Verify card is visible and not broken
      await expect(eventCard).toBeVisible();

      // Verify title is present (may be truncated or wrapped)
      const cardText = await eventCard.textContent();
      expect(cardText).toBeTruthy();

      // Title should contain at least the beginning of the long title
      const titleStart = longTitle.substring(0, 30);
      expect(cardText).toContain(titleStart);

      // Verify layout is not broken - card should have reasonable height
      const boundingBox = await eventCard.boundingBox();
      expect(boundingBox).not.toBeNull();
      if (boundingBox) {
        // Card should not be extremely tall (broken layout)
        expect(boundingBox.height).toBeLessThan(1000);
        expect(boundingBox.height).toBeGreaterThan(100);
      }
    }
  });

  /**
   * Test 8: Show events with special characters
   * Tests proper encoding and display of special characters and emojis
   */
  test("should show events with special characters", async ({ authenticatedPage: page }) => {
    test.setTimeout(150000); // 2.5 minutes for AI generation with special chars

    const generator = new GeneratorPage(page);
    const eventsPage = new EventsPage(page);

    // Create event with special characters and emoji
    const specialTitle = `Koncert "Muzyka & Emocje" - 100% 🎵`;
    const specialCity = "Łódź";

    await generator.goto("/");
    await generator.fillEventForm({
      title: specialTitle,
      city: specialCity,
      date: getFutureDate(7),
      category: "Koncerty",
      ageCategory: "Dorośli",
      keyInformation: "Znaki 🎵", // SHORT with emoji
    });

    await generator.clickGenerate();
    await generator.waitForDescription(90000); // 90s timeout
    await generator.clickSave();
    await page.waitForTimeout(2000);

    // Navigate to events page
    await eventsPage.goto("/events");
    await page.waitForLoadState("networkidle");
    await eventsPage.waitForPageReady();

    // Find event
    const eventCard = await eventsPage.getEventCardByTitle(specialTitle);
    expect(eventCard).not.toBeNull();

    if (eventCard) {
      // Verify card is visible
      await expect(eventCard).toBeVisible();

      // Verify special characters are displayed correctly
      const cardText = await eventCard.textContent();
      expect(cardText).toBeTruthy();

      // Check for quotes
      expect(cardText).toContain('"Muzyka & Emocje"');

      // Check for ampersand
      expect(cardText).toContain("&");

      // Check for percentage
      expect(cardText).toContain("100%");

      // Check for emoji (note: may be rendered as unicode)
      expect(cardText).toContain("🎵");

      // Check for Polish characters in city
      expect(cardText).toContain("Łódź");
    }
  });

  /**
   * Test 9: Filter events by category
   * SKIP: Filtering functionality not yet implemented
   * TODO: Implement when filtering feature is added
   */
  test.skip("should filter events by category", async ({ authenticatedPage: page }) => {
    test.setTimeout(30000);

    const eventsPage = new EventsPage(page);

    // Navigate to events page
    await eventsPage.goto("/events");
    await page.waitForLoadState("networkidle");

    // TODO: Implement when FiltersBar component is testable
    // 1. Verify filter UI exists
    // 2. Select category filter
    // 3. Verify only events of that category are shown
    // 4. Change filter
    // 5. Verify different events are shown
  });

  /**
   * Test 10: Edit event inline
   * SKIP: Testing edit functionality requires more setup
   * TODO: Test when edit flow is stabilized
   */
  test.skip("should edit event inline", async ({ authenticatedPage: page }) => {
    test.setTimeout(60000);

    // TODO: Implement full edit test
    // 1. Create test event
    // 2. Navigate to events page
    // 3. Find edit button on event card
    // 4. Click edit
    // 5. Modify description in inline edit area
    // 6. Save changes
    // 7. Verify description was updated

    // Placeholder to satisfy linter
    expect(page).toBeTruthy();
  });

  /**
   * Test 11: Delete event
   * Tests soft delete functionality (saved = false)
   * Note: Full delete requires Admin API key
   */
  test("should soft delete event", async ({ authenticatedPage: page }) => {
    test.setTimeout(180000); // 3 minutes for AI generation + delete

    const generator = new GeneratorPage(page);
    const eventsPage = new EventsPage(page);

    // Create test event to delete
    const deleteTitle = `Delete Test ${Date.now()}`;

    await generator.goto("/");
    await generator.fillEventForm({
      title: deleteTitle,
      city: "Katowice",
      date: getFutureDate(3),
      category: "Festiwale",
      ageCategory: "Młodzi dorośli",
      keyInformation: "Test usuwania", // SHORT
    });

    await generator.clickGenerate();
    await generator.waitForDescription(90000); // 90s timeout
    await generator.clickSave();
    await page.waitForTimeout(2000);

    // Navigate to events page
    await eventsPage.goto("/events");
    await page.waitForLoadState("networkidle");
    await eventsPage.waitForPageReady();

    // Verify event exists
    const eventCard = await eventsPage.getEventCardByTitle(deleteTitle);
    expect(eventCard).not.toBeNull();

    if (eventCard) {
      await expect(eventCard).toBeVisible();

      // Find delete button
      const deleteButton = eventCard.getByRole("button", { name: /usuń/i });
      await expect(deleteButton).toBeVisible();

      // Click delete
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Look for confirmation dialog (if implemented)
      const confirmButton = page.getByRole("button", { name: /potwierdź|tak|usuń/i });
      const confirmCount = await confirmButton.count();

      if (confirmCount > 0) {
        // Confirmation dialog exists - confirm deletion
        await confirmButton.first().click();
      }

      // Wait for deletion to process
      await page.waitForTimeout(2000);

      // Reload page to verify event is gone
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Verify event no longer appears
      const deletedCard = await eventsPage.getEventCardByTitle(deleteTitle);
      expect(deletedCard).toBeNull();
    }
  });
});
