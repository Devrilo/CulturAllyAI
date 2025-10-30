-- ============================================================================
-- Migration: Add Row Level Security to Logs Tables
-- Created: 2025-10-30 12:00:00 UTC
-- Author: Database Migration Script
-- 
-- Purpose:
--   This migration adds Row Level Security (RLS) policies to the audit log
--   tables (user_activity_logs and event_management_logs) to ensure proper
--   data isolation and prevent unauthorized access to audit trails.
--
-- Changes:
--   1. Enable RLS on user_activity_logs table
--   2. Enable RLS on event_management_logs table
--   3. Add INSERT-only policies for authenticated users (append-only logs)
--   4. Add SELECT policies allowing users to view only their own logs
--   5. Block all UPDATE and DELETE operations (immutable audit logs)
--   6. Block all access for anonymous users (logs require authentication)
--
-- Tables Modified:
--   - user_activity_logs: RLS enabled with policies
--   - event_management_logs: RLS enabled with policies
--
-- Design Principles:
--   - Audit logs are append-only (no updates or deletes allowed)
--   - Users can only view their own activity logs
--   - Anonymous users cannot access any logs (logs require authentication)
--   - INSERT is allowed for authenticated users to log their own actions
--
-- Impact on Existing Code:
--   - No breaking changes - existing INSERT operations will continue to work
--   - Logs from deleted users (user_id = NULL) will not be visible to anyone
--     except through admin/service role queries
--   - Guest users (unauthenticated) are already not logging actions, so
--     blocking anon role access does not affect functionality
-- ============================================================================

-- ============================================================================
-- Section 1: Enable RLS on Audit Tables
-- ============================================================================

-- Enable RLS on user_activity_logs
-- This ensures users can only access their own activity logs
alter table user_activity_logs enable row level security;

-- Enable RLS on event_management_logs
-- This ensures users can only access their own event management logs
alter table event_management_logs enable row level security;

-- ============================================================================
-- Section 2: RLS Policies for user_activity_logs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS Policy: Authenticated users can insert their own activity logs (INSERT)
-- Scope: authenticated role
-- 
-- Purpose:
--   Allows authenticated users to create audit log entries for their own actions
-- 
-- Logic:
--   WITH CHECK ensures that the user_id being inserted matches the currently
--   authenticated user's ID (auth.uid()), preventing users from creating logs
--   on behalf of other users
--
-- Use cases:
--   - POST /api/auth/activity - user logs their own login/logout/etc
--   - POST /api/auth/delete-account - user logs account deletion before removal
-- ----------------------------------------------------------------------------
create policy "Authenticated users can insert own activity logs"
  on user_activity_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policy: Authenticated users can view their own activity logs (SELECT)
-- Scope: authenticated role
-- 
-- Purpose:
--   Allows authenticated users to view their own activity history
-- 
-- Logic:
--   USING clause checks that the user_id matches the authenticated user's ID
--   This prevents users from viewing other users' activity logs
--
-- Use cases:
--   - Future feature: User activity history page
--   - Admin dashboard showing user's own recent actions
-- ----------------------------------------------------------------------------
create policy "Authenticated users can view own activity logs"
  on user_activity_logs for select
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policy: Block all UPDATE operations on activity logs
-- Scope: all roles
-- 
-- Purpose:
--   Ensures audit logs are immutable (cannot be modified after creation)
-- 
-- Logic:
--   USING (false) blocks all UPDATE attempts, regardless of user or role
--   This is critical for maintaining audit trail integrity
--
-- Design rationale:
--   Audit logs must be append-only to prevent tampering with historical records
-- ----------------------------------------------------------------------------
create policy "Activity logs are immutable"
  on user_activity_logs for update
  to authenticated
  using (false);

-- ----------------------------------------------------------------------------
-- RLS Policy: Block all DELETE operations on activity logs
-- Scope: all roles
-- 
-- Purpose:
--   Ensures audit logs cannot be deleted by users
-- 
-- Logic:
--   USING (false) blocks all DELETE attempts, regardless of user or role
--   This is critical for maintaining audit trail integrity
--
-- Design rationale:
--   Audit logs must be permanent to comply with audit requirements
-- ----------------------------------------------------------------------------
create policy "Activity logs cannot be deleted"
  on user_activity_logs for delete
  to authenticated
  using (false);

-- ----------------------------------------------------------------------------
-- RLS Policy: Anonymous users cannot access activity logs (all operations)
-- Scope: anon role
-- 
-- Purpose:
--   Explicitly denies unauthenticated users from accessing activity logs
-- 
-- Logic:
--   Returns false for all operations, effectively blocking all access
--   This is a security measure to ensure only authenticated users can
--   interact with audit logs
--
-- Design rationale:
--   Activity logs contain sensitive information about user actions
--   Guest users don't have user_id, so they cannot create or view logs
-- ----------------------------------------------------------------------------
create policy "Anonymous users cannot access activity logs"
  on user_activity_logs for all
  to anon
  using (false);

