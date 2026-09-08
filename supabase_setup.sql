-- =========================================================
-- INHUMANS ESPORTS — SUPABASE DATABASE SCHEMA
-- Run this in Supabase SQL Editor to set up all tables with 1 click!
-- =========================================================

-- 1. USERS TABLE (Logins & Approvals)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  igid TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Master Admin (Shaam)
INSERT INTO users (id, name, email, password, role, is_approved, igid)
VALUES (
  'master-admin-01',
  'Shaam',
  'vedhanayagant2000@gmail.com',
  '@Vedha9626',
  'admin',
  TRUE,
  '5512398471'
)
ON CONFLICT (email) DO NOTHING;

-- 2. PLAYERS TABLE (Roster)
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  in_game_name TEXT NOT NULL,
  igid TEXT,
  role TEXT NOT NULL,
  avatar TEXT,
  status TEXT DEFAULT 'active',
  matches_played INT DEFAULT 0,
  kills INT DEFAULT 0,
  kd NUMERIC DEFAULT 0,
  avg_damage NUMERIC DEFAULT 0,
  joined_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  organizer TEXT,
  tier TEXT,
  status TEXT DEFAULT 'available',
  prize_pool TEXT,
  start_date TEXT,
  end_date TEXT,
  registered_date TEXT,
  apply_link TEXT,
  contact_info TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MATCHES TABLE
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT,
  tournament_name TEXT,
  match_number INT DEFAULT 1,
  map TEXT DEFAULT 'Erangel',
  placement INT DEFAULT 1,
  kills INT DEFAULT 0,
  total_points INT DEFAULT 0,
  date TEXT,
  screenshot_url TEXT,
  screenshot_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PLAYER STATS TABLE
CREATE TABLE IF NOT EXISTS player_stats (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT,
  player_name TEXT,
  kills INT DEFAULT 0,
  damage INT DEFAULT 0,
  survival_time_min NUMERIC DEFAULT 0,
  assists INT DEFAULT 0,
  knocked INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. POINTS SYSTEMS TABLE
CREATE TABLE IF NOT EXISTS points_systems (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  placement_points JSONB,
  kill_point_multiplier INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_name TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  category TEXT DEFAULT 'tactics',
  due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INVESTMENTS TABLE (P&L / Bootcamp / Scrims)
CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'scrims',
  amount NUMERIC DEFAULT 0,
  date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. RETURNS TABLE (P&L Income)
CREATE TABLE IF NOT EXISTS returns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT DEFAULT 'prize_pool',
  amount NUMERIC DEFAULT 0,
  date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- Enable Full Anonymous Access for the app frontend
-- =========================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE points_systems DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE returns DISABLE ROW LEVEL SECURITY;

-- Enable Realtime for live cross-device sync
ALTER PUBLICATION supabase_realtime ADD TABLE users, players, tournaments, matches, player_stats, tasks, investments, returns;
