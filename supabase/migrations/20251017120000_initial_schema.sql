-- ============================================================================
-- Migration: Initial Schema for CulturAllyAI
-- Created: 2025-10-17 12:00:00 UTC
-- Author: Database Migration Script
-- 
-- Purpose:
--   This migration creates the complete initial database schema for the
--   CulturAllyAI application, including:
--   - ENUM types for event categories, age categories, and action types
--   - events table for storing user-generated cultural event descriptions
--   - Logging tables for user activity and event management actions
--   - Indexes for query optimization
--   - Triggers for automatic timestamp updates
--   - Row Level Security (RLS) policies for data isolation
--
-- Tables Created:
--   - events: Main table for storing cultural events with AI-generated descriptions
--   - user_activity_logs: Audit log for user account-related actions
--   - event_management_logs: Audit log for event management actions
--
-- Special Notes:
--   - This schema relies on Supabase Auth's auth.users table
--   - Soft delete strategy: events are marked as not saved rather than deleted
--   - Generated and edited descriptions are stored separately for analytics
--   - All timestamps are in UTC (TIMESTAMPTZ)
-- ============================================================================

-- ============================================================================
-- Section 1: ENUM Types
-- ============================================================================

-- Kategorie wydarzeń kulturalnych
-- Defines the main categories for cultural events to ensure data consistency
create type event_category as enum (
  'koncerty',
  'imprezy',
  'teatr_i_taniec',
  'sztuka_i_wystawy',
  'literatura',
  'kino',
  'festiwale',
  'inne'
);

-- Kategorie wiekowe
-- Defines age groups for event targeting and content appropriateness
create type age_category as enum (
  'wszystkie',
  'najmlodsi',
  'dzieci',
  'nastolatkowie',
  'mlodzi_dorosli',
  'dorosli',
  'osoby_starsze'
);

-- Typy akcji użytkownika
-- Defines types of user account-related actions for audit logging
create type user_action_type as enum (
  'account_created',
  'account_deleted',
  'password_changed',
  'login',
  'logout'
);

-- Typy akcji zarządzania wydarzeniami
-- Defines types of event management actions for audit logging
create type event_action_type as enum (
  'event_created',
  'event_saved',
  'event_edited',
  'event_deleted'
);

-- Typy ocen generacji
-- Defines feedback types for rating AI-generated content quality
create type feedback as enum (
  'thumbs_up',
  'thumbs_down'
);

-- ============================================================================
-- Section 2: Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: events
-- Purpose: Stores all generated cultural event descriptions
-- 
-- Key Features:
--   - Stores both AI-generated and user-edited descriptions separately
--   - Implements soft delete via the 'saved' boolean flag
--   - Tracks user feedback on AI-generated content
--   - Enforces data validation through CHECK constraints
--   - Maintains audit trail with created_at and updated_at timestamps
--
-- Data Lifecycle:
--   1. Event is created with AI-generated description (saved = false by default)
--   2. User can optionally save the event (saved = true)
--   3. User can edit the description (edited_description populated)
--   4. User can provide feedback (feedback field)
--   5. User can "delete" event (saved set back to false - soft delete)
-- ----------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  
  -- Foreign key to Supabase Auth's users table
  -- ON DELETE CASCADE ensures all user events are removed when user is deleted
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- User input fields for event creation
  -- These fields are provided by the user when generating an event description
  title varchar(100) not null,
  city varchar(50) not null,
  event_date date not null,
  category event_category not null,
  age_category age_category not null,
  
  -- Key information is limited to 200 characters as per business requirements
  key_information text not null check (char_length(key_information) <= 200),
  
  -- AI-generated description (immutable)
  -- This field preserves the original AI output for analytics and comparison
  -- Limited to 500 characters as per business requirements
  generated_description text not null check (char_length(generated_description) <= 500),
  
  -- User-edited description (optional)
  -- NULL indicates the user has not edited the AI-generated description
  -- When populated, this version is displayed to the user instead of generated_description
  -- Limited to 500 characters as per business requirements
  edited_description text check (char_length(edited_description) <= 500),
  
  -- Saved status flag
  -- false: Event was generated but not explicitly saved by user (default)
  -- true: User has saved this event to their collection
  -- Note: This implements soft delete - "deleting" an event sets saved back to false
  saved boolean not null default false,
  
  -- Optional user feedback on the AI-generated description
  -- Collected at generation time to improve AI model performance
  -- NULL indicates no feedback provided
  feedback feedback,
  
  -- Metadata fields
  -- model_version tracks which AI model version generated the description
  model_version varchar(50) not null,
  
  -- Timestamps for audit trail
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Validation constraint
  -- Ensures events cannot be created with dates in the past
  constraint valid_event_date check (event_date >= current_date)
);