-- ============================================================================
-- Section 3: RLS Policies for event_management_logs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS Policy: Authenticated users can insert their own event logs (INSERT)
-- Scope: authenticated role
-- 
-- Purpose:
--   Allows authenticated users to create audit log entries for their event actions
-- 
-- Logic:
--   WITH CHECK ensures that the user_id being inserted matches the currently
--   authenticated user's ID (auth.uid()), preventing users from creating logs
--   on behalf of other users
--
-- Use cases:
--   - events.service.ts - logging event_created, event_saved, event_edited, event_deleted
-- ----------------------------------------------------------------------------
create policy "Authenticated users can insert own event logs"
  on event_management_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policy: Authenticated users can view their own event logs (SELECT)
-- Scope: authenticated role
-- 
-- Purpose:
--   Allows authenticated users to view their own event management history
-- 
-- Logic:
--   USING clause checks that the user_id matches the authenticated user's ID
--   This prevents users from viewing other users' event management logs
--
-- Use cases:
--   - Future feature: Event edit history page
--   - Analytics showing user's event management patterns
-- ----------------------------------------------------------------------------
create policy "Authenticated users can view own event logs"
  on event_management_logs for select
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policy: Block all UPDATE operations on event logs
-- Scope: all roles
-- 
-- Purpose:
--   Ensures audit logs are immutable (cannot be modified after creation)
-- 
-- Logic:
--   USING (false) blocks all UPDATE attempts, regardless of user or role
--   This is critical for maintaining audit trail integrity
--
-- Design rationale:
--   Audit logs must be append-only to prevent tampering with historical records
-- ----------------------------------------------------------------------------
create policy "Event logs are immutable"
  on event_management_logs for update
  to authenticated
  using (false);

-- ----------------------------------------------------------------------------
-- RLS Policy: Block all DELETE operations on event logs
-- Scope: all roles
-- 
-- Purpose:
--   Ensures audit logs cannot be deleted by users
-- 
-- Logic:
--   USING (false) blocks all DELETE attempts, regardless of user or role
--   This is critical for maintaining audit trail integrity
--
-- Design rationale:
--   Audit logs must be permanent to comply with audit requirements
-- ----------------------------------------------------------------------------
create policy "Event logs cannot be deleted"
  on event_management_logs for delete
  to authenticated
  using (false);

-- ----------------------------------------------------------------------------
-- RLS Policy: Anonymous users cannot access event logs (all operations)
-- Scope: anon role
-- 
-- Purpose:
--   Explicitly denies unauthenticated users from accessing event management logs
-- 
-- Logic:
--   Returns false for all operations, effectively blocking all access
--   This is a security measure to ensure only authenticated users can
--   interact with audit logs
--
-- Design rationale:
--   Event logs contain sensitive information about user actions
--   Guest users don't create logs (intentionally skipped in code), so
--   they don't need access to this table
-- ----------------------------------------------------------------------------
create policy "Anonymous users cannot access event logs"
  on event_management_logs for all
  to anon
  using (false);

-- ============================================================================
-- Section 4: Important Notes on Logs with NULL user_id
-- ============================================================================
-- 
-- After user account deletion, user_id in logs is set to NULL due to:
--   ON DELETE SET NULL foreign key constraint
-- 
-- Behavior with new RLS policies:
--   - Logs with user_id = NULL will NOT be visible to any authenticated user
--     (including the deleted user if they recreate their account)
--   - These logs can only be accessed using service role key (supabaseAdmin)
--   - This is intentional for privacy and security
-- 
-- If you need to query logs from deleted users for analytics:
--   - Use service role key (bypasses RLS)
--   - Create a separate admin API endpoint with appropriate authorization
--   - Consider data retention policies for GDPR compliance
-- ============================================================================

-- ============================================================================
-- Migration Verification
-- ============================================================================
-- 
-- After running this migration, verify the following:
-- 
-- 1. RLS is enabled on both tables:
--    select tablename, rowsecurity 
--    from pg_tables 
--    where schemaname = 'public' 
--      and tablename in ('user_activity_logs', 'event_management_logs');
--    
--    Expected: rowsecurity = true for both tables
-- 
-- 2. Policies are in place:
--    select schemaname, tablename, policyname, permissive, roles, cmd
--    from pg_policies 
--    where tablename in ('user_activity_logs', 'event_management_logs')
--    order by tablename, policyname;
-- 
-- 3. Test authenticated user can insert own log:
--    -- As authenticated user (should succeed):
--    insert into user_activity_logs (user_id, action_type) 
--    values (auth.uid(), 'login');
-- 
-- 4. Test authenticated user cannot insert other user's log:
--    -- As authenticated user (should fail):
--    insert into user_activity_logs (user_id, action_type) 
--    values ('00000000-0000-0000-0000-000000000000', 'login');
-- 
-- 5. Test authenticated user can view own logs:
--    -- As authenticated user (should return only their logs):
--    select * from user_activity_logs where user_id = auth.uid();
-- 
-- 6. Test authenticated user cannot update logs:
--    -- As authenticated user (should fail):
--    update user_activity_logs set action_type = 'logout' where user_id = auth.uid();
-- 
-- 7. Test authenticated user cannot delete logs:
--    -- As authenticated user (should fail):
--    delete from user_activity_logs where user_id = auth.uid();
-- 
-- 8. Test anonymous user cannot access logs:
--    -- As anon user (should fail all operations):
--    select * from user_activity_logs;
--    insert into user_activity_logs (user_id, action_type) values (null, 'login');
-- 
-- 9. Verify existing functionality still works:
--    -- Run E2E tests to ensure auth and event management flows work:
--    npm run test:e2e
-- ============================================================================

