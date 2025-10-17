-- ============================================================================
-- Migration: Add Guest Users Support
-- Created: 2025-10-17 13:00:00 UTC
-- Author: Database Migration Script
-- 
-- Purpose:
--   This migration modifies the events table to support guest (unauthenticated)
--   users generating events while maintaining data integrity and historical records.
--
-- Changes:
--   1. Make user_id nullable to support guest users
--   2. Add created_by_authenticated_user flag to distinguish between guests and deleted accounts
--   3. Change ON DELETE CASCADE to ON DELETE SET NULL to preserve historical data
--   4. Add CHECK constraints to enforce business rules for guest users
--   5. Update RLS policies to allow guest users to create events
--
-- Tables Modified:
--   - events: Schema changes and constraint additions
--
-- Special Notes:
--   - Guest users (user_id IS NULL AND created_by_authenticated_user = false) cannot:
--     * Save events (saved must be false)
--     * Provide feedback (feedback must be NULL)
--     * Edit descriptions (edited_description must be NULL)
--   - Authenticated users whose accounts are deleted will have:
--     * user_id set to NULL (preserving their data)
--     * created_by_authenticated_user remains true
--     * Their saved/feedback/edited_description values preserved
-- ============================================================================

-- ============================================================================
-- Section 1: Modify events table structure
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Drop existing foreign key constraint
-- 
-- We need to drop the existing CASCADE constraint and replace it with SET NULL
-- This ensures that when a user deletes their account, their events are
-- preserved for historical and analytics purposes
-- ----------------------------------------------------------------------------

-- First, find and drop the existing foreign key constraint
-- The constraint name was auto-generated, so we need to find it first
do $$
declare
  constraint_name_var text;
begin
  -- Find the foreign key constraint name
  select constraint_name into constraint_name_var
  from information_schema.table_constraints
  where table_name = 'events'
    and constraint_type = 'FOREIGN KEY'
    and constraint_name like '%user_id%';
  
  -- Drop the constraint if it exists
  if constraint_name_var is not null then
    execute format('alter table events drop constraint %I', constraint_name_var);
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Step 2: Make user_id nullable
-- 
-- This allows events to be created by guest users (user_id = NULL)
-- or to preserve events when authenticated users delete their accounts
-- ----------------------------------------------------------------------------
alter table events alter column user_id drop not null;

-- ----------------------------------------------------------------------------
-- Step 3: Add new column created_by_authenticated_user
-- 
-- This boolean flag distinguishes between:
--   - Guest users: created_by_authenticated_user = false, user_id = NULL
--   - Authenticated users: created_by_authenticated_user = true, user_id = UUID or NULL
--   - Deleted accounts: created_by_authenticated_user = true, user_id = NULL
--
-- For existing rows (all created by authenticated users), set to true
-- ----------------------------------------------------------------------------
alter table events add column created_by_authenticated_user boolean not null default false;

-- Update existing rows to mark them as created by authenticated users
update events set created_by_authenticated_user = true;

-- ----------------------------------------------------------------------------
-- Step 4: Add new foreign key constraint with SET NULL
-- 
-- ON DELETE SET NULL ensures that when a user deletes their account:
--   - Their events remain in the database
--   - user_id is set to NULL
--   - created_by_authenticated_user remains true
--   - saved, feedback, and edited_description are preserved
-- ----------------------------------------------------------------------------
alter table events 
  add constraint events_user_id_fkey 
  foreign key (user_id) 
  references auth.users(id) 
  on delete set null;

-- ============================================================================
-- Section 2: Add business logic constraints
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Constraint: guest_events_cannot_be_saved
-- 
-- Purpose:
--   Prevents guest users from saving events to their collection
-- 
-- Logic:
--   If created_by_authenticated_user = false (guest), then saved must be false
--   Authenticated users can freely save/unsave their events
-- ----------------------------------------------------------------------------
alter table events 
  add constraint guest_events_cannot_be_saved 
  check (created_by_authenticated_user = true or saved = false);

-- ----------------------------------------------------------------------------
-- Constraint: guest_events_cannot_have_feedback
-- 
-- Purpose:
--   Prevents guest users from providing feedback on generated descriptions
-- 
-- Logic:
--   If created_by_authenticated_user = false (guest), then feedback must be NULL
--   Only authenticated users can rate AI-generated content
-- ----------------------------------------------------------------------------
alter table events 
  add constraint guest_events_cannot_have_feedback 
  check (created_by_authenticated_user = true or feedback is null);

-- ----------------------------------------------------------------------------
-- Constraint: guest_events_cannot_be_edited
-- 
-- Purpose:
--   Prevents guest users from editing generated descriptions
-- 
-- Logic:
--   If created_by_authenticated_user = false (guest), then edited_description must be NULL
--   Only authenticated users can save custom edits
-- ----------------------------------------------------------------------------
alter table events 
  add constraint guest_events_cannot_be_edited 
  check (created_by_authenticated_user = true or edited_description is null);

