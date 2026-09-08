# BGMI Team Management App — Full Plan

## 1. Points System (as defined)

This is the default, but should be stored as **data, not hardcoded**, since tournaments sometimes vary the table.

| Placement | Points |
|---|---|
| #1 | 10 |
| #2 | 6 |
| #3 | 5 |
| #4 | 4 |
| #5 | 3 |
| #6 | 2 |
| #7 & #8 | 1 |
| #9+ | 0 |

- Kill points: **1 point per kill**
- `total_points = placement_points + (kills * kill_point_value)`

---

## 2. Full Schema (all modules)

```sql
-- USERS & ROLES
users (
  id, name, email, password_hash,
  role ENUM('admin','coach','igl','player'),
  player_id FK -> players.id NULLABLE,  -- links a login to a roster player
  created_at
)

-- PLAYERS
players (
  id, name, ign (in-game name), role ENUM('assault','sniper','support','igl'),
  status ENUM('starter','standby','inactive'),
  join_date, notes, created_at
)

-- POINTS SYSTEM (configurable per tournament)
points_systems (
  id, name,
  placement_points JSON,   -- e.g. {"1":10,"2":6,"3":5,"4":4,"5":3,"6":2,"7":1,"8":1}
  default_placement_points INT DEFAULT 0,
  kill_point_value DECIMAL DEFAULT 1,
  created_at
)

-- TOURNAMENTS
tournaments (
  id, name, organizer, start_date, end_date,
  format ENUM('TPP','FPP'),
  entry_fee DECIMAL,
  prize_pool DECIMAL,
  points_system_id FK -> points_systems.id,
  status ENUM('registered','ongoing','completed'),
  created_at
)

-- MATCHES (a tournament has many matches)
matches (
  id, tournament_id FK, match_number, map, match_date,
  created_at
)

-- MATCH ROSTER (which players played this specific match, incl. subs)
match_rosters (
  id, match_id FK, player_id FK,
  is_substitute BOOLEAN DEFAULT false,
  substitute_for_player_id FK -> players.id NULLABLE
)

-- SCREENSHOTS (raw uploads + OCR trace)
screenshots (
  id, match_id FK,
  image_url,
  ocr_raw_json,          -- unprocessed OCR output
  ocr_confidence DECIMAL,
  status ENUM('pending_review','verified'),
  verified_by FK -> users.id NULLABLE,
  verified_at,
  created_at
)

-- MATCH PLAYER STATS (parsed / confirmed data — the core analytics table)
match_player_stats (
  id, match_id FK, player_id FK, screenshot_id FK NULLABLE,
  placement INT,
  kills INT,
  damage INT,
  survival_time_seconds INT,
  placement_points DECIMAL,   -- computed at save time from points_system
  kill_points DECIMAL,        -- computed
  total_points DECIMAL,       -- computed
  created_at
)

-- INVESTMENTS
investments (
  id, tournament_id FK NULLABLE,
  type ENUM('entry_fee','gear','coaching','bootcamp','other'),
  amount DECIMAL, note, spent_date, created_at
)

-- RETURNS
returns (
  id, tournament_id FK NULLABLE,
  type ENUM('prize','sponsorship','other'),
  amount DECIMAL, note, received_date, created_at
)

-- TASKS
tasks (
  id, title, description, category ENUM('drill','vod_review','rotation','aim','comms','fitness','other'),
  assigned_by FK -> users.id (coach),
  assigned_to_squad BOOLEAN DEFAULT false,
  assigned_to_player_id FK -> players.id NULLABLE,
  linked_match_id FK NULLABLE,
  linked_tournament_id FK NULLABLE,
  priority ENUM('low','medium','high'),
  due_date,
  status ENUM('assigned','in_progress','completed','verified','reopened'),
  completed_by FK -> users.id NULLABLE (must be role=igl),
  verified_by FK -> users.id NULLABLE (must be role=coach),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule VARCHAR NULLABLE,  -- e.g. 'daily','weekly'
  created_at
)

task_comments (
  id, task_id FK, user_id FK, comment, created_at
)
```

### Relationship overview

```
players ──┬── match_rosters ── matches ── tournaments ── points_systems
          │                       │
          │                   screenshots
          │                       │
          └── match_player_stats ─┘

tournaments ── investments
tournaments ── returns

users(coach) ── tasks ── users(igl, completed_by)
                  │
              task_comments
```

---

## 3. Roadmap (phased build)

### Phase 0 — Setup & Config (few days)
- Finalize roles (Admin, Coach, IGL, Player) and permission matrix
- Seed default points system (table above) into `points_systems`
- Wireframe: dashboard, match entry, task board

### Phase 1 — Core MVP (no OCR yet)
- Auth + roles
- Players CRUD (starters + standby, marked separately)
- Tournaments + Matches CRUD
- **Manual** match stat entry form (placement, kills, damage) → auto-computes points from `points_systems`
- Basic player stat list view

