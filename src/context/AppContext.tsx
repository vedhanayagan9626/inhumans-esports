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
  MatchScreenshot,
  AuthSession
} from '../types';

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

  // Players & Permissions (Master Admin, Coach, IGL, Admin can manage)
  players: Player[];
  canManageRoster: boolean;
  addPlayer: (player: Omit<Player, 'id'>) => { success: boolean; message: string };
  updatePlayer: (id: string, player: Partial<Player>) => { success: boolean; message: string };
  deletePlayer: (id: string) => { success: boolean; message: string };

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
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => { success: boolean; message: string };
  addTaskComment: (taskId: string, commentText: string) => void;

  // Financial Ledger (Investments & Returns)
  investments: Investment[];
  returns: FinancialReturn[];
  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  addReturn: (ret: Omit<FinancialReturn, 'id'>) => void;

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

    // If player approved, ensure player card exists in roster
    if (target.role === 'player') {
      const alreadyHasCard = players.some((p) => p.name.toLowerCase() === target.name.toLowerCase());
      if (!alreadyHasCard) {
        const newPlayer: Player = {
          id: `p_${Date.now()}`,
          name: target.name,
          ign: target.name.toUpperCase(),
          igid: 'Pending IGID',
          role: 'assault',
          status: 'starter',
          join_date: new Date().toISOString().split('T')[0]
        };
        setPlayers((prev) => [...prev, newPlayer]);
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
    return { success: true, message: `${target.name}'s registration request has been rejected.` };
  };

  // Permissions: Master Admin, Coach, IGL, and Admin can manage roster
  const canManageRoster = currentUser !== null && ['master_admin', 'coach', 'igl', 'admin'].includes(currentUser.role);

  // Player CRUD with permission check
  const addPlayer = (playerData: Omit<Player, 'id'>) => {
    if (!canManageRoster) {
      return { success: false, message: 'Permission Denied: Only Master Admin, Coach, IGL, and Admin can add roster players.' };
    }
    const newPlayer: Player = {
      ...playerData,
      id: `p_${Date.now()}`
    };
    setPlayers((prev) => [...prev, newPlayer]);
    return { success: true, message: `Player ${newPlayer.ign} added to roster.` };
  };

  const updatePlayer = (id: string, updatedFields: Partial<Player>) => {
    if (!canManageRoster) {
      return { success: false, message: 'Permission Denied: Only Master Admin, Coach, IGL, and Admin can edit player information.' };
    }
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
    return { success: true, message: 'Player details updated.' };
  };

  const deletePlayer = (id: string) => {
    if (!canManageRoster) {
      return { success: false, message: 'Permission Denied: Only Master Admin, Coach, IGL, and Admin can remove players.' };
    }
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    return { success: true, message: 'Player removed from roster.' };
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
  };

  const updateTournament = (id: string, updated: Partial<Tournament>) => {
    setTournaments((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
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
  };

  const deleteMatch = (matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    setPlayerStats((prev) => prev.filter((s) => s.match_id !== matchId));
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
    setInvestments((prev) => [{ ...inv, id: `inv_${Date.now()}` }, ...prev]);
  };

  const addReturn = (ret: Omit<FinancialReturn, 'id'>) => {
    setReturns((prev) => [{ ...ret, id: `ret_${Date.now()}` }, ...prev]);
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
        addPlayer,
        updatePlayer,
        deletePlayer,
        pointsSystems,
        activePointsSystem,
        updatePointsSystem,
        calculatePoints,
        tournaments,
        addTournament,
        updateTournament,
        matches,
        playerStats,
        addMatchWithStats,
        deleteMatch,
        updateScreenshot,
        deleteScreenshot,
        tasks,
        createTask,
        updateTaskStatus,
        addTaskComment,
        investments,
        returns,
        addInvestment,
        addReturn,
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
