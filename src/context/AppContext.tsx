import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Player,
  PointsSystem,
  Tournament,
  Match,
  MatchPlayerStat,
  Task,
  Investment,
  FinancialReturn,
  TaskStatus,
  UserRole,
  PlayerRole,
  PlayerStatus,
  MatchScreenshot,
  AuthSession
} from '../types';
import { supabase } from '../lib/supabase';

interface CachedCreds {
  email: string;
  password?: string;
}

interface AppContextType {
  // Auth & Current User
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  pendingUsers: User[];
  canApproveUsers: boolean;
  cachedCredentials: CachedCreds | null;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, password?: string, remember?: boolean) => { success: boolean; message: string };
  logout: () => void;
  registerUser: (userData: Omit<User, 'id' | 'status'>) => { success: boolean; message: string };
  approveUser: (userId: string) => { success: boolean; message: string };
  rejectUser: (userId: string) => { success: boolean; message: string };

  // Players & Permissions (Master Admin, Coach, IGL, Admin can manage; Admin & IGL can change role & starters)
  players: Player[];
  canManageRoster: boolean;
  canChangePlayerRole: boolean;
  addPlayer: (player: Omit<Player, 'id'>) => { success: boolean; message: string };
  updatePlayer: (id: string, player: Partial<Player>) => { success: boolean; message: string };
  deletePlayer: (id: string) => { success: boolean; message: string };
  swapStarter: (currentStarterId: string, standbyPlayerId: string) => { success: boolean; message: string };

  // Points Systems
  pointsSystems: PointsSystem[];
  activePointsSystem: PointsSystem;
  updatePointsSystem: (system: PointsSystem) => void;
  calculatePoints: (placement: number, kills: number, systemId?: string) => {
    placementPoints: number;
    killPoints: number;
    totalPoints: number;
  };

  // Tournaments
  tournaments: Tournament[];
  addTournament: (tournament: Omit<Tournament, 'id'>) => void;
  updateTournament: (id: string, tournament: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;

  // Matches, Stats & Screenshots
  matches: Match[];
  playerStats: MatchPlayerStat[];
  addMatchWithStats: (
    matchData: Omit<Match, 'id'>,
    stats: Array<Omit<MatchPlayerStat, 'id' | 'match_id' | 'placement_points' | 'kill_points' | 'total_points'>>,
    screenshot?: Omit<MatchScreenshot, 'id' | 'match_id' | 'uploaded_at'>
  ) => void;
  deleteMatch: (matchId: string) => void;
  updateScreenshot: (matchId: string, name: string, description: string) => void;
  deleteScreenshot: (matchId: string) => void;

  // Tasks
  tasks: Task[];
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'comments'>) => void;
  editTask: (id: string, updated: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => { success: boolean; message: string };
  addTaskComment: (taskId: string, commentText: string) => void;

  // Financial Ledger (Investments & Returns)
  investments: Investment[];
  returns: FinancialReturn[];
  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  updateInvestment: (id: string, updated: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  addReturn: (ret: Omit<FinancialReturn, 'id'>) => void;
  updateReturn: (id: string, updated: Partial<FinancialReturn>) => void;
  deleteReturn: (id: string) => void;

  // Reset Data
  resetToSeedData: () => void;
}

const STORAGE_KEY = 'inhumans_esports_real_v1';
const SESSION_KEY = 'inhumans_auth_session';
const CACHED_CREDS_KEY = 'inhumans_cached_credentials';
const ONE_HOUR_MS = 60 * 60 * 1000;

// Default Master Admin account configured per user instructions
const INITIAL_USERS: User[] = [
  {
    id: 'u_master_shaam',
    name: 'Shaam',
    email: 'vedhanayagant2000@gmail.com',
    password: '@Vedha9626',
    role: 'master_admin',
    avatar: '👑',
    status: 'active',
    created_at: '2026-09-08T00:00:00.000Z'
  }
];

// Standard Points Systems presets ready for match scoring
const INITIAL_POINTS_SYSTEMS: PointsSystem[] = [
  {
    id: 'ps_bgis_official',
    name: 'BGIS Official 10-Point System',
    is_default: true,
    placement_points: { 1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 },
    default_placement_points: 0,
    kill_point_value: 1
  },
  {
    id: 'ps_legacy_15pt',
    name: 'Legacy 15-Point System (Old PMCO)',
    is_default: false,
    placement_points: { 1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1, 9: 1, 10: 1, 11: 1 },
    default_placement_points: 0,
    kill_point_value: 1
  }
];

// COMPLETELY EMPTY INITIAL DATA FOR REAL ESPORTS USAGE
const INITIAL_PLAYERS: Player[] = [];
const INITIAL_TOURNAMENTS: Tournament[] = [];
const INITIAL_MATCHES: Match[] = [];
const INITIAL_STATS: MatchPlayerStat[] = [];
const INITIAL_TASKS: Task[] = [];
const INITIAL_INVESTMENTS: Investment[] = [];
const INITIAL_RETURNS: FinancialReturn[] = [];

// Helper to check 1-hour session validity
const getValidSession = (): User | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (session && session.expiresAt && session.expiresAt > Date.now()) {
      return session.user;
    }
    // Expired session: clear it so user is prompted to log in
    localStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

const getCachedCreds = (): CachedCreds | null => {
  try {
    const raw = localStorage.getItem(CACHED_CREDS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure default Master Admin always exists
        const hasMaster = parsed.some((u: User) => u.email.toLowerCase() === 'vedhanayagant2000@gmail.com');
        if (!hasMaster) {
          return [...INITIAL_USERS, ...parsed];
        }
        return parsed;
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  // Current session (starts as null if no valid 1-hour session)
  const [currentUser, setCurrentUser] = useState<User | null>(() => getValidSession());
  const [cachedCredentials, setCachedCredentials] = useState<CachedCreds | null>(() => getCachedCreds());

  // Empty Data States for Real Site Usage
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_players`);
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });

  const [pointsSystems, setPointsSystems] = useState<PointsSystem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_points_systems`);
    return saved ? JSON.parse(saved) : INITIAL_POINTS_SYSTEMS;
  });

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tournaments`);
    return saved ? JSON.parse(saved) : INITIAL_TOURNAMENTS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_matches`);
    return saved ? JSON.parse(saved) : INITIAL_MATCHES;
  });

  const [playerStats, setPlayerStats] = useState<MatchPlayerStat[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_stats`);
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_investments`);
    return saved ? JSON.parse(saved) : INITIAL_INVESTMENTS;
  });

  const [returns, setReturns] = useState<FinancialReturn[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_returns`);
    return saved ? JSON.parse(saved) : INITIAL_RETURNS;
  });

  // Persist users and data
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_players`, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_points_systems`, JSON.stringify(pointsSystems));
  }, [pointsSystems]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_tournaments`, JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_matches`, JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_stats`, JSON.stringify(playerStats));
  }, [playerStats]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_investments`, JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_returns`, JSON.stringify(returns));
  }, [returns]);

  // Periodic 1-hour session expiration check (checks every 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      const active = getValidSession();
      if (!active && currentUser) {
        // Expired after 1 hour
        setCurrentUser(null);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Live Supabase Sync & Realtime Listeners
  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const fetchAllData = async () => {
      try {
        // 1. Live Users
        const { data: usersData, error: usersErr } = await client.from('users').select('*');
        if (!usersErr && usersData && usersData.length > 0) {
          const mappedUsers: User[] = usersData.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            password: u.password,
            role: (u.email.toLowerCase() === 'vedhanayagant2000@gmail.com' ? 'master_admin' : u.role) as any,
            status: u.is_approved ? 'active' : 'pending_approval',
            created_at: u.created_at,
            igid: u.igid
          }));
          setUsers(mappedUsers);
        }

        // 2. Live Players
        const { data: playersData, error: playersErr } = await client.from('players').select('*');
        let mappedPlayers: Player[] = [];
        if (!playersErr && playersData && playersData.length > 0) {
          mappedPlayers = playersData.map((p: any) => ({
            id: p.id,
            name: p.name,
            ign: p.in_game_name || p.name,
            igid: p.igid || 'Pending',
            role: (p.role as PlayerRole) || 'assault',
            status: (p.status as PlayerStatus) || 'starter',
            join_date: p.joined_date || new Date().toISOString().split('T')[0],
            avatar: p.avatar
          }));
        }

        // Ensure all approved IGLs and Players from usersData exist in mappedPlayers
        if (usersData && usersData.length > 0) {
          const approvedRosterUsers = usersData.filter((u: any) => u.is_approved && (u.role === 'igl' || u.role === 'player'));
          approvedRosterUsers.forEach((u: any) => {
            const exists = mappedPlayers.some(p => p.name.toLowerCase() === u.name.toLowerCase() || p.id === u.id || p.id === `p_${u.id}`);
            if (!exists) {
              const currentStarters = mappedPlayers.filter(p => p.status === 'starter').length;
              const newCard: Player = {
                id: `p_${u.id}`,
                name: u.name,
                ign: u.name.toUpperCase(),
                igid: u.igid || 'Pending IGID',
                role: u.role === 'igl' ? 'igl' : 'assault',
                status: currentStarters < 4 ? 'starter' : 'standby',
                join_date: u.created_at ? u.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
              };
              mappedPlayers.push(newCard);
              client.from('players').insert({
                id: newCard.id,
                name: newCard.name,
                in_game_name: newCard.ign,
                igid: newCard.igid,
                role: newCard.role,
                status: newCard.status,
                joined_date: newCard.join_date
              }).then(() => {});
            }
          });
        }
        setPlayers(mappedPlayers);

        // 3. Live Tournaments
        const { data: tournData, error: tournErr } = await client.from('tournaments').select('*');
        if (!tournErr && tournData && tournData.length > 0) {
          const mappedTourn: Tournament[] = tournData.map((t: any) => ({
            id: t.id,
            name: t.name,
            organizer: t.organizer || '',
            tier: t.tier,
            status: t.status || 'available',
            prize_pool: Number(t.prize_pool) || 0,
            start_date: t.start_date || '',
            end_date: t.end_date || '',
            format: 'TPP',
            entry_fee: 0,
            points_system_id: 'ps_official',
            apply_link: t.apply_link,
            contact_info: t.contact_info
          }));
          setTournaments(mappedTourn);
        }

        // 4. Live Matches
        const { data: matchData, error: matchErr } = await client.from('matches').select('*');
        if (!matchErr && matchData && matchData.length > 0) {
          const mappedMatches: Match[] = matchData.map((m: any) => ({
            id: m.id,
            tournament_id: m.tournament_id,
            match_number: m.match_number,
            map: m.map as any,
            match_date: m.date || new Date().toISOString().split('T')[0],
            status: 'completed',
            screenshot: m.screenshot_url ? {
              id: `sc_${m.id}`,
              match_id: m.id,
              data_url: m.screenshot_url,
              name: m.screenshot_name || 'End Screen',
              description: m.notes || '',
              uploaded_at: m.created_at || new Date().toISOString()
            } : undefined
          }));
          setMatches(mappedMatches);
        }

        // 5. Live Tasks
        const { data: tasksData, error: tasksErr } = await client.from('tasks').select('*');
        if (!tasksErr && tasksData && tasksData.length > 0) {
          const mappedTasks: Task[] = tasksData.map((tk: any) => ({
            id: tk.id,
            title: tk.title,
            description: tk.description || '',
            category: (tk.category as any) || 'tactics',
            assigned_by: 'Master Admin',
            assigned_to_squad: true,
            priority: (tk.priority as any) || 'medium',
            status: (tk.status as any) || 'assigned',
            due_date: tk.due_date || '',
            is_recurring: false,
            comments: [],
            created_at: tk.created_at || new Date().toISOString().split('T')[0]
          }));
          setTasks(mappedTasks);
        }

        // 6. Live Investments & Returns
        const { data: invData } = await client.from('investments').select('*');
        if (invData && invData.length > 0) {
          setInvestments(invData.map((i: any) => ({
            id: i.id,
            type: (i.category as any) || 'scrims',
            amount: Number(i.amount) || 0,
            spent_date: i.date || new Date().toISOString().split('T')[0],
            note: i.notes || i.title || 'Expense'
          })));
        }

        const { data: retData } = await client.from('returns').select('*');
        if (retData && retData.length > 0) {
          setReturns(retData.map((r: any) => ({
            id: r.id,
            type: (r.source as any) || 'prize',
            amount: Number(r.amount) || 0,
            received_date: r.date || new Date().toISOString().split('T')[0],
            note: r.notes || r.title || 'Income'
          })));
        }
      } catch (err) {
        console.warn('Supabase fetch failed:', err);
      }
    };

    fetchAllData();

    // Subscribe to realtime changes for instant multi-device reflection
    const channel = client
      .channel('public_realtime_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        client.from('users').select('*').then(({ data }) => {
          if (data && data.length > 0) {
            setUsers(data.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              password: u.password,
              role: (u.email.toLowerCase() === 'vedhanayagant2000@gmail.com' ? 'master_admin' : u.role) as any,
              status: u.is_approved ? 'active' : 'pending_approval',
              created_at: u.created_at,
              igid: u.igid
            })));
          }
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        client.from('players').select('*').then(({ data }) => {
          if (data) {
            setPlayers(data.map((p: any) => ({
              id: p.id,
              name: p.name,
              ign: p.in_game_name || p.name,
              igid: p.igid || 'Pending',
              role: p.role || 'assault',
              status: p.status || 'starter',
              join_date: p.joined_date || new Date().toISOString().split('T')[0],
              avatar: p.avatar
            })));
          }
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => {
        client.from('tournaments').select('*').then(({ data }) => {
          if (data) {
            setTournaments(data.map((t: any) => ({
              id: t.id,
              name: t.name,
              organizer: t.organizer || '',
              tier: t.tier,
              status: t.status || 'available',
              prize_pool: Number(t.prize_pool) || 0,
              start_date: t.start_date || '',
              end_date: t.end_date || '',
              format: 'TPP',
              entry_fee: 0,
              points_system_id: 'ps_official',
              apply_link: t.apply_link,
              contact_info: t.contact_info
            })));
          }
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        client.from('tasks').select('*').then(({ data }) => {
          if (data) {
            setTasks(data.map((tk: any) => ({
              id: tk.id,
              title: tk.title,
              description: tk.description || '',
              category: (tk.category as any) || 'tactics',
              assigned_by: 'Master Admin',
              assigned_to_squad: true,
              priority: (tk.priority as any) || 'medium',
              status: (tk.status as any) || 'assigned',
              due_date: tk.due_date || '',
              is_recurring: false,
              comments: [],
              created_at: tk.created_at || new Date().toISOString().split('T')[0]
            })));
          }
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'returns' }, () => {
        client.from('returns').select('*').then(({ data }) => {
          if (data) {
            setReturns(data.map((r: any) => ({
              id: r.id,
              type: (r.source as any) || 'prize',
              amount: Number(r.amount) || 0,
              received_date: r.date || new Date().toISOString().split('T')[0],
              note: r.notes || r.title || 'Income'
            })));
          }
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, () => {
        client.from('investments').select('*').then(({ data }) => {
          if (data) {
            setInvestments(data.map((i: any) => ({
              id: i.id,
              type: (i.category as any) || 'scrims',
              amount: Number(i.amount) || 0,
              spent_date: i.date || new Date().toISOString().split('T')[0],
              note: i.notes || i.title || 'Expense'
            })));
          }
        });
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  // -------------------------------------------------------------
  // AUTHENTICATION & APPROVALS
  // -------------------------------------------------------------
  const login = (email: string, password?: string, remember = true): { success: boolean; message: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!user) {
      return { success: false, message: 'No account found with this email address.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Incorrect password entered.' };
    }

    if (user.status === 'pending_approval') {
      const neededBy = (user.role === 'admin' || user.role === 'igl' || user.role === 'coach')
        ? 'Master Admin (Shaam)'
        : 'Master Admin or Admin/IGL';
      return {
        success: false,
        message: `Account is pending approval from ${neededBy}. Please wait for your account to be verified.`
      };
    }

    if (user.status === 'rejected') {
      return { success: false, message: 'Your registration was rejected by team administration.' };
    }

    // Set 1-hour unprompted session
    const session: AuthSession = {
      user,
      token: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      expiresAt: Date.now() + ONE_HOUR_MS
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Save remembered credentials in cache for direct 1-click login
    if (remember) {
      const creds: CachedCreds = { email: user.email, password: user.password };
      localStorage.setItem(CACHED_CREDS_KEY, JSON.stringify(creds));
      setCachedCredentials(creds);
    }

    setCurrentUser(user);
    return { success: true, message: `Welcome back, ${user.name}!` };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  const registerUser = (userData: Omit<User, 'id' | 'status'>): { success: boolean; message: string } => {
    const trimmedEmail = userData.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (existing) {
      return { success: false, message: 'An account with this email address already exists.' };
    }

    const newUser: User = {
      ...userData,
      id: `u_${Date.now()}`,
      status: 'pending_approval',
      created_at: new Date().toISOString()
    };

    setUsers((prev) => [...prev, newUser]);

    if (supabase) {
      supabase.from('users').insert({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        is_approved: false,
        igid: (newUser as any).igid || null
      }).then(({ error }) => {
        if (error) console.error('Supabase register error:', error);
      });
    }

    const authority = (newUser.role === 'admin' || newUser.role === 'igl' || newUser.role === 'coach')
      ? 'Master Admin (Shaam)'
      : 'Master Admin or Admin/IGL';

    return {
      success: true,
      message: `Account request submitted! Awaiting acceptance from ${authority} before login.`
    };
  };

  // Approvals & Permissions
  const isMasterAdmin = currentUser?.role === 'master_admin';
  const isAdminOrIgl = currentUser?.role === 'admin' || currentUser?.role === 'igl';
  const canApproveUsers = isMasterAdmin || isAdminOrIgl;

  // Pending users visible to the current logged-in user based on permission
  const pendingUsers = users.filter((u) => {
    if (u.status !== 'pending_approval') return false;
    if (isMasterAdmin) return true; // Master Admin sees all pending
    if (isAdminOrIgl) return u.role === 'player'; // Admin & IGL see pending Players
    return false;
  });

  const approveUser = (userId: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Must be logged in to approve users.' };
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User request not found.' };

    if (!isMasterAdmin) {
      if (isAdminOrIgl) {
        if (target.role !== 'player') {
          return { success: false, message: 'Permission Denied: Only Master Admin (Shaam) can approve Admins, IGLs, or Coaches.' };
        }
      } else {
        return { success: false, message: 'Permission Denied: You do not have approval privileges.' };
      }
    }

    const updatedUser: User = {
      ...target,
      status: 'active',
      approved_by: currentUser.name,
      approved_at: new Date().toISOString()
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    if (supabase) {
      supabase.from('users').update({ is_approved: true }).eq('id', userId).then(({ error }) => {
        if (error) console.error('Supabase approve error:', error);
      });
    }

    // If player or IGL approved, ensure player card exists in roster
    if (target.role === 'player' || target.role === 'igl') {
      const alreadyHasCard = players.some((p) => p.name.toLowerCase() === target.name.toLowerCase() || p.id === target.id);
      if (!alreadyHasCard) {
        const currentStarters = players.filter((p) => p.status === 'starter').length;
        const newPlayer: Player = {
          id: `p_${Date.now()}`,
          name: target.name,
          ign: target.name.toUpperCase(),
          igid: (target as any).igid || target.player_id || 'Pending IGID',
          role: target.role === 'igl' ? 'igl' : 'assault',
          status: currentStarters < 4 ? 'starter' : 'standby',
          join_date: new Date().toISOString().split('T')[0]
        };
        setPlayers((prev) => [...prev, newPlayer]);

        if (supabase) {
          supabase.from('players').insert({
            id: newPlayer.id,
            name: newPlayer.name,
            in_game_name: newPlayer.ign,
            igid: newPlayer.igid,
            role: newPlayer.role,
            status: newPlayer.status,
            joined_date: newPlayer.join_date
          }).then(({ error }) => {
            if (error) console.error('Supabase auto player insert error:', error);
          });
        }
      }
    }

    return { success: true, message: `${target.name} (${target.role.toUpperCase()}) approved successfully!` };
  };

  const rejectUser = (userId: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Must be logged in to reject users.' };
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User request not found.' };

    if (!isMasterAdmin && (!isAdminOrIgl || target.role !== 'player')) {
      return { success: false, message: 'Permission Denied: Cannot reject this account type.' };
    }

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' } : u)));

    if (supabase) {
      supabase.from('users').delete().eq('id', userId).then(({ error }) => {
        if (error) console.error('Supabase reject delete error:', error);
      });
    }

    return { success: true, message: `${target.name}'s registration request has been rejected.` };
  };

  // Permissions: Master Admin, Coach, IGL, and Admin can manage roster
  const canManageRoster = currentUser !== null && ['master_admin', 'coach', 'igl', 'admin'].includes(currentUser.role);
  const canChangePlayerRole = currentUser !== null && ['master_admin', 'admin', 'igl'].includes(currentUser.role);

  // Player CRUD with permission check
  const addPlayer = (playerData: Omit<Player, 'id'>) => {
    if (!canManageRoster) {
      return { success: false, message: 'Permission Denied: Only Master Admin, Coach, IGL, and Admin can add roster players.' };
    }

    // Check 4 starters limit if attempting to add as starter
    const currentStarters = players.filter((p) => p.status === 'starter').length;
    const finalStatus: PlayerStatus = (playerData.status === 'starter' && currentStarters >= 4)
      ? 'standby'
      : playerData.status;

    const newPlayer: Player = {
      ...playerData,
      status: finalStatus,
      id: `p_${Date.now()}`
    };
    setPlayers((prev) => [...prev, newPlayer]);

    if (supabase) {
      supabase.from('players').insert({
        id: newPlayer.id,
        name: newPlayer.name,
        in_game_name: newPlayer.ign,
        igid: newPlayer.igid,
        role: newPlayer.role,
        status: newPlayer.status,
        joined_date: newPlayer.join_date,
        avatar: newPlayer.avatar || null
      }).then(({ error }) => {
        if (error) console.error('Supabase add player error:', error);
      });
    }

    const notice = (playerData.status === 'starter' && currentStarters >= 4)
      ? ' (Added to Standby because 4 starters already exist)'
      : '';

    return { success: true, message: `Player ${newPlayer.ign} added to roster${notice}.` };
  };

  const updatePlayer = (id: string, updatedFields: Partial<Player>): { success: boolean; message: string } => {
    const target = players.find(p => p.id === id);
    if (!target) return { success: false, message: 'Player not found.' };

    const isOwnProfile = currentUser && (
      currentUser.name.toLowerCase() === target.name.toLowerCase() ||
      currentUser.email.toLowerCase() === target.name.toLowerCase()
    );

    if (!canManageRoster && !isOwnProfile) {
      return { success: false, message: 'Permission Denied: You cannot edit this player profile.' };
    }

    const fieldsToApply: Partial<Player> = { ...updatedFields };

    // Player only has privilege to change their details, NOT assigned role or starter status
    if (!canChangePlayerRole) {
      delete fieldsToApply.role;
      delete fieldsToApply.status;
    } else if (fieldsToApply.status === 'starter' && target.status !== 'starter') {
      const currentStarters = players.filter(p => p.status === 'starter' && p.id !== id);
      if (currentStarters.length >= 4) {
        return { success: false, message: 'Starter squad is full (4/4). Please swap with an existing starter.' };
      }
    }

    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...fieldsToApply } : p)));

    if (supabase) {
      const updates: any = {};
      if (fieldsToApply.name) updates.name = fieldsToApply.name;
      if (fieldsToApply.ign) updates.in_game_name = fieldsToApply.ign;
      if (fieldsToApply.igid) updates.igid = fieldsToApply.igid;
      if (fieldsToApply.role) updates.role = fieldsToApply.role;
      if (fieldsToApply.status) updates.status = fieldsToApply.status;
      supabase.from('players').update(updates).eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase update player error:', error);
      });
    }

    return { success: true, message: `${target.ign} details updated.` };
  };

  const swapStarter = (currentStarterId: string, standbyPlayerId: string): { success: boolean; message: string } => {
    if (!canChangePlayerRole) {
      return { success: false, message: 'Permission Denied: Only Master Admin, Admin, and IGL can swap squad starters.' };
    }

    const starter = players.find(p => p.id === currentStarterId);
    const standby = players.find(p => p.id === standbyPlayerId);

    if (!starter || !standby) {
      return { success: false, message: 'Selected players not found.' };
    }

    setPlayers(prev => prev.map(p => {
      if (p.id === currentStarterId) return { ...p, status: 'standby' };
      if (p.id === standbyPlayerId) return { ...p, status: 'starter' };
      return p;
    }));

    if (supabase) {
      supabase.from('players').update({ status: 'standby' }).eq('id', currentStarterId).then(() => {});
      supabase.from('players').update({ status: 'starter' }).eq('id', standbyPlayerId).then(() => {});
    }

    return { success: true, message: `Swapped! ${standby.ign} is now a Starter; ${starter.ign} moved to Standby.` };
  };

  const deletePlayer = (id: string) => {
    if (!canChangePlayerRole && !canManageRoster) {
      return { success: false, message: 'Permission Denied: Only Master Admin, Admin, and IGL can remove players from squad.' };
    }
    setPlayers((prev) => prev.filter((p) => String(p.id) !== String(id)));
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_players`);
      if (saved) {
        const filtered = JSON.parse(saved).filter((p: any) => String(p.id) !== String(id));
        localStorage.setItem(`${STORAGE_KEY}_players`, JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }

    if (supabase) {
      supabase.from('players').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase delete player error:', error);
      });
    }

    return { success: true, message: 'Player removed from squad roster.' };
  };

  // Points Systems
  const activePointsSystem = pointsSystems.find((ps) => ps.is_default) || pointsSystems[0] || INITIAL_POINTS_SYSTEMS[0];

  const calculatePoints = (placement: number, kills: number, systemId?: string) => {
    const system = (systemId ? pointsSystems.find((ps) => ps.id === systemId) : null) || activePointsSystem;
    const placementPoints = system.placement_points[placement] !== undefined
      ? system.placement_points[placement]
      : system.default_placement_points;
    const killPoints = Number(kills) * (system.kill_point_value || 1);
    const totalPoints = placementPoints + killPoints;
    return { placementPoints, killPoints, totalPoints };
  };

  const updatePointsSystem = (system: PointsSystem) => {
    setPointsSystems((prev) =>
      prev.map((ps) => {
        if (ps.id === system.id) return system;
        if (system.is_default && ps.id !== system.id) return { ...ps, is_default: false };
        return ps;
      })
    );
  };

  // Tournament CRUD
  const addTournament = (data: Omit<Tournament, 'id'>) => {
    const newT: Tournament = { ...data, id: `t_${Date.now()}` };
    setTournaments((prev) => [newT, ...prev]);

    if (supabase) {
      supabase.from('tournaments').insert({
        id: newT.id,
        name: newT.name,
        organizer: newT.organizer,
        status: newT.status,
        prize_pool: String(newT.prize_pool),
        start_date: newT.start_date,
        end_date: newT.end_date,
        apply_link: newT.apply_link || null,
        contact_info: newT.contact_info || null
      }).then(({ error }) => {
        if (error) console.error('Supabase add tournament error:', error);
      });
    }
  };

  const updateTournament = (id: string, updated: Partial<Tournament>) => {
    setTournaments((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));

    if (supabase) {
      const updates: any = {};
      if (updated.name) updates.name = updated.name;
      if (updated.status) updates.status = updated.status;
      if (updated.apply_link !== undefined) updates.apply_link = updated.apply_link;
      if (updated.contact_info !== undefined) updates.contact_info = updated.contact_info;
      supabase.from('tournaments').update(updates).eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase update tournament error:', error);
      });
    }
  };

  // Matches, Stats, & Screenshot Management
  const addMatchWithStats = (
    matchData: Omit<Match, 'id'>,
    statsData: Array<Omit<MatchPlayerStat, 'id' | 'match_id' | 'placement_points' | 'kill_points' | 'total_points'>>,
    screenshotData?: Omit<MatchScreenshot, 'id' | 'match_id' | 'uploaded_at'>
  ) => {
    const newMatchId = `m_${Date.now()}`;
    let attachedScreenshot: MatchScreenshot | undefined = undefined;

    if (screenshotData && screenshotData.data_url) {
      attachedScreenshot = {
        id: `sc_${Date.now()}`,
        match_id: newMatchId,
        data_url: screenshotData.data_url,
        name: screenshotData.name || `Match ${matchData.match_number} End Screen`,
        description: screenshotData.description || 'Post-match scoreboard results',
        uploaded_at: new Date().toISOString()
      };
    }

    const newMatch: Match = {
      ...matchData,
      id: newMatchId,
      status: 'completed',
      screenshot: attachedScreenshot
    };

    const calculatedStats: MatchPlayerStat[] = statsData.map((stat, index) => {
      const { placementPoints, killPoints, totalPoints } = calculatePoints(
        stat.placement,
        stat.kills,
        matchData.tournament_id
      );

      return {
        ...stat,
        id: `stat_${Date.now()}_${index}`,
        match_id: newMatchId,
        placement_points: placementPoints,
        kill_points: killPoints,
        total_points: totalPoints
      };
    });

    setMatches((prev) => [newMatch, ...prev]);
    setPlayerStats((prev) => [...prev, ...calculatedStats]);

    if (supabase) {
      supabase.from('matches').insert({
        id: newMatch.id,
        tournament_id: newMatch.tournament_id,
        tournament_name: '',
        match_number: newMatch.match_number,
        map: newMatch.map,
        placement: statsData[0]?.placement || 1,
        kills: statsData.reduce((acc, curr) => acc + curr.kills, 0),
        total_points: calculatedStats.reduce((acc, curr) => acc + curr.total_points, 0),
        date: newMatch.match_date,
        screenshot_url: attachedScreenshot?.data_url || null,
        screenshot_name: attachedScreenshot?.name || null,
        notes: attachedScreenshot?.description || null
      }).then(({ error }) => {
        if (error) console.error('Supabase match insert error:', error);
      });
    }
  };

  const deleteMatch = (matchId: string) => {
    setMatches((prev) => prev.filter((m) => String(m.id) !== String(matchId)));
    setPlayerStats((prev) => prev.filter((s) => String(s.match_id) !== String(matchId)));
    try {
      const savedM = localStorage.getItem(`${STORAGE_KEY}_matches`);
      if (savedM) {
        const filtered = JSON.parse(savedM).filter((m: any) => String(m.id) !== String(matchId));
        localStorage.setItem(`${STORAGE_KEY}_matches`, JSON.stringify(filtered));
      }
      const savedS = localStorage.getItem(`${STORAGE_KEY}_stats`);
      if (savedS) {
        const filteredS = JSON.parse(savedS).filter((s: any) => String(s.match_id) !== String(matchId));
        localStorage.setItem(`${STORAGE_KEY}_stats`, JSON.stringify(filteredS));
      }
    } catch (e) {
      console.error(e);
    }

    if (supabase) {
      supabase.from('matches').delete().eq('id', matchId).then(({ error }) => {
        if (error) console.error('Supabase match delete error:', error);
      });
    }
  };

  const updateScreenshot = (matchId: string, name: string, description: string) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId && m.screenshot) {
          return {
            ...m,
            screenshot: {
              ...m.screenshot,
              name,
              description
            }
          };
        }
        return m;
      })
    );
  };

  const deleteScreenshot = (matchId: string) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          const { screenshot, ...rest } = m;
          return rest;
        }
        return m;
      })
    );
  };

  // Tasks Management
  const createTask = (taskData: Omit<Task, 'id' | 'created_at' | 'comments'>) => {
    const newTask: Task = {
      ...taskData,
      id: `tsk_${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0],
      comments: []
    };
    setTasks((prev) => [newTask, ...prev]);

    if (supabase) {
      supabase.from('tasks').insert({
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        assigned_to_name: 'Squad',
        priority: newTask.priority,
        status: newTask.status,
        category: newTask.category,
        due_date: newTask.due_date
      }).then(({ error }) => {
        if (error) console.error('Supabase task insert error:', error);
      });
    }
  };

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Please log in first.' };

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: 'Task not found' };

    // Permissions: Only Coach, IGL, or Admin can verify
    if (newStatus === 'verified' && !['master_admin', 'coach', 'igl', 'admin'].includes(currentUser.role)) {
      return { success: false, message: 'Only Master Admin, Coach, IGL, or Admin can verify drill completion.' };
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: newStatus,
            completed_by: newStatus === 'completed' ? currentUser.id : t.completed_by,
            verified_by: newStatus === 'verified' ? currentUser.id : t.verified_by
          };
        }
        return t;
      })
    );

    if (supabase) {
      supabase.from('tasks').update({ status: newStatus }).eq('id', taskId).then(({ error }) => {
        if (error) console.error('Supabase task status update error:', error);
      });
    }

    return { success: true, message: `Task moved to ${newStatus}` };
  };

  const addTaskComment = (taskId: string, commentText: string) => {
    if (!commentText.trim() || !currentUser) return;
    const newComment = {
      id: `c_${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_role: currentUser.role,
      comment: commentText.trim(),
      created_at: new Date().toLocaleString()
    };
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t))
    );
  };

  // Financial Ledger
  const addInvestment = (inv: Omit<Investment, 'id'>) => {
    const newInv = { ...inv, id: `inv_${Date.now()}` };
    setInvestments((prev) => [newInv, ...prev]);

    if (supabase) {
      supabase.from('investments').insert({
        id: newInv.id,
        title: newInv.note || 'Team Expense',
        category: newInv.type,
        amount: newInv.amount,
        date: newInv.spent_date,
        notes: newInv.note
      }).then(({ error }) => {
        if (error) console.error('Supabase add investment error:', error);
      });
    }
  };

  const addReturn = (ret: Omit<FinancialReturn, 'id'>) => {
    const newRet = { ...ret, id: `ret_${Date.now()}` };
    setReturns((prev) => [newRet, ...prev]);

    if (supabase) {
      supabase.from('returns').insert({
        id: newRet.id,
        title: newRet.note || 'Team Return',
        source: newRet.type,
        amount: newRet.amount,
        date: newRet.received_date,
        notes: newRet.note
      }).then(({ error }) => {
        if (error) console.error('Supabase add return error:', error);
      });
    }
  };

  // Tournament Delete
  const deleteTournament = (id: string) => {
    setTournaments((prev) => prev.filter((t) => String(t.id) !== String(id)));
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tournaments`);
      if (saved) {
        const filtered = JSON.parse(saved).filter((t: any) => String(t.id) !== String(id));
        localStorage.setItem(`${STORAGE_KEY}_tournaments`, JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
    if (supabase) {
      supabase.from('tournaments').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase delete tournament error:', error);
      });
    }
  };

  // Task Edit & Delete
  const editTask = (id: string, updated: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (String(t.id) === String(id) ? { ...t, ...updated } : t)));
    if (supabase) {
      const updates: any = {};
      if (updated.title) updates.title = updated.title;
      if (updated.description !== undefined) updates.description = updated.description;
      if (updated.priority) updates.priority = updated.priority;
      if (updated.category) updates.category = updated.category;
      if (updated.due_date) updates.due_date = updated.due_date;
      supabase.from('tasks').update(updates).eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase update task error:', error);
      });
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => String(t.id) !== String(id)));
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
      if (saved) {
        const filtered = JSON.parse(saved).filter((t: any) => String(t.id) !== String(id));
        localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
    if (supabase) {
      supabase.from('tasks').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase delete task error:', error);
      });
    }
  };

  // Financial Edit & Delete
  const updateInvestment = (id: string, updated: Partial<Investment>) => {
    setInvestments((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    if (supabase) {
      const updates: any = {};
      if (updated.note !== undefined) {
        updates.notes = updated.note;
        updates.title = updated.note;
      }
      if (updated.type) updates.category = updated.type;
      if (updated.amount !== undefined) updates.amount = updated.amount;
      if (updated.spent_date) updates.date = updated.spent_date;
      supabase.from('investments').update(updates).eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase update investment error:', error);
      });
    }
  };

  const deleteInvestment = (id: string) => {
    setInvestments((prev) => prev.filter((i) => String(i.id) !== String(id)));
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_investments`);
      if (saved) {
        const filtered = JSON.parse(saved).filter((i: any) => String(i.id) !== String(id));
        localStorage.setItem(`${STORAGE_KEY}_investments`, JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
    if (supabase) {
      supabase.from('investments').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase delete investment error:', error);
      });
    }
  };

  const updateReturn = (id: string, updated: Partial<FinancialReturn>) => {
    setReturns((prev) => prev.map((r) => (String(r.id) === String(id) ? { ...r, ...updated } : r)));
    if (supabase) {
      const updates: any = {};
      if (updated.note !== undefined) {
        updates.notes = updated.note;
        updates.title = updated.note;
      }
      if (updated.type) updates.source = updated.type;
      if (updated.amount !== undefined) updates.amount = updated.amount;
      if (updated.received_date) updates.date = updated.received_date;
      supabase.from('returns').update(updates).eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase update return error:', error);
      });
    }
  };

  const deleteReturn = (id: string) => {
    setReturns((prev) => prev.filter((r) => String(r.id) !== String(id)));
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_returns`);
      if (saved) {
        const filtered = JSON.parse(saved).filter((r: any) => String(r.id) !== String(id));
        localStorage.setItem(`${STORAGE_KEY}_returns`, JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
    if (supabase) {
      supabase.from('returns').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase delete return error:', error);
      });
    }
  };

  const resetToSeedData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_players`);
    localStorage.removeItem(`${STORAGE_KEY}_tournaments`);
    localStorage.removeItem(`${STORAGE_KEY}_matches`);
    localStorage.removeItem(`${STORAGE_KEY}_stats`);
    localStorage.removeItem(`${STORAGE_KEY}_tasks`);
    localStorage.removeItem(`${STORAGE_KEY}_investments`);
    localStorage.removeItem(`${STORAGE_KEY}_returns`);
    localStorage.removeItem(`${STORAGE_KEY}_users`);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CACHED_CREDS_KEY);

    setUsers(INITIAL_USERS);
    setPlayers(INITIAL_PLAYERS);
    setPointsSystems(INITIAL_POINTS_SYSTEMS);
    setTournaments(INITIAL_TOURNAMENTS);
    setMatches(INITIAL_MATCHES);
    setPlayerStats(INITIAL_STATS);
    setTasks(INITIAL_TASKS);
    setInvestments(INITIAL_INVESTMENTS);
    setReturns(INITIAL_RETURNS);
    setCurrentUser(null);
    setCachedCredentials(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        users,
        pendingUsers,
        canApproveUsers,
        cachedCredentials,
        setCurrentUser,
        login,
        logout,
        registerUser,
        approveUser,
        rejectUser,
        players,
        canManageRoster,
        canChangePlayerRole,
        addPlayer,
        updatePlayer,
        deletePlayer,
        swapStarter,
        pointsSystems,
        activePointsSystem,
        updatePointsSystem,
        calculatePoints,
        tournaments,
        addTournament,
        updateTournament,
        deleteTournament,
        matches,
        playerStats,
        addMatchWithStats,
        deleteMatch,
        updateScreenshot,
        deleteScreenshot,
        tasks,
        createTask,
        editTask,
        deleteTask,
        updateTaskStatus,
        addTaskComment,
        investments,
        returns,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addReturn,
        updateReturn,
        deleteReturn,
        resetToSeedData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