### Phase 2 — Screenshot Upload + OCR
- Image upload tied to a match
- OCR pipeline (PaddleOCR/EasyOCR or a VLM call) parses placement/kills/damage per player
- Review screen: parsed values shown next to the screenshot, coach/IGL confirms or corrects before it writes to `match_player_stats`
- Store OCR confidence; low-confidence fields flagged for manual check

### Phase 3 — Task Module
- Task board (Kanban: Assigned / In Progress / Completed)
- Coach creates/assigns; teammates comment/update; **only IGL can mark Completed**
- Optional coach verification step
- Recurring task support

### Phase 4 — Investment & Returns
- Ledger entry forms per tournament (entry fee, gear, coaching / prize, sponsorship)
- Per-tournament and cumulative P&L view

### Phase 5 — Analytics Dashboard
- Per-player: avg placement points, avg kill points, avg total, K/D, consistency (std dev), starter vs standby split
- Per-squad: combined trend over time, best/worst maps
- Cross-module insight: task completion rate vs performance trend (optional, Phase 5.5)

### Phase 6 — Polish
- Notifications (task due dates, tournament reminders)
- Mobile-responsive upload flow (screenshots come straight from phones post-match)
- Export reports (PDF/CSV) for sponsors or internal review

---

## 4. Build Prompt for Antigravity

Copy-paste this as your initial project prompt:

```
Build a full-stack team management web app for a BGMI (Battlegrounds Mobile
India) esports squad. Stack: React + Next.js frontend (Tailwind + Recharts
for charts), FastAPI backend, PostgreSQL database. Mobile-responsive.

Roles: Admin, Coach, IGL, Player — with permission-gated actions as described
below.

Core modules:

1. PLAYER ROSTER
   - CRUD for players: name, IGN, role (assault/sniper/support/igl), status
     (starter/standby/inactive), join date.
   - Standby/substitute players are tracked in the same table but filtered
     separately everywhere in the UI and in stat aggregations, so a sub's
     stats never silently blend into a starter's season averages.

2. TOURNAMENT & MATCH TRACKING
   - Tournament CRUD: name, organizer, dates, format (TPP/FPP), entry fee,
     prize pool, status.
   - Each tournament has multiple matches (map, match number, date).
   - Each match has a roster (which players/subs played that match).

3. SCREENSHOT-BASED MATCH ENTRY
   - Upload the BGMI post-match results screenshot per match.
   - Run OCR (or a vision-model call) to extract per-player placement,
     kills, damage, survival time.
   - Show a review UI: screenshot on one side, parsed editable fields on
     the other, so a human confirms/corrects before saving. Flag any
     low-confidence field visually.
   - On save, compute points using the configurable points system below.

4. POINTS SYSTEM (make this configurable per tournament, default values):
   Placement points: 1st=10, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2,
   7th=1, 8th=1, 9th and below = 0.
   Kill points: 1 point per kill.
   total_points = placement_points + kill_points.
   Store this as a `points_systems` table (JSON map for placement points +
   a kill_point_value field) so it can be edited per tournament, not
   hardcoded.

5. TASK MODULE
   - Coach creates tasks (title, description, category, priority, due
     date), assigned to the whole squad or a specific player, optionally
     linked to a match or tournament.
   - Kanban board: Assigned / In Progress / Completed.
   - Teammates can add progress comments but cannot close a task.
   - Only the IGL role can mark a task Completed.
   - Optional: Coach can "Verify" or "Reopen" a completed task.
   - Support recurring tasks (daily/weekly).

6. INVESTMENT & RETURNS
   - Log investments (entry fees, gear, coaching, bootcamps) and returns
     (prize winnings, sponsorships), each optionally linked to a
     tournament.
   - Show per-tournament and cumulative profit/loss.

7. ANALYTICS DASHBOARD
   - Per-player: average placement points, average kill points, average
     total points, K/D ratio, consistency (variance across matches),
     starter vs standby performance split, trend line over time.
   - Per-squad: combined average points over time, best/worst performing
     maps, comparison across tournaments.
   - All charts should be filterable by date range and by tournament.

Data model: use the schema relationships players → match_rosters →
matches → tournaments → points_systems, plus tournaments → investments/
returns, and users(coach) → tasks → users(igl) as separate linked tables
rather than nesting everything into one table.

Build order: (1) auth + roles, (2) players/tournaments/matches CRUD with
manual stat entry and points auto-calculation, (3) screenshot upload + OCR
review flow, (4) task module with role-gated completion, (5) investment/
returns ledger, (6) analytics dashboard tying it all together.

Prioritize a clean, fast mobile upload flow for screenshots (used right
after matches) and a permission system that's enforced at the API level,
not just hidden in the UI.
```

---

### Notes on execution
- Keep the points table editable in-app — tournament organizers change formats often, and hardcoding this now means rework later.
- The screenshot OCR review step should never be a "trust blindly" flow — always show parsed values against the source image before committing to `match_player_stats`, since a wrongly-read digit will quietly wreck averages.
- Standby player stats should be structurally separate in aggregation queries (filter by `status`), not just visually separated in the UI.
