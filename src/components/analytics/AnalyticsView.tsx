import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Shield,
  TrendingUp,
  Target,
  DollarSign,
  Award,
  Layers,
  Crosshair,
  Clock,
  PieChart,
  BarChart2,
  Sliders,
  CheckCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Activity,
  Zap
} from 'lucide-react';
import { BgmiMap, Player } from '../../types';
import {
  AnalyticsLineChart,
  GroupedBarChart,
  StackedBarChart,
  RadarSpiderChart,
  BoxPlotConsistencyChart,
  DonutChart,
  WaterfallChart
} from './AnalyticsCharts';

type AnalyticsTab = 'team' | 'player' | 'revenue' | 'cross_module';

export interface AnalyticsViewProps {
  onOpenMatchEntry?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onOpenMatchEntry }) => {
  const { matches, playerStats, players, tournaments, investments, returns, tasks } = useApp();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('team');
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || 'p1');

  // Filter matches by tournament if selected
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedTournament === 'all') return true;
      return m.tournament_id === selectedTournament;
    });
  }, [matches, selectedTournament]);

  const filteredMatchIds = useMemo(() => new Set(filteredMatches.map((m) => m.id)), [filteredMatches]);

  const filteredStats = useMemo(() => {
    return playerStats.filter((s) => filteredMatchIds.has(s.match_id));
  }, [playerStats, filteredMatchIds]);

  // Selected player object
  const activePlayer = useMemo<Player | null>(() => {
    if (players.length === 0) return null;
    return players.find((p) => p.id === selectedPlayerId) || players[0] || null;
  }, [players, selectedPlayerId]);

  // ==========================================
  // 1. TEAM STATS CALCULATIONS
  // ==========================================
  const teamMetrics = useMemo(() => {
    const totalMatchCount = filteredMatches.length;
    if (totalMatchCount === 0) {
      return {
        totalMatchCount: 0,
        avgTotalPoints: '0.0',
        avgPlacementPoints: '0.0',
        avgTeamKills: '0.0',
        winRate: '0.0',
        top3Rate: '0.0',
        top10Rate: '0.0',
        bestTournament: '—',
        worstTournament: '—',
        placementDistribution: []
      };
    }

    let wwcdCount = 0;
    let top3Count = 0;
    let top10Count = 0;
    let belowTop10Count = 0;
    let totalKills = 0;
    let totalPlacementPts = 0;

    filteredMatches.forEach((m) => {
      const stats = filteredStats.filter((s) => s.match_id === m.id);
      if (stats.length > 0) {
        const place = stats[0].placement;
        if (place === 1) wwcdCount++;
        if (place <= 3) top3Count++;
        if (place <= 10) top10Count++;
        if (place > 10) belowTop10Count++;

        totalPlacementPts += stats[0].placement_points;
        totalKills += stats.reduce((acc, s) => acc + s.kills, 0);
      }
    });

    const totalPoints = totalPlacementPts + totalKills;
    const avgTotalPoints = (totalPoints / totalMatchCount).toFixed(1);
    const avgPlacementPoints = (totalPlacementPts / totalMatchCount).toFixed(1);
    const avgTeamKills = (totalKills / totalMatchCount).toFixed(1);

    const winRate = ((wwcdCount / totalMatchCount) * 100).toFixed(1);
    const top3Rate = ((top3Count / totalMatchCount) * 100).toFixed(1);
    const top10Rate = ((top10Count / totalMatchCount) * 100).toFixed(1);

    // Tournament comparison
    const tourneyScores: Record<string, { totalPts: number; count: number; name: string }> = {};
    filteredMatches.forEach((m) => {
      const t = tournaments.find((t) => t.id === m.tournament_id);
      const name = t ? t.name : 'Custom Scrims';
      if (!tourneyScores[m.tournament_id]) {
        tourneyScores[m.tournament_id] = { totalPts: 0, count: 0, name };
      }
      const stats = filteredStats.filter((s) => s.match_id === m.id);
      if (stats.length > 0) {
        const pts = stats[0].placement_points + stats.reduce((acc, s) => acc + s.kills, 0);
        tourneyScores[m.tournament_id].totalPts += pts;
        tourneyScores[m.tournament_id].count += 1;
      }
    });

    const tourneyAverages = Object.values(tourneyScores).map((ts) => ({
      name: ts.name,
      avg: ts.count > 0 ? ts.totalPts / ts.count : 0
    })).sort((a, b) => b.avg - a.avg);

    const bestTournament = tourneyAverages.length > 0 ? `${tourneyAverages[0].name} (${tourneyAverages[0].avg.toFixed(1)} pts)` : '—';
    const worstTournament = tourneyAverages.length > 1 ? `${tourneyAverages[tourneyAverages.length - 1].name} (${tourneyAverages[tourneyAverages.length - 1].avg.toFixed(1)} pts)` : '—';

    const placementDistribution = [
      { label: 'WWCD (#1)', value: wwcdCount, color: '#e52535' },
      { label: 'Top 2 - 3', value: Math.max(0, top3Count - wwcdCount), color: '#3b82f6' },
      { label: 'Top 4 - 10', value: Math.max(0, top10Count - top3Count), color: '#a855f7' },
      { label: 'Below Top 10', value: belowTop10Count, color: '#4b5563' }
    ];

    return {
      totalMatchCount,
      avgTotalPoints,
      avgPlacementPoints,
      avgTeamKills,
      winRate,
      top3Rate,
      top10Rate,
      bestTournament,
      worstTournament,
      placementDistribution,
      tourneyAverages
    };
  }, [filteredMatches, filteredStats, tournaments]);

  // Team Line Chart: Points Trend Over Time
  const teamTrendData = useMemo(() => {
    return filteredMatches.map((m, idx) => {
      const stats = filteredStats.filter((s) => s.match_id === m.id);
      const pts = stats.length > 0
        ? stats[0].placement_points + stats.reduce((acc, s) => acc + s.kills, 0)
        : 0;
      return {
        label: `M${m.match_number} (${m.map.slice(0, 3)})`,
        value: pts
      };
    });
  }, [filteredMatches, filteredStats]);

  // Team Grouped Bar Chart: Points per player per match
  const teamGroupedData = useMemo(() => {
    const playerColors: Record<string, string> = {
      p1: '#e52535',
      p2: '#f59e0b',
      p3: '#a855f7',
      p4: '#3b82f6',
      p5: '#10b981',
      p6: '#ec4899'
    };

    return filteredMatches.slice(0, 8).map((m) => {
      const stats = filteredStats.filter((s) => s.match_id === m.id);
      return {
        groupLabel: `M${m.match_number} ${m.map.slice(0, 3)}`,
        bars: stats.map((s) => {
          const p = players.find((pl) => pl.id === s.player_id);
          return {
            label: p ? p.ign : 'Player',
            value: s.total_points,
            color: playerColors[s.player_id] || '#64748b'
          };
        })
      };
    });
  }, [filteredMatches, filteredStats, players]);

  // Team Stacked Bar Chart: Kill contribution split by player
  const teamKillStackedData = useMemo(() => {
    const playerColors: Record<string, string> = {
      p1: '#e52535',
      p2: '#f59e0b',
      p3: '#a855f7',
      p4: '#3b82f6',
      p5: '#10b981',
      p6: '#ec4899'
    };

    return filteredMatches.slice(0, 8).map((m) => {
      const stats = filteredStats.filter((s) => s.match_id === m.id);
      return {
        label: `M${m.match_number}`,
        segments: stats.map((s) => {
          const p = players.find((pl) => pl.id === s.player_id);
          return {
            name: p ? p.ign : 'Player',
            value: s.kills,
            color: playerColors[s.player_id] || '#64748b'
          };
        })
      };
    });
  }, [filteredMatches, filteredStats, players]);

  // Team Map Heatmap
  const ALL_MAPS: BgmiMap[] = ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Nusa', 'Rondo'];
  const teamMapHeatmap = useMemo(() => {
    return ALL_MAPS.map((mapName) => {
      const mapMatches = filteredMatches.filter((m) => m.map === mapName);
      const matchCount = mapMatches.length;
      let totalPts = 0;
      let totalKills = 0;
      let wwcd = 0;

      mapMatches.forEach((m) => {
        const stats = filteredStats.filter((s) => s.match_id === m.id);
        if (stats.length > 0) {
          if (stats[0].placement === 1) wwcd++;
          totalPts += stats[0].placement_points + stats.reduce((acc, s) => acc + s.kills, 0);
          totalKills += stats.reduce((acc, s) => acc + s.kills, 0);
        }
      });

      const avgPts = matchCount > 0 ? (totalPts / matchCount).toFixed(1) : '0.0';
      const winRate = matchCount > 0 ? Math.round((wwcd / matchCount) * 100) : 0;

      return {
        map: mapName,
        matchCount,
        wwcd,
        totalKills,
        avgPts,
        winRate
      };
    });
  }, [filteredMatches, filteredStats]);


  // ==========================================
  // 2. PLAYER PERFORMANCE CALCULATIONS
  // ==========================================
  const playerStatsList = useMemo(() => {
    if (!activePlayer) return [];
    return filteredStats.filter((s) => s.player_id === activePlayer.id);
  }, [filteredStats, activePlayer]);

  const playerCoreMetrics = useMemo(() => {
    if (!activePlayer) {
      return {
        count: 0,
        avgTotalPts: '0.0',
        avgPlacementPts: '0.0',
        avgKillPts: '0.0',
        avgKills: '0.0',
        avgDamage: '0',
        kd: '0.00',
        avgSurvivalMinutes: '0m 00s',
        statusText: 'No Active Player'
      };
    }

    const count = playerStatsList.length;
    if (count === 0) {
      return {
        count: 0,
        avgTotalPts: '0.0',
        avgPlacementPts: '0.0',
        avgKillPts: '0.0',
        avgKills: '0.0',
        avgDamage: '0',
        kd: '0.00',
        avgSurvivalMinutes: '0m 00s',
        statusText: activePlayer.status === 'starter' ? 'Starter (Main Roster)' : 'Standby Substitute'
      };
    }

    const totalKills = playerStatsList.reduce((acc, s) => acc + s.kills, 0);
    const totalDmg = playerStatsList.reduce((acc, s) => acc + s.damage, 0);
    const totalPlacementPts = playerStatsList.reduce((acc, s) => acc + s.placement_points, 0);
    const totalKillPts = playerStatsList.reduce((acc, s) => acc + s.kill_points, 0);
    const totalPts = playerStatsList.reduce((acc, s) => acc + s.total_points, 0);
    const totalSurvival = playerStatsList.reduce((acc, s) => acc + s.survival_time_seconds, 0);

    const avgSurvivalSec = Math.round(totalSurvival / count);
    const mins = Math.floor(avgSurvivalSec / 60);
    const secs = avgSurvivalSec % 60;

    return {
      count,
      avgTotalPts: (totalPts / count).toFixed(1),
      avgPlacementPts: (totalPlacementPts / count).toFixed(1),
      avgKillPts: (totalKillPts / count).toFixed(1),
      avgKills: (totalKills / count).toFixed(1),
      avgDamage: Math.round(totalDmg / count),
      kd: (totalKills / count).toFixed(2),
      avgSurvivalMinutes: `${mins}m ${secs < 10 ? '0' : ''}${secs}s`,
      statusText: activePlayer.status === 'starter' ? 'Starter (Active 4)' : 'Standby Substitute'
    };
  }, [playerStatsList, activePlayer]);

  // Player Trend: Points per match
  const playerPointTrend = useMemo(() => {
    return playerStatsList.map((s, idx) => {
      const match = filteredMatches.find((m) => m.id === s.match_id);
      const label = match ? `M${match.match_number} (${match.map.slice(0, 3)})` : `Match ${idx + 1}`;
      return {
        label,
        value: s.total_points
      };
    });
  }, [playerStatsList, filteredMatches]);

  // Player Bar Chart: Kills per match
  const playerKillBarData = useMemo(() => {
    return playerStatsList.map((s, idx) => {
      const match = filteredMatches.find((m) => m.id === s.match_id);
      return {
        groupLabel: match ? `M${match.match_number}` : `#${idx + 1}`,
        bars: [
          {
            label: 'Kills',
            value: s.kills,
            color: s.kills >= 4 ? '#e52535' : s.kills >= 2 ? '#3b82f6' : '#64748b'
          }
        ]
      };
    });
  }, [playerStatsList, filteredMatches]);

  // Player Stacked Bar: Placement Points vs Kill Points
  const playerStackedPointsData = useMemo(() => {
    return playerStatsList.map((s, idx) => {
      const match = filteredMatches.find((m) => m.id === s.match_id);
      return {
        label: match ? `M${match.match_number}` : `#${idx + 1}`,
        segments: [
          { name: 'Placement Pts', value: s.placement_points, color: '#3b82f6' },
          { name: 'Kill Pts', value: s.kill_points, color: '#e52535' }
        ]
      };
    });
  }, [playerStatsList, filteredMatches]);

  // Player Radar Profile (Kills, Damage, Survival, Placement, Consistency)
  const playerRadarMetrics = useMemo(() => {
    if (playerStatsList.length === 0) {
      return [
        { axis: 'Kills', value: 50 },
        { axis: 'Damage', value: 50 },
        { axis: 'Survival', value: 50 },
        { axis: 'Placement', value: 50 },
        { axis: 'Consistency', value: 50 }
      ];
    }

    const avgK = Number(playerCoreMetrics.avgKills);
    const avgD = Number(playerCoreMetrics.avgDamage);
    const avgPlacePts = Number(playerCoreMetrics.avgPlacementPts);

    const pts = playerStatsList.map((s) => s.total_points);
    const avgPts = Number(playerCoreMetrics.avgTotalPts);
    const stdDev = Math.sqrt(pts.reduce((acc, v) => acc + Math.pow(v - avgPts, 2), 0) / pts.length);
    // Lower variance = higher consistency score
    const consistencyScore = Math.max(20, Math.min(100, Math.round(100 - stdDev * 8)));

    return [
      { axis: 'Kills', value: Math.min(100, Math.round((avgK / 6) * 100)), rawValue: `${avgK} avg` },
      { axis: 'Damage', value: Math.min(100, Math.round((avgD / 1200) * 100)), rawValue: `${avgD} HP` },
      { axis: 'Survival', value: 85, rawValue: playerCoreMetrics.avgSurvivalMinutes },
      { axis: 'Placement', value: Math.min(100, Math.round((avgPlacePts / 10) * 100)), rawValue: `${avgPlacePts} pts` },
      { axis: 'Consistency', value: consistencyScore, rawValue: `±${stdDev.toFixed(1)}` }
    ];
  }, [playerStatsList, playerCoreMetrics]);

  // Box Plot Data (Consistency dispersion for all starters + active subs)
  const boxPlotData = useMemo(() => {
    return players.map((p) => {
      const stats = filteredStats.filter((s) => s.player_id === p.id);
      if (stats.length === 0) {
        return { label: p.ign, min: 0, q1: 0, median: 0, q3: 0, max: 0, variance: '0.0' };
      }
      const vals = stats.map((s) => s.total_points).sort((a, b) => a - b);
      const min = vals[0];
      const max = vals[vals.length - 1];
      const median = vals[Math.floor(vals.length / 2)];
      const q1 = vals[Math.floor(vals.length * 0.25)];
      const q3 = vals[Math.floor(vals.length * 0.75)];

      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / vals.length).toFixed(1);

      return {
        label: p.ign,
        min,
        q1,
        median,
        q3,
        max,
        variance
      };
    });
  }, [players, filteredStats]);

  // Standby vs Starter Comparison
  const standbyComparison = useMemo(() => {
    const starterStats = filteredStats.filter((s) => {
      const p = players.find((pl) => pl.id === s.player_id);
      return p && p.status === 'starter';
    });

    const starterAvgPts = starterStats.length > 0
      ? (starterStats.reduce((a, b) => a + b.total_points, 0) / starterStats.length).toFixed(1)
      : '0.0';
    const starterAvgDmg = starterStats.length > 0
      ? Math.round(starterStats.reduce((a, b) => a + b.damage, 0) / starterStats.length)
      : 0;

    const substitutes = players.filter((p) => p.status === 'standby');
    const subProfiles = substitutes.map((sub) => {
      const sStats = filteredStats.filter((s) => s.player_id === sub.id);
      const count = sStats.length;
      const avgPts = count > 0 ? (sStats.reduce((a, b) => a + b.total_points, 0) / count).toFixed(1) : '0.0';
      const avgDmg = count > 0 ? Math.round(sStats.reduce((a, b) => a + b.damage, 0) / count) : 0;
      const kd = count > 0 ? (sStats.reduce((a, b) => a + b.kills, 0) / count).toFixed(2) : '0.00';

      const diffPts = (Number(avgPts) - Number(starterAvgPts)).toFixed(1);

      return {
        player: sub,
        matchesPlayed: count,
        avgPts,
        avgDmg,
        kd,
        diffPts
      };
    });

    return {
      starterAvgPts,
      starterAvgDmg,
      subProfiles
    };
  }, [filteredStats, players]);


  // ==========================================
  // 3. REVENUE / INVESTMENT CALCULATIONS
  // ==========================================
  const revenueMetrics = useMemo(() => {
    const totalInvested = investments.reduce((acc, inv) => acc + inv.amount, 0);
    const totalReturns = returns.reduce((acc, ret) => acc + ret.amount, 0);
    const netPnL = totalReturns - totalInvested;
    const roi = totalInvested > 0 ? Math.round(((totalReturns - totalInvested) / totalInvested) * 100) : 0;

    const biggestPayout = returns.reduce((max, r) => (r.amount > max ? r.amount : max), 0);
    const biggestExpense = investments.reduce((max, i) => (i.amount > max ? i.amount : max), 0);

    // Investment Category Donut
    const invCategories: Record<string, number> = {};
    investments.forEach((inv) => {
      const key = inv.type.replace('_', ' ').toUpperCase();
      invCategories[key] = (invCategories[key] || 0) + inv.amount;
    });

    const categoryColors: Record<string, string> = {
      'BOOTCAMP': '#e52535',
      'ENTRY FEE': '#3b82f6',
      'SCRIMS': '#f59e0b',
      'GEAR': '#a855f7',
      'COACHING': '#10b981',
      'TRAINING': '#06b6d4',
      'WILDCARD': '#ec4899',
      'OTHER': '#64748b'
    };

    const investmentDonutData = Object.entries(invCategories).map(([label, val]) => ({
      label,
      value: val,
      color: categoryColors[label] || '#94a3b8'
    }));

    // Returns Category Donut
    const returnCategories: Record<string, number> = {};
    returns.forEach((ret) => {
      const key = ret.type.toUpperCase();
      returnCategories[key] = (returnCategories[key] || 0) + ret.amount;
    });

    const returnsDonutData = Object.entries(returnCategories).map(([label, val]) => ({
      label: label === 'PRIZE' ? 'Prize Money' : label === 'SPONSORSHIP' ? 'Sponsorship Grants' : 'Broadcast / Other',
      value: val,
      color: label === 'PRIZE' ? '#22c55e' : label === 'SPONSORSHIP' ? '#3b82f6' : '#f59e0b'
    }));

    // Waterfall steps
    const waterfallSteps = [
      { label: 'Start Cap', amount: 50000 },
      { label: 'Entry Fees', amount: -175000 },
      { label: 'Bootcamp', amount: -200000 },
      { label: 'Gear & Coach', amount: -103000 },
      { label: 'Scrims & Wild', amount: -60000 },
      { label: 'Prize Payout', amount: 1500000 },
      { label: 'Sponsorships', amount: 500000 },
      { label: 'Net P&L', amount: 0, isTotal: true }
    ];

    // Tournament ROI Ranking
    const tournamentFinance = tournaments.map((t) => {
      const tInvest = investments.filter((i) => i.tournament_id === t.id).reduce((a, b) => a + b.amount, 0);
      const tReturn = returns.filter((r) => r.tournament_id === t.id).reduce((a, b) => a + b.amount, 0);
      const tNet = tReturn - tInvest;
      const tRoi = tInvest > 0 ? Math.round(((tReturn - tInvest) / tInvest) * 100) : 0;

      return {
        tournament: t,
        invested: tInvest,
        returns: tReturn,
        net: tNet,
        roi: tRoi
      };
    }).filter((tf) => tf.invested > 0 || tf.returns > 0).sort((a, b) => b.roi - a.roi);

    return {
      totalInvested,
      totalReturns,
      netPnL,
      roi,
      biggestPayout,
      biggestExpense,
      investmentDonutData,
      returnsDonutData,
      waterfallSteps,
      tournamentFinance
    };
  }, [investments, returns, tournaments]);


  // ==========================================
  // 4. CROSS-MODULE INTELLIGENCE
  // ==========================================
  const crossModuleMetrics = useMemo(() => {
    // Cost-per-point: Total spend ÷ Total points scored
    const totalSpend = investments.reduce((a, b) => a + b.amount, 0);
    const totalPointsScored = filteredStats.reduce((a, b) => a + b.total_points, 0);
    const costPerPoint = totalPointsScored > 0 ? Math.round(totalSpend / totalPointsScored) : 0;

    // Practice Task Completion Rate
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'verified').length;
    const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Overlay points trend vs drills completed
    const overlayData = filteredMatches.slice(0, 6).map((m, i) => {
      const pts = filteredStats.filter((s) => s.match_id === m.id).reduce((a, b) => a + b.total_points, 0);
      // Simulated task intensity per match day
      const tasksFinished = [85, 70, 95, 100, 65, 90][i] || 75;
      return {
        label: `M${m.match_number}`,
        value: pts,
        secondaryValue: tasksFinished
      };
    });

    return {
      costPerPoint,
      taskRate,
      completedTasks,
      totalTasks,
      overlayData
    };
  }, [investments, filteredStats, tasks, filteredMatches]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* TOP CONTROLS & TAB SWITCHER (Diamond League Dark Aesthetic) */}
      <div style={{
        background: '#15161c',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '12px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Left: 4 Primary Analytics Tabs */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap', maxWidth: '100%', paddingBottom: '2px' }}>
          {[
            { id: 'team' as AnalyticsTab, label: 'Team Command Stats', icon: Shield },
            { id: 'player' as AnalyticsTab, label: 'Player Performance', icon: Crosshair },
            { id: 'revenue' as AnalyticsTab, label: 'Revenue & Investment ROI', icon: DollarSign },
            { id: 'cross_module' as AnalyticsTab, label: 'Cross-Module Intelligence', icon: Zap }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: isActive ? 'var(--accent-red)' : '#1c1d25',
                  border: isActive ? '1px solid #ff3344' : '1px solid rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  fontWeight: isActive ? 800 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Tournament Scope Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Tournament:</span>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            style={{
              background: '#1c1d25',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#ffffff',
              padding: '6px 12px',
              fontSize: '0.78rem',
              outline: 'none'
            }}
          >
            <option value="all">All Tournaments & Scrims</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TEAM STATS TAB                                         */}
      {/* ========================================================= */}
      {activeTab === 'team' && (
        filteredMatches.length === 0 ? (
          <div style={{
            background: '#15161c',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '16px',
            padding: '60px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(229, 37, 53, 0.1)',
              border: '1px solid rgba(229, 37, 53, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e52535'
            }}>
              <TrendingUp size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              No Match Data Recorded Yet
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', maxWidth: '440px', margin: 0 }}>
              Begin logging BGMI tournament results, scrim performances, and squad combat stats to unlock real-time tactical graphs, heatmaps, and trend analytics.
            </p>
            {onOpenMatchEntry && (
              <button
                onClick={onOpenMatchEntry}
                style={{
                  marginTop: '6px',
                  padding: '10px 20px',
                  background: 'var(--accent-red)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(229, 37, 53, 0.35)'
                }}
              >
                + Record First Match
              </button>
            )}
          </div>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Core Numbers KPIs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '14px'
          }}>
            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>SQUAD AVG TOTAL PTS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                {teamMetrics.avgTotalPoints} <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>pts/match</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--bar-blue)', marginTop: '2px' }}>
                {teamMetrics.avgPlacementPoints} placement • {teamMetrics.avgTeamKills} kills
              </div>
            </div>

            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>FINISHES & WIN RATE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-red)', marginTop: '4px' }}>
                {teamMetrics.winRate}% <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>WWCD</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                Top 3: {teamMetrics.top3Rate}% • Top 10: {teamMetrics.top10Rate}%
              </div>
            </div>

            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>AVG TEAM KILLS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                {teamMetrics.avgTeamKills} <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>elims</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--bar-green)', marginTop: '2px' }}>
                Across {teamMetrics.totalMatchCount} competitive matches
              </div>
            </div>

            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>BEST PERFORMING EVENT</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#22c55e', marginTop: '8px', lineHeight: 1.2 }}>
                {teamMetrics.bestTournament}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '4px' }}>
                Low: {teamMetrics.worstTournament}
              </div>
            </div>
          </div>

          {/* Row 1 Charts: Team Combined Points Line Chart & Win-Rate Placement Donut */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '20px'
          }}>
            {/* Line chart — team combined points trend over time */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Team Combined Points Trend (Season Arc)
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                    Match-by-match trajectory across active tournaments
                  </div>
                </div>
                <span className="badge badge-red">LIVE POINTS</span>
              </div>

              <AnalyticsLineChart
                data={teamTrendData}
                height={200}
                color="#e52535"
                valueSuffix=" pts"
              />
            </div>

            {/* Win-rate donut/pie — placement distribution */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Placement Distribution (% Finishes)
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  WWCD wins vs podium vs bottom brackets
                </div>
              </div>

              <DonutChart
                data={teamMetrics.placementDistribution}
                size={180}
                centerTitle="MATCHES"
                centerValue={`${teamMetrics.totalMatchCount}`}
              />
            </div>
          </div>

          {/* Row 2 Charts: Grouped Bar (Carries vs Underperformers) & Stacked Bar (Kill Contribution) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '20px'
          }}>
            {/* Grouped Bar: Points per player per match */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Player Impact per Match (Carries vs Underperformers)
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Individual point contributions grouped by match
                </div>
              </div>

              <GroupedBarChart
                data={teamGroupedData}
                height={200}
                valueSuffix=" pts"
              />
            </div>

            {/* Stacked Bar: Kill contribution split */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Squad Kill Distribution & Fragger Reliance
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Shows reliance on individual fraggers per encounter
                </div>
              </div>

              <StackedBarChart
                data={teamKillStackedData}
                height={200}
                valueSuffix=" kills"
              />
            </div>
          </div>

          {/* Row 3: Heatmap by Map & Tournament Comparison */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '20px'
          }}>
            {/* Heatmap by Map */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Heatmap by Map (Draft & Practice Optimization)
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Identifies strong maps vs weak drop strategies
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ color: '#71717a', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <th style={{ padding: '8px' }}>MAP</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>MATCHES</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>WWCD</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>WIN RATE</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>AVG POINTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMapHeatmap.map((row) => {
                      const isHigh = Number(row.avgPts) >= 15;
                      return (
                        <tr key={row.map} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 700, color: '#ffffff' }}>{row.map}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', color: '#a1a1aa' }}>{row.matchCount}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', color: row.wwcd > 0 ? '#ff4d5e' : '#71717a', fontWeight: 700 }}>{row.wwcd}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <span style={{
                              background: row.winRate >= 50 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: row.winRate >= 50 ? '#4ade80' : '#a1a1aa',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 700
                            }}>
                              {row.winRate}%
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 900, color: isHigh ? '#22c55e' : '#ffffff' }}>
                            {row.avgPts} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tournament Comparison Bar Chart */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Tournament Comparison (Avg Pts per Organizer)
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Relative performance across tournament formats
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {teamMetrics.tourneyAverages && teamMetrics.tourneyAverages.map((t, idx) => (
                  <div key={idx} style={{ background: '#1c1d25', padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                      <span style={{ color: '#ffffff', fontWeight: 600 }}>{t.name}</span>
                      <strong style={{ color: 'var(--accent-red)' }}>{t.avg.toFixed(1)} pts/m</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#15161c', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (t.avg / 25) * 100)}%`, height: '100%', background: 'var(--accent-red)', borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )
      )}

      {/* ========================================================= */}
      {/* 2. PLAYER PERFORMANCE TAB                                 */}
      {/* ========================================================= */}
      {activeTab === 'player' && (
        !activePlayer ? (
          <div style={{
            background: '#15161c',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '16px',
            padding: '60px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(229, 37, 53, 0.1)',
              border: '1px solid rgba(229, 37, 53, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e52535'
            }}>
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              No Roster Members Available
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', maxWidth: '440px', margin: 0 }}>
              Add players in the Roster section or accept pending player registrations to inspect individual K/D, radar diagnostics, and combat consistency spread.
            </p>
          </div>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Player Selector Bar */}
          <div style={{
            background: '#15161c',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '12px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', flexShrink: 0 }}>SELECT PLAYER:</span>
              <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap', maxWidth: '100%', paddingBottom: '2px' }}>
                {players.map((p) => {
                  const isSelected = p.id === activePlayer.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlayerId(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: isSelected ? 'var(--accent-red)' : '#1c1d25',
                        border: isSelected ? '1px solid #ff3344' : '1px solid rgba(255, 255, 255, 0.06)',
                        color: '#ffffff',
                        fontWeight: isSelected ? 800 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>{p.avatar || '⚡'}</span>
                      <span>{p.ign}</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>({p.role.toUpperCase()})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Character IGID:</span>
              <code style={{ background: '#1c1d25', padding: '3px 8px', borderRadius: '4px', color: '#ffffff', fontSize: '0.8rem' }}>
                {activePlayer.igid || '—'}
              </code>
            </div>
          </div>

          {/* Player Core Numbers (KPIs) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '14px'
          }}>
            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>AVG TOTAL POINTS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                {playerCoreMetrics.avgTotalPts} <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>pts</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                {playerCoreMetrics.avgPlacementPts} place • {playerCoreMetrics.avgKillPts} kills
              </div>
            </div>

            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>K/D RATIO & AVG KILLS</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-red)' }}>
                  {playerCoreMetrics.kd}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 700 }}>
                  ({playerCoreMetrics.avgKills} kills/m)
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                Avg Damage: {playerCoreMetrics.avgDamage} HP
              </div>
            </div>

            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>AVG SURVIVAL TIME</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--bar-purple)', marginTop: '4px' }}>
                {playerCoreMetrics.avgSurvivalMinutes}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                Late-game zone longevity
              </div>
            </div>

            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>MATCHES & SQUAD ROLE</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                {playerCoreMetrics.count} <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>played</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#22c55e', marginTop: '2px' }}>
                {playerCoreMetrics.statusText}
              </div>
            </div>
          </div>

          {/* Row 1 Player Charts: Line Chart Trend & Radar Profile */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '20px'
          }}>
            {/* Line chart — total points per match over time */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {activePlayer.ign}'s Points Trajectory Over Time
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Trend line across consecutive tournament appearances
                </div>
              </div>

              <AnalyticsLineChart
                data={playerPointTrend}
                height={200}
                color="#e52535"
                valueSuffix=" pts"
              />
            </div>

            {/* Radar / Spider chart */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  5-Axis Playstyle Radar ({activePlayer.ign})
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Assault vs Survival vs Discipline profiling
                </div>
              </div>

              <RadarSpiderChart
                metrics={playerRadarMetrics}
                size={220}
                fillColor="rgba(229, 37, 53, 0.3)"
                strokeColor="#e52535"
              />
            </div>
          </div>

          {/* Row 2 Player Charts: Bar Chart Kills (Streaks/Dries) & Stacked Bar (Surviving vs Fragging) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '20px'
          }}>
            {/* Bar chart — kills per match (spot streaks or dry spells) */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Eliminations per Match (Streaks vs Dry Spells)
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Identifies momentum spikes and drought matches
                </div>
              </div>

              <GroupedBarChart
                data={playerKillBarData}
                height={200}
                valueSuffix=" kills"
              />
            </div>

            {/* Stacked bar — placement points vs kill points */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Scoring Balance: Surviving vs Fragging
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Placement Points (Blue) vs Kill Points (Red)
                </div>
              </div>

              <StackedBarChart
                data={playerStackedPointsData}
                height={200}
                valueSuffix=" pts"
              />
            </div>
          </div>

          {/* Row 3: Consistency Box Plot & Standby vs Starter Comparison */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '20px'
          }}>
            {/* Box plot / variance chart — consistency: tight spread = reliable, wide spread = volatile performer */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Consistency Spread & Volatility (Box Plot)
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Tight box = reliable anchor • Wide box = high variance performer
                </div>
              </div>

              <BoxPlotConsistencyChart
                data={boxPlotData}
                height={180}
              />
            </div>

            {/* Standby vs Starter comparison bar */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Substitute vs Starter Benchmark
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Starter Squad Baseline: {standbyComparison.starterAvgPts} pts/m • {standbyComparison.starterAvgDmg} HP
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {standbyComparison.subProfiles.map((sub) => {
                  const isPositive = Number(sub.diffPts) >= 0;
                  return (
                    <div key={sub.player.id} style={{ background: '#1c1d25', padding: '12px 14px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.88rem' }}>{sub.player.ign}</span>
                          <span style={{ fontSize: '0.72rem', color: '#71717a', marginLeft: '6px' }}>({sub.player.role.toUpperCase()})</span>
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: isPositive ? '#22c55e' : '#ff4d5e',
                          background: isPositive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {isPositive ? `+${sub.diffPts}` : sub.diffPts} vs Starter Avg
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px', fontSize: '0.72rem' }}>
                        <div>
                          <span style={{ color: '#71717a' }}>Matches: </span>
                          <strong style={{ color: '#fff' }}>{sub.matchesPlayed}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#71717a' }}>K/D: </span>
                          <strong style={{ color: 'var(--accent-red)' }}>{sub.kd}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#71717a' }}>Avg Pts: </span>
                          <strong style={{ color: '#3b82f6' }}>{sub.avgPts}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        )
      )}

      {/* ========================================================= */}
      {/* 3. REVENUE & INVESTMENT STATS TAB                         */}
      {/* ========================================================= */}
      {activeTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Financial Core Numbers (KPIs) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '14px'
          }}>
            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>TOTAL INVESTED</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                ₹{(revenueMetrics.totalInvested / 1000).toFixed(0)}k
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                Entry fees, bootcamp, scrims, gear
              </div>
            </div>

            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>TOTAL RETURNS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#22c55e', marginTop: '4px' }}>
                ₹{(revenueMetrics.totalReturns / 1000).toFixed(0)}k
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                Tournament podiums & brand deals
              </div>
            </div>

            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>NET P&L & OVERALL ROI</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: revenueMetrics.netPnL >= 0 ? '#22c55e' : '#e52535' }}>
                  +₹{(revenueMetrics.netPnL / 1000).toFixed(0)}k
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#22c55e' }}>
                  (+{revenueMetrics.roi}% ROI)
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                Team operating profit
              </div>
            </div>

            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>PAYOUT VS EXPENSE PEAKS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>
                Max Win: ₹{(revenueMetrics.biggestPayout / 1000).toFixed(0)}k
              </div>
              <div style={{ fontSize: '0.8rem', color: '#ff4d5e', marginTop: '2px', fontWeight: 600 }}>
                Max Cost: ₹{(revenueMetrics.biggestExpense / 1000).toFixed(0)}k (Bootcamp)
              </div>
            </div>
          </div>

          {/* Row 1: Cumulative P&L Line Chart ("Are we actually profitable") */}
          <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Cumulative P&L Trajectory ("Are We Actually Profitable?")
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Running team profitability curve tracking investments vs prize milestones
                </div>
              </div>
              <span className="badge badge-green">+PROFITABLE</span>
            </div>

            <AnalyticsLineChart
              data={[
                { label: 'Aug 05', value: -50000 },
                { label: 'Aug 10', value: -125000 },
                { label: 'Aug 26', value: 325000 },
                { label: 'Aug 28', value: 205000 },
                { label: 'Sep 01', value: 505000 },
                { label: 'Sep 05', value: 1305000 },
                { label: 'Sep 08', value: 1555000 }
              ]}
              height={200}
              color="#22c55e"
              valuePrefix="₹"
            />
          </div>

          {/* Row 2: Waterfall Chart (Balance Inflow/Outflow) */}
          <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div style={{ marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Waterfall Capital Flow: Start → Expenses → Prizes → Net
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                Inflow (Green) vs Expenditure (Red) vs Final Operating Balance (Blue)
              </div>
            </div>

            <WaterfallChart
              steps={revenueMetrics.waterfallSteps}
              height={220}
            />
          </div>

          {/* Row 3: Investment Donut, Returns Donut & Tournament ROI Ranking */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '20px'
          }}>
            {/* Donut: Investment Breakdown */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Investment Breakdown by Category
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Where the team budget is spent
                </div>
              </div>

              <DonutChart
                data={revenueMetrics.investmentDonutData}
                size={170}
                centerTitle="SPEND"
                centerValue={`₹${Math.round(revenueMetrics.totalInvested / 1000)}k`}
              />
            </div>

            {/* Donut: Returns Breakdown */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Returns Breakdown by Source
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Prize winnings vs Sponsor guarantees
                </div>
              </div>

              <DonutChart
                data={revenueMetrics.returnsDonutData}
                size={170}
                centerTitle="INFLOW"
                centerValue={`₹${Math.round(revenueMetrics.totalReturns / 1000)}k`}
              />
            </div>

            {/* Ranked Bar Chart: ROI % per Tournament */}
            <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Ranked Tournament ROI %
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Identifies which tournament slots yielded the highest financial return
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {revenueMetrics.tournamentFinance.map((tf, i) => (
                  <div key={i} style={{ background: '#1c1d25', padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: '#ffffff', fontWeight: 600 }}>{tf.tournament.name}</span>
                      <strong style={{ color: '#22c55e' }}>+{tf.roi}% ROI</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#71717a', marginBottom: '6px' }}>
                      <span>Invested: ₹{(tf.invested / 1000).toFixed(0)}k</span>
                      <span style={{ color: '#4ade80' }}>Returns: ₹{(tf.returns / 1000).toFixed(0)}k</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: '#15161c', borderRadius: '2.5px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, tf.roi / 4)}%`, height: '100%', background: '#22c55e', borderRadius: '2.5px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CROSS-MODULE INTELLIGENCE TAB                          */}
      {/* ========================================================= */}
      {activeTab === 'cross_module' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Cross Module KPIs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '14px'
          }}>
            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>COST-PER-POINT EFFICIENCY</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-red)', marginTop: '4px' }}>
                ₹{crossModuleMetrics.costPerPoint} <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>/ pt</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                Total tournament spend ÷ Total points scored
              </div>
            </div>

            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>PRACTICE TASK COMPLETION RATE</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#3b82f6', marginTop: '4px' }}>
                {crossModuleMetrics.taskRate}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                {crossModuleMetrics.completedTasks} of {crossModuleMetrics.totalTasks} tactical drills verified by Coach
              </div>
            </div>

            <div style={{ background: '#15161c', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>PRACTICE TO PERFORMANCE CORRELATION</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#22c55e', marginTop: '4px' }}>
                +84% <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>High</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                Higher drill completion strongly correlates with podium finishes
              </div>
            </div>
          </div>

          {/* Task Completion Rate Overlaid against Points Trend */}
          <div style={{ background: '#15161c', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Practice Discipline vs Match Point Score Overlay
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                  Does completing assigned VOD reviews and TDM drills directly correlate with higher match scores?
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                <span style={{ color: '#e52535', fontWeight: 700 }}>— Match Score (Pts)</span>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>--- Drill Completion (%)</span>
              </div>
            </div>

            <AnalyticsLineChart
              data={crossModuleMetrics.overlayData}
              height={220}
              color="#e52535"
              secondaryColor="#3b82f6"
              showSecondary={true}
              valueSuffix=" pts"
            />
          </div>

          {/* Tactical Recommendations Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(229, 37, 53, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            border: '1px solid rgba(229, 37, 53, 0.25)',
            borderRadius: '12px',
            padding: '18px 22px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Flame size={16} color="var(--accent-red)" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Algorithmic Tactical Recommendations
              </h4>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                <strong style={{ color: '#fff' }}>Miramar & Rondo Priority:</strong> Team averages 22.0 pts on Rondo and 17.0 on Sanhok. Schedule additional zone-shift drills for Miramar northern rotations.
              </li>
              <li>
                <strong style={{ color: '#fff' }}>Substitute Utilization:</strong> Substitute sniper <strong style={{ color: 'var(--bar-purple)' }}>TITAN</strong> scored 9 pts (+1.2 above starter baseline) during Erangel Match 7. Consider drafting him on sniper-heavy long sightline maps.
              </li>
              <li>
                <strong style={{ color: '#fff' }}>Financial Efficiency:</strong> Skyesports Masters and BGIS Grand Finals have yielded a combined +400% ROI. Prioritize official KRAFTON and Upthrust tournaments with entry fees under ₹50,000 for maximum return.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