-- ----------------------------------------------------------------------------
-- Table: user_activity_logs
-- Purpose: Audit log for user account-related actions
-- 
-- Key Features:
--   - Tracks all significant user account events (login, logout, etc.)
--   - ON DELETE SET NULL preserves log entries even after user deletion
--   - Immutable records (no updates, only inserts)
--
-- Usage:
--   - Security auditing and compliance
--   - User behavior analytics
--   - Debugging authentication issues
-- ----------------------------------------------------------------------------
create table user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  
  -- Foreign key to user who performed the action
  -- ON DELETE SET NULL preserves the log entry for historical/audit purposes
  -- even if the user account is deleted
  user_id uuid references auth.users(id) on delete set null,
  
  -- Type of action performed (login, logout, account_created, etc.)
  action_type user_action_type not null,
  
  -- Timestamp when the action occurred
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Table: event_management_logs
-- Purpose: Audit log for event management actions
-- 
-- Key Features:
--   - Tracks all event-related actions (create, save, edit, delete)
--   - ON DELETE SET NULL preserves logs even after user/event deletion
--   - Immutable records (no updates, only inserts)
--
-- Usage:
--   - Analytics on user engagement with generated content
--   - Tracking edit patterns to improve AI model
--   - Audit trail for event lifecycle
-- ----------------------------------------------------------------------------
create table event_management_logs (
  id uuid primary key default gen_random_uuid(),
  
  -- Foreign key to user who performed the action
  -- ON DELETE SET NULL preserves the log entry for audit purposes
  user_id uuid references auth.users(id) on delete set null,
  
  -- Foreign key to the event that was acted upon
  -- ON DELETE SET NULL preserves the log entry for analytics
  event_id uuid references events(id) on delete set null,
  
  -- Type of action performed (event_created, event_saved, etc.)
  action_type event_action_type not null,
  
  -- Timestamp when the action occurred
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Section 3: Indexes
-- ============================================================================

-- Indexes for events table
-- These indexes optimize the most common query patterns in the application

-- Optimize queries filtering by user (e.g., "show me all my events")
create index idx_events_user_id on events(user_id);

-- Optimize queries filtering by event date (e.g., "upcoming events")
create index idx_events_event_date on events(event_date);

-- Optimize queries filtering by category (e.g., "show all concerts")
create index idx_events_category on events(category);

-- Optimize queries ordering by creation date (e.g., "recently created events")
-- DESC order matches the typical use case of showing newest first
create index idx_events_created_at on events(created_at desc);

-- Optimize queries filtering saved/unsaved events
-- This is a critical index for the main user interface showing saved events
create index idx_events_saved on events(saved);

-- Indexes for user_activity_logs table
-- These indexes support audit queries and user behavior analytics

-- Optimize queries filtering logs by user
create index idx_user_activity_logs_user_id on user_activity_logs(user_id);

-- Optimize queries filtering by action type (e.g., "all login attempts")
create index idx_user_activity_logs_action_type on user_activity_logs(action_type);

-- Optimize queries ordering by timestamp (e.g., "recent activity")
create index idx_user_activity_logs_created_at on user_activity_logs(created_at desc);

-- Indexes for event_management_logs table
-- These indexes support analytics and audit queries

-- Optimize queries filtering logs by user
create index idx_event_management_logs_user_id on event_management_logs(user_id);

-- Optimize queries filtering logs by event
create index idx_event_management_logs_event_id on event_management_logs(event_id);

-- Optimize queries filtering by action type
create index idx_event_management_logs_action_type on event_management_logs(action_type);

-- Optimize queries ordering by timestamp
create index idx_event_management_logs_created_at on event_management_logs(created_at desc);

-- ============================================================================
-- Section 4: Triggers and Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: update_updated_at_column
-- Purpose: Automatically update the updated_at timestamp on row modifications
-- 
-- This function is called by triggers to maintain accurate audit timestamps
-- without requiring application code to explicitly set updated_at
-- ----------------------------------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- Trigger: update_events_updated_at
-- Purpose: Automatically update updated_at timestamp when an event is modified
-- 
-- This ensures the updated_at field is always accurate without relying on
-- application code to set it correctly
-- ----------------------------------------------------------------------------
create trigger update_events_updated_at
  before update on events
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- Section 5: Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on events table
-- This ensures users can only access their own events, enforced at the database level
alter table events enable row level security;

-- ----------------------------------------------------------------------------
-- RLS Policy: Users can view own events (SELECT)
-- Scope: authenticated role
-- 
-- Purpose:
--   Allows authenticated users to view only their own events
-- 
-- Logic:
--   Checks that the user_id in the events table matches the currently
--   authenticated user's ID (auth.uid())
-- ----------------------------------------------------------------------------
create policy "Users can view own events"
  on events for select
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policy: Users can create events (INSERT)
-- Scope: authenticated role
-- 
-- Purpose:
--   Allows authenticated users to create new events
-- 
-- Logic:
--   Ensures that the user_id being inserted matches the currently
--   authenticated user's ID, preventing users from creating events
--   on behalf of other users
-- ----------------------------------------------------------------------------
create policy "Users can create events"
  on events for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policy: Users can update own events (UPDATE)
-- Scope: authenticated role
-- 
-- Purpose:
--   Allows authenticated users to update only their own events
-- 
-- Logic:
--   USING clause: Checks current row ownership before allowing update
--   WITH CHECK clause: Ensures updated row still belongs to the same user
--   This prevents users from transferring event ownership to another user
-- ----------------------------------------------------------------------------
create policy "Users can update own events"
  on events for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policy: Users can delete own events (DELETE)
-- Scope: authenticated role
-- 
-- Purpose:
--   Allows authenticated users to delete only their own events
-- 
-- Logic:
--   Checks that the user_id matches the authenticated user before
--   allowing deletion. Note: In practice, the application implements
--   soft delete by setting saved = false rather than physically deleting rows.
-- ----------------------------------------------------------------------------
create policy "Users can delete own events"
  on events for delete
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policy: Anonymous users cannot access events (SELECT)
-- Scope: anon role
-- 
-- Purpose:
--   Explicitly denies anonymous (non-authenticated) users from viewing events
-- 
-- Logic:
--   Returns false for all rows, effectively blocking all access
--   This is a security measure to ensure only authenticated users can
--   access event data
-- ----------------------------------------------------------------------------
create policy "Anonymous users cannot view events"
  on events for select
  to anon
  using (false);

-- ----------------------------------------------------------------------------
-- RLS Policy: Anonymous users cannot create events (INSERT)
-- Scope: anon role
-- 
-- Purpose:
--   Explicitly denies anonymous users from creating events
-- 
-- Logic:
--   Returns false, blocking all insert attempts from unauthenticated users
-- ----------------------------------------------------------------------------
create policy "Anonymous users cannot create events"
  on events for insert
  to anon
  with check (false);

-- ----------------------------------------------------------------------------
-- RLS Policy: Anonymous users cannot update events (UPDATE)
-- Scope: anon role
-- 
-- Purpose:
--   Explicitly denies anonymous users from updating events
-- 
-- Logic:
--   Returns false for both USING and WITH CHECK clauses
-- ----------------------------------------------------------------------------
create policy "Anonymous users cannot update events"
  on events for update
  to anon
  using (false)
  with check (false);

-- ----------------------------------------------------------------------------
-- RLS Policy: Anonymous users cannot delete events (DELETE)
-- Scope: anon role
-- 
-- Purpose:
--   Explicitly denies anonymous users from deleting events
-- 
-- Logic:
--   Returns false, blocking all delete attempts from unauthenticated users
-- ----------------------------------------------------------------------------
create policy "Anonymous users cannot delete events"
  on events for delete
  to anon
  using (false);

-- ============================================================================
-- Notes on Logging Tables RLS
-- ============================================================================
-- 
-- The user_activity_logs and event_management_logs tables do NOT have RLS
-- enabled. This is intentional for the following reasons:
-- 
-- 1. These are audit/analytics tables accessed primarily by:
--    - Backend services for analytics
--    - Admin dashboards (future feature)
--    - Database-level reporting tools
-- 
-- 2. Application code should control access to these tables through:
--    - API endpoints with proper authentication
--    - Service-level authorization checks
-- 
-- 3. Direct database access for these tables should be restricted to:
--    - Service role (for backend operations)
--    - Admin users (for analytics and monitoring)
-- 
-- If future requirements demand user-facing access to their own logs,
-- appropriate RLS policies should be added at that time.
-- ============================================================================
