# E2E Test Database Cleanup

## Overview

The E2E test suite includes automatic database cleanup to maintain a clean test environment. After all tests complete, the `globalTeardown` script removes test data while preserving the main test user.

## What Gets Cleaned

### 1. Events
- ✅ Events created by temporary test users
- ✅ Guest events (user_id = null)
- ✅ Unsaved events from main test user (saved = false)
- ✅ Recent saved events from main test user (created in last 24 hours)
- ❌ **Preserved:** Older saved events from main test user (>24h old)

### 2. Logs
- ✅ Event management logs from temporary users
- ✅ User activity logs from temporary users
- ❌ **Preserved:** Logs from main test user (E2E_USERNAME_ID)

### 3. Users (Optional)
- ✅ Temporary test users (emails matching: `test-*@*` or `temp-*@*`)
- ❌ **Preserved:** Main test user (E2E_USERNAME_ID)
- ⚠️ **Requires:** `SUPABASE_SERVICE_ROLE_KEY` in `.env.test`

## Configuration

### Required Environment Variables (.env.test)

```env
# Supabase credentials
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_KEY=your-supabase-anon-key

# Main test user (preserved during cleanup)
E2E_USERNAME_ID=user-uuid
E2E_USERNAME=test-user@example.com
E2E_PASSWORD=test-password
```

### Optional: Admin Cleanup (.env.test)

To enable cleanup of temporary test users:

```env
# Get from: Supabase Dashboard → Project Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**⚠️ Security Note:** Never commit the service role key to version control!

## How It Works

### Execution Flow

1. **All E2E tests run** → Create test data (events, users, logs)
2. **Tests complete** → Playwright triggers `globalTeardown`
3. **Cleanup executes** → Removes test data systematically
4. **Output logs** → Shows what was cleaned (with emoji indicators)

### Cleanup Strategy

The teardown follows a safe, progressive approach:

```typescript
// 1. Clean temp user events (keep main user events)
events WHERE user_id != E2E_USERNAME_ID AND user_id IS NOT NULL

// 2. Clean guest events
events WHERE user_id IS NULL

// 3. Clean unsaved events from main user
events WHERE user_id = E2E_USERNAME_ID AND saved = false

// 4. Clean recent saved events from main user (last 24h)
events WHERE user_id = E2E_USERNAME_ID AND saved = true AND created_at >= (NOW() - 24h)

// 5. Clean logs from temp users
event_management_logs WHERE user_id != E2E_USERNAME_ID
user_activity_logs WHERE user_id != E2E_USERNAME_ID

// 6. Clean temporary users (optional, requires service role key)
auth.users WHERE email MATCHES /test-\d+@|temp-\d+@/i AND id != E2E_USERNAME_ID
```

### Output Example

```
🧹 Starting E2E test database cleanup...
✅ Cleaned temp user events
✅ Cleaned guest events
✅ Cleaned unsaved events from main test user
✅ Cleaned recent saved events from main test user
✅ Cleaned event management logs
✅ Cleaned user activity logs
✅ Cleaned 3 temporary test user(s)
✅ Database cleanup completed successfully!
```

## Troubleshooting

### Problem: Cleanup doesn't run

**Solution:** Check that `playwright.config.ts` includes:

```typescript
export default defineConfig({
  globalTeardown: "./tests/e2e/global-teardown.ts",
  // ...
});
```

### Problem: Warning messages during cleanup

**Expected behavior:** Warnings are logged but don't fail the test run.

Example warnings:
- `⚠️ Warning cleaning temp user events: ...` - Some data couldn't be deleted (might already be gone)
- `⚠️ Warning listing users: ...` - Service role key might be invalid

**Action:** Review warnings, but tests will complete successfully.

### Problem: Temporary users not deleted

**Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY`

**Output:**
```
ℹ️  Skipping temporary user cleanup (SUPABASE_SERVICE_ROLE_KEY not configured)
```

**Solution:** 
1. Get service role key from Supabase Dashboard
2. Add to `.env.test`: `SUPABASE_SERVICE_ROLE_KEY=your-key`
3. **Important:** Add `.env.test` to `.gitignore`

### Problem: Main test user data gets deleted

**Should never happen** - The teardown explicitly preserves:
- Main user (E2E_USERNAME_ID)
- Older saved events (>24h) from main user
- Logs from main user

**If it happens:**
1. Check `E2E_USERNAME_ID` matches the actual user UUID
2. Verify the user exists in Supabase Auth
3. Review teardown logs for errors

## Manual Cleanup

If you need to manually clean the database:

```bash
# Run only the teardown script
node -r dotenv/config tests/e2e/global-teardown.ts dotenv_config_path=.env.test
```

Or directly from Supabase SQL Editor:

```sql
-- Delete all events except main test user's old events
DELETE FROM events 
WHERE user_id IS NULL 
   OR (user_id != 'your-test-user-uuid' AND user_id IS NOT NULL)
   OR (user_id = 'your-test-user-uuid' AND saved = false)
   OR (user_id = 'your-test-user-uuid' AND saved = true AND created_at >= NOW() - INTERVAL '24 hours');

-- Delete logs from temp users
DELETE FROM event_management_logs WHERE user_id != 'your-test-user-uuid';
DELETE FROM user_activity_logs WHERE user_id != 'your-test-user-uuid';
```

## Best Practices

### 1. Test Isolation

- Create unique test data per run (use timestamps in emails/titles)
- Don't rely on data from previous test runs
- Use `createTemporaryUser()` helper for destructive tests

### 2. Data Preservation

- Main test user should have a stable, known state
- Don't create permanent data in tests (mark as test data)
- Use `saved = false` for throwaway events

### 3. Performance

- Cleanup runs once after all tests (not after each test)
- Parallel deletes for better performance
- Non-blocking: errors are logged but don't fail the run

### 4. Security

- Never commit `.env.test` with real credentials
- Service role key should only be in local development
- Use separate test database if possible

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  env:
    SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.TEST_SUPABASE_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SERVICE_ROLE_KEY }}
    E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
    E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
    E2E_USERNAME_ID: ${{ secrets.E2E_USERNAME_ID }}
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
  run: npm run test:e2e

# Cleanup runs automatically after tests
# Check logs for cleanup output
```

### Important for CI

1. **Separate test database:** Use dedicated Supabase project for CI
2. **Service role key:** Add to GitHub Secrets for full cleanup
3. **Stable test user:** Create once, don't delete between runs
4. **Monitor cleanup:** Check CI logs for cleanup success/warnings

## FAQ

**Q: Does cleanup run after test failures?**
A: Yes, `globalTeardown` runs regardless of test results.

**Q: Can I disable cleanup?**
A: Remove `globalTeardown` from `playwright.config.ts`, but not recommended.

**Q: What if cleanup fails?**
A: Tests still pass. Errors are logged but don't fail the run. Run manual cleanup if needed.

**Q: How do I verify cleanup worked?**
A: Check Supabase dashboard → Table Editor → events table. Should only have main user's old events.

**Q: Can I customize what gets cleaned?**
A: Yes, edit `tests/e2e/global-teardown.ts` to adjust cleanup logic.

**Q: Why preserve events >24h old?**
A: Prevents accidental deletion of reference data. Adjust the time window as needed.
