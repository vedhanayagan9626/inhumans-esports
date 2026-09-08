export type UserRole = 'master_admin' | 'admin' | 'coach' | 'igl' | 'player';
export type UserStatus = 'active' | 'pending_approval' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  player_id?: string;
  avatar?: string;
  status: UserStatus;
  created_at?: string;
  approved_by?: string;
  approved_at?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number; // Unix timestamp: now + 3600 * 1000
}

export type PlayerRole = 'assault' | 'sniper' | 'support' | 'igl';
export type PlayerStatus = 'starter' | 'standby' | 'inactive';

export interface Player {
  id: string;
  name: string;
  ign: string;
  igid: string; // In-Game Character ID e.g. "512948201"
  role: PlayerRole;
  status: PlayerStatus;
  join_date: string;
  notes?: string;
  avatar?: string;
  device?: string;
}

export interface PointsSystem {
  id: string;
  name: string;
  is_default?: boolean;
  placement_points: Record<number, number>;
  default_placement_points: number;
  kill_point_value: number;
}

export type TournamentFormat = 'TPP' | 'FPP';
export type TournamentStatus = 'available' | 'registered' | 'ongoing' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  organizer: string;
  start_date: string;
  end_date: string;
  format: TournamentFormat;
  entry_fee: number;
  prize_pool: number;
  points_system_id: string;
  status: TournamentStatus;
  apply_link?: string;
  contact_info?: string;
  slots_info?: string;
}

export type BgmiMap = 'Erangel' | 'Miramar' | 'Sanhok' | 'Vikendi' | 'Nusa' | 'Rondo';

export interface MatchScreenshot {
  id: string;
  match_id: string;
  data_url: string; // Base64 data URL
  name: string;
  description: string;
  uploaded_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  match_number: number;
  map: BgmiMap;
  match_date: string;
  status?: 'completed' | 'scheduled';
  screenshot?: MatchScreenshot;
}

export interface MatchRosterEntry {
  player_id: string;
  is_substitute: boolean;
  substitute_for_player_id?: string;
}

export interface MatchPlayerStat {
  id: string;
  match_id: string;
  player_id: string;
  placement: number;
  kills: number;
  damage: number;
  survival_time_seconds: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
}

export type TaskCategory = 'drill' | 'vod_review' | 'rotation' | 'aim' | 'comms' | 'fitness' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'assigned' | 'in_progress' | 'completed' | 'verified' | 'reopened';

export interface TaskComment {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  comment: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  assigned_by: string;
  assigned_to_squad: boolean;
  assigned_to_player_id?: string;
  linked_match_id?: string;
  linked_tournament_id?: string;
  priority: TaskPriority;
  due_date: string;
  status: TaskStatus;
  completed_by?: string;
  verified_by?: string;
  is_recurring: boolean;
  recurrence_rule?: 'daily' | 'weekly';
  comments: TaskComment[];
  created_at: string;
}

export type InvestmentType = 'entry_fee' | 'scrims' | 'training' | 'wildcard' | 'gear' | 'coaching' | 'bootcamp' | 'other';
export type ReturnType = 'prize' | 'sponsorship' | 'other';

export interface Investment {
  id: string;
  tournament_id?: string;
  type: InvestmentType;
  amount: number;
  note: string;
  spent_date: string;
}

export interface FinancialReturn {
  id: string;
  tournament_id?: string;
  type: ReturnType;
  amount: number;
  note: string;
  received_date: string;
}
