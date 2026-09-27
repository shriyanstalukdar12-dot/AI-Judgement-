/*
# Add authentication, user ownership, and supervisor moderation

## Overview
This migration converts the app from a public no-auth app to a signed-in app.
Users must now sign in to file cases, vote, or browse. Cases are owned by the
user who filed them. A supervisor (identified by email) can see and delete any
case for moderation.

## Changes

### 1. New Table: `supervisor_emails'
- Stores the supervisor email so it can be checked at signup time.
- `email` (text, unique, not null)
- Pre-populated with shriyanstalukdarb@gmail.com

### 2. New Table: `profiles'
- `id` (uuid, PK, matches auth.users.id)
- `email` (text, unique, not null)
- `is_supervisor` (boolean, default false)
- `created_at` (timestamptz)
- Auto-populated when a new user signs up via a trigger

### 3. Modified Table: `cases'
- Added `user_id` column (uuid, NOT NULL, DEFAULT auth.uid())
  - Foreign key to auth.users(id) ON DELETE CASCADE
- Old seed data (no real owner) is deleted since it was test data.

### 4. Modified Table: `votes'
- Added `user_id` column (uuid, NOT NULL, DEFAULT auth.uid())
  - Foreign key to auth.users(id) ON DELETE CASCADE
  - Unique index on (case_id, user_id) — one vote per user per case
- Old seed votes deleted along with cases.

### 5. Security (RLS)
- `profiles': all authenticated users can read (needed to check supervisor).
  Users can update their own profile row.
- `cases': all authenticated users can read (community browsing).
  Users can insert/update/delete only their OWN cases.
  Supervisor can delete ANY case (moderation).
- `votes': all authenticated users can read (for vote counts).
  Users can insert only their own vote. Users can delete only their own vote.

### 6. Trigger
- `handle_new_user': after insert on auth.users, creates a profile row with
  the user's email and sets is_supervisor = true if email is in supervisor_emails.
*/

-- ============================================================
-- 0. Delete seed test data (no real owners exist yet)
-- ============================================================
DELETE FROM votes;
DELETE FROM cases;

-- ============================================================
-- 1. Create supervisor_emails table
-- ============================================================
CREATE TABLE IF NOT EXISTS supervisor_emails (
  id int PRIMARY KEY DEFAULT 1,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO supervisor_emails (email)
VALUES ('shriyanstalukdarb@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 2. Create profiles table
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  is_supervisor boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- 3. Add user_id to cases
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE cases ADD COLUMN user_id uuid;
  END IF;
END $$;

ALTER TABLE cases ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE cases ALTER COLUMN user_id SET DEFAULT auth.uid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'cases_user_id_fkey'
  ) THEN
    ALTER TABLE cases ADD CONSTRAINT cases_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 4. Add user_id to votes
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'votes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE votes ADD COLUMN user_id uuid;
  END IF;
END $$;

ALTER TABLE votes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE votes ALTER COLUMN user_id SET DEFAULT auth.uid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'votes_user_id_fkey'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Unique constraint: one vote per user per case
DROP INDEX IF EXISTS idx_votes_case_user;
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_case_user ON votes (case_id, user_id);

-- ============================================================
-- 5. Update RLS policies on cases (remove anon, require authenticated)
-- ============================================================
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cases" ON cases;
DROP POLICY IF EXISTS "anon_insert_cases" ON cases;
DROP POLICY IF EXISTS "anon_update_cases" ON cases;
DROP POLICY IF EXISTS "anon_delete_cases" ON cases;

-- All authenticated users can read all cases (community browsing)
CREATE POLICY "select_cases_authenticated" ON cases FOR SELECT
  TO authenticated USING (true);

-- Users can insert only their own cases
CREATE POLICY "insert_own_cases" ON cases FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update only their own cases
CREATE POLICY "update_own_cases" ON cases FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cases; supervisor can delete any case
CREATE POLICY "delete_cases" ON cases FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_supervisor = true
    )
  );

-- ============================================================
-- 6. Update RLS policies on votes (remove anon, require authenticated)
-- ============================================================
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_votes" ON votes;
DROP POLICY IF EXISTS "anon_insert_votes" ON votes;
DROP POLICY IF EXISTS "anon_delete_votes" ON votes;

-- All authenticated users can read all votes (for counts)
CREATE POLICY "select_votes_authenticated" ON votes FOR SELECT
  TO authenticated USING (true);

-- Users can insert only their own vote
CREATE POLICY "insert_own_vote" ON votes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own vote
CREATE POLICY "delete_own_vote" ON votes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 7. Trigger: auto-create profile on signup + set supervisor flag
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_supervisor)
  VALUES (
    NEW.id,
    NEW.email,
    EXISTS (
      SELECT 1 FROM public.supervisor_emails
      WHERE email = NEW.email
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO authenticated;