-- ----------------------------------------------------------------------------
-- Constraint: authenticated_user_consistency
-- 
-- Purpose:
--   Ensures data consistency between user_id and created_by_authenticated_user
-- 
-- Logic:
--   If user_id is NOT NULL, then created_by_authenticated_user must be true
--   This prevents inconsistent states like:
--     - user_id = some_uuid AND created_by_authenticated_user = false
--   
--   Valid states:
--     1. user_id = NULL, created_by_authenticated_user = false (guest)
--     2. user_id = NULL, created_by_authenticated_user = true (deleted account)
--     3. user_id = UUID, created_by_authenticated_user = true (active user)
-- ----------------------------------------------------------------------------
alter table events 
  add constraint authenticated_user_consistency 
  check (user_id is null or created_by_authenticated_user = true);

-- ============================================================================
-- Section 3: Add index for new column
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Index: idx_events_created_by_authenticated_user
-- 
-- Purpose:
--   Optimize queries that filter events by user type (guest vs authenticated)
-- 
-- Use cases:
--   - Analytics: "How many events are created by guests vs authenticated users?"
--   - Reporting: "Show me all guest-generated events"
--   - Data cleanup: "Remove old unsaved guest events"
-- ----------------------------------------------------------------------------
create index idx_events_created_by_authenticated_user 
  on events(created_by_authenticated_user);

-- ============================================================================
-- Section 4: Update RLS policies for guest support
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Drop existing anonymous user policies
-- 
-- We need to replace the blanket "anonymous users cannot create events" policy
-- with one that allows event creation but enforces appropriate constraints
-- ----------------------------------------------------------------------------

-- Drop the restrictive anonymous insert policy
drop policy if exists "Anonymous users cannot create events" on events;

-- Drop the restrictive anonymous select policy
drop policy if exists "Anonymous users cannot view events" on events;

-- Keep the restrictive UPDATE and DELETE policies for anonymous users
-- (these remain unchanged - guests should not be able to modify/delete events)

-- ----------------------------------------------------------------------------
-- RLS Policy: Anonymous users can create events (INSERT)
-- Scope: anon role
-- 
-- Purpose:
--   Allows unauthenticated users to generate event descriptions
-- 
-- Logic:
--   WITH CHECK ensures that guest-created events have:
--     1. user_id IS NULL (no user association)
--     2. created_by_authenticated_user = false (marked as guest-created)
--     3. saved = false (guests cannot save events)
--     4. feedback IS NULL (guests cannot provide feedback)
--     5. edited_description IS NULL (guests cannot edit)
--   
--   These constraints are also enforced at the table level via CHECK constraints,
--   but we duplicate them here for defense in depth
-- ----------------------------------------------------------------------------
create policy "Anonymous users can create events"
  on events for insert
  to anon
  with check (
    user_id is null 
    and created_by_authenticated_user = false
    and saved = false
    and feedback is null
    and edited_description is null
  );

-- ----------------------------------------------------------------------------
-- RLS Policy: Anonymous users can view their own events temporarily (SELECT)
-- Scope: anon role
-- 
-- Purpose:
--   Allows unauthenticated users to view the event they just created
--   during their session (for displaying the result)
-- 
-- Logic:
--   Since guests don't have persistent user_id, we cannot reliably filter
--   "their" events. However, the application layer should handle this by:
--     1. Generating the event
--     2. Immediately returning it to the user
--     3. Not querying the database for guest events
--   
--   For security, we return false here to prevent guests from querying
--   all events. The application should always return the generated event
--   directly from the INSERT operation, not via a subsequent SELECT.
-- ----------------------------------------------------------------------------
create policy "Anonymous users cannot query events"
  on events for select
  to anon
  using (false);

-- ============================================================================
-- Migration Verification
-- ============================================================================
-- 
-- After running this migration, verify the following:
-- 
-- 1. Schema changes applied correctly:
--    select column_name, is_nullable, data_type 
--    from information_schema.columns 
--    where table_name = 'events';
-- 
-- 2. Constraints are in place:
--    select constraint_name, constraint_type 
--    from information_schema.table_constraints 
--    where table_name = 'events';
-- 
-- 3. Test guest user creation:
--    -- This should succeed (as anon user):
--    insert into events (
--      title, city, event_date, category, age_category, 
--      key_information, generated_description, model_version,
--      created_by_authenticated_user
--    ) values (
--      'Test Event', 'Warsaw', current_date, 'koncerty', 'wszystkie',
--      'Test info', 'Test description', 'gpt-4', false
--    );
-- 
-- 4. Test guest user restrictions:
--    -- These should fail (constraint violations):
--    -- Trying to save as guest:
--    insert into events (..., created_by_authenticated_user, saved) 
--    values (..., false, true);
--    
--    -- Trying to provide feedback as guest:
--    insert into events (..., created_by_authenticated_user, feedback) 
--    values (..., false, 'thumbs_up');
-- 
-- 5. Test authenticated user functionality:
--    -- This should succeed (as authenticated user):
--    insert into events (
--      user_id, title, ..., created_by_authenticated_user, saved, feedback
--    ) values (
--      auth.uid(), 'Test Event', ..., true, true, 'thumbs_up'
--    );
-- 
-- ============================================================================
