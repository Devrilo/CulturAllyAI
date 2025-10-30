import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

/**
 * Playwright Global Teardown
 * Cleans up test data after all E2E tests complete
 * Preserves the main test user (E2E_USERNAME_ID) for reuse
 */

// Load test environment variables
dotenv.config({ path: ".env.test" });

async function globalTeardown() {
  // eslint-disable-next-line no-console
  console.log("\n🧹 Starting E2E test database cleanup...");

  const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.PUBLIC_SUPABASE_KEY;
  const mainTestUserId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseKey) {
    // eslint-disable-next-line no-console
    console.error("❌ Missing Supabase credentials in .env.test");
    return;
  }

  if (!mainTestUserId) {
    // eslint-disable-next-line no-console
    console.error("❌ Missing E2E_USERNAME_ID in .env.test");
    return;
  }

  // Create Supabase client for cleanup
  // SERVICE_ROLE_KEY is OPTIONAL - only needed for deleting temporary test users
  // Anon key is sufficient for cleaning events and logs (RLS allows deletion by owner)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cleanupKey = serviceRoleKey || supabaseKey;
  const supabase = createClient(supabaseUrl, cleanupKey);

  if (serviceRoleKey) {
    // eslint-disable-next-line no-console
    console.log("🔑 Using service role key for full database access (including auth.users)");
  } else {
    // eslint-disable-next-line no-console
    console.log("🔑 Using anon key - will skip temporary user cleanup");
  }

  try {
    // 1. Delete ALL events (including main test user's events)
    // This is a dedicated test database - clean everything
    // Use .neq('id', '00000000-0000-0000-0000-000000000000') to match all rows (Supabase requires WHERE clause)
    const { error: eventsError, count: eventsCount } = await supabase
      .from("events")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (eventsError) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  Warning cleaning events: ${eventsError.message}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`✅ Cleaned ${eventsCount || 0} event(s)`);
    }

    // 2. Delete ALL event_management_logs
    const { error: logsError, count: logsCount } = await supabase
      .from("event_management_logs")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (logsError) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  Warning cleaning event logs: ${logsError.message}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`✅ Cleaned ${logsCount || 0} event log(s)`);
    }

    // 3. Delete ALL user_activity_logs
    const { error: activityError, count: activityCount } = await supabase
      .from("user_activity_logs")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (activityError) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  Warning cleaning activity logs: ${activityError.message}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`✅ Cleaned ${activityCount || 0} activity log(s)`);
    }

    // 4. Delete ALL temporary test users (keep only main test user)
    // Note: This requires SUPABASE_SERVICE_ROLE_KEY for auth.users table access
    if (serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      // Get list of all users
      const { data: users, error: usersListError } = await adminClient.auth.admin.listUsers();

      if (usersListError) {
        // eslint-disable-next-line no-console
        console.warn(`⚠️  Warning listing users: ${usersListError.message}`);
      } else if (users && users.users) {
        // Delete ALL users except main test user
        const tempUsers = users.users.filter((user) => user.id !== mainTestUserId);

        let deletedUsersCount = 0;
        for (const user of tempUsers) {
          const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
          if (deleteError) {
            // eslint-disable-next-line no-console
            console.warn(`⚠️  Warning deleting user ${user.email}: ${deleteError.message}`);
          } else {
            deletedUsersCount++;
          }
        }

        if (deletedUsersCount > 0) {
          // eslint-disable-next-line no-console
          console.log(`✅ Cleaned ${deletedUsersCount} temporary test user(s)`);
        }
      }
    } else {
      // eslint-disable-next-line no-console
      console.log("ℹ️  Skipping temporary user cleanup (SUPABASE_SERVICE_ROLE_KEY not configured)");
    }

    // eslint-disable-next-line no-console
    console.log("✅ Database cleanup completed successfully!\n");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Error during database cleanup:", error);
    // Don't throw - we don't want teardown to fail the entire test run
  }
}

export default globalTeardown;
