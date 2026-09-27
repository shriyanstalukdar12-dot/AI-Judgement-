/*
# Create cases and votes tables for AI Judgement

1. New Tables
- `cases`
  - `id` (uuid, primary key)
  - `title` (text, not null) — short title of the dispute
  - `category` (text, not null) — e.g. "Relationship", "Workplace", "Money", "Family", "Neighbor", "Other"
  - `plaintiff` (text, not null) — the person bringing the complaint (side A)
  - `defendant` (text, not null) — the person being accused (side B)
  - `plaintiff_argument` (text, not null) — side A's argument
  - `defendant_argument` (text, not null) — side B's argument (can be "Did not respond")
  - `verdict` (text) — AI-generated verdict, null until judged
  - `verdict_winner` (text) — "plaintiff", "defendant", or "split", null until judged
  - `verdict_reasoning` (text) — AI reasoning, null until judged
  - `status` (text, not null default 'pending') — 'pending' or 'judged'
  - `plaintiff_votes` (int, default 0) — community votes for plaintiff
  - `defendant_votes` (int, default 0) — community votes for defendant
  - `created_at` (timestamptz, default now())
- `votes`
  - `id` (uuid, primary key)
  - `case_id` (uuid, FK to cases, cascade delete)
  - `side` (text, not null) — "plaintiff" or "defendant"
  - `voter_id` (text, not null) — anonymous browser fingerprint (localStorage UUID)
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on both tables.
- Allow anon + authenticated full CRUD — this is a public, no-auth community app.
- All data is intentionally shared/public.
3. Notes
- Unique constraint on (case_id, voter_id) prevents double-voting per browser.
- Index on created_at for chronological ordering.
- Index on category for filtering.
*/

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  plaintiff text NOT NULL,
  defendant text NOT NULL,
  plaintiff_argument text NOT NULL,
  defendant_argument text NOT NULL,
  verdict text,
  verdict_winner text,
  verdict_reasoning text,
  status text NOT NULL DEFAULT 'pending',
  plaintiff_votes int NOT NULL DEFAULT 0,
  defendant_votes int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_category ON cases (category);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases (status);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cases" ON cases;
CREATE POLICY "anon_select_cases" ON cases FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cases" ON cases;
CREATE POLICY "anon_insert_cases" ON cases FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cases" ON cases;
CREATE POLICY "anon_update_cases" ON cases FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cases" ON cases;
CREATE POLICY "anon_delete_cases" ON cases FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('plaintiff', 'defendant')),
  voter_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(case_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_case_id ON votes (case_id);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_votes" ON votes;
CREATE POLICY "anon_select_votes" ON votes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_votes" ON votes;
CREATE POLICY "anon_insert_votes" ON votes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_votes" ON votes;
CREATE POLICY "anon_delete_votes" ON votes FOR DELETE
  TO anon, authenticated USING (true);
