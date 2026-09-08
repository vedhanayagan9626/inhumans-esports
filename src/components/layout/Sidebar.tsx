import React from 'react';
import {
  BarChart3,
  Crosshair,
  Users,
  Trophy,
  CheckSquare,
  DollarSign,
  Sliders,
  Shield,
  CircleDot
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type ActiveTab = 'analytics' | 'matches' | 'roster' | 'tournaments' | 'tasks' | 'finance' | 'points';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMatchEntry: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenMatchEntry }) => {
  const { matches, playerStats, tasks } = useApp();

  const totalMatches = matches.length;
  const chickenDinners = matches.filter((m) => {
    const statsForMatch = playerStats.filter((s) => s.match_id === m.id);
    return statsForMatch.some((s) => s.placement === 1);
  }).length;

  const pendingTasks = tasks.filter((t) => t.status !== 'verified' && t.status !== 'completed').length;

  const navItems = [
    { id: 'analytics' as ActiveTab, label: 'Analytics Hub', icon: BarChart3, badge: null },
    { id: 'matches' as ActiveTab, label: 'Record Match & OCR', icon: Crosshair, badge: 'OCR Plugin' },
    { id: 'roster' as ActiveTab, label: 'Squad Roster', icon: Users, badge: null },
    { id: 'tournaments' as ActiveTab, label: 'Tournaments', icon: Trophy, badge: null },
    { id: 'tasks' as ActiveTab, label: 'Tactical Tasks', icon: CheckSquare, badge: pendingTasks > 0 ? `${pendingTasks}` : null },
    { id: 'finance' as ActiveTab, label: 'P&L Ledger', icon: DollarSign, badge: null },
    { id: 'points' as ActiveTab, label: 'Points System', icon: Sliders, badge: null }
  ];

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        zIndex: 30,
        background: '#0c0d11',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 14px'
      }}
      id="desktop-sidebar"
    >
      <style>{`
        @media (min-width: 1024px) {
          #desktop-sidebar {
            display: flex !important;
          }
        }
      `}</style>

      <div>
        {/* Brand Banner matching INHUMANS Esports dark style */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 8px 16px 8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '18px'
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '6px',
            background: '#15161c',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 0 6px rgba(229, 37, 53, 0.35))'
          }}>
            <img
              src="/inhuman-icon.png"
              alt="INHUMANS"
              style={{ width: '22px', height: 'auto', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{
              fontSize: '0.92rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '0.04em'
            }}>
              INHUMANS
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-red)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CircleDot size={8} color="var(--accent-red)" />
              <span>ESPORTS HUB</span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(229, 37, 53, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(229, 37, 53, 0.3)' : '1px solid transparent',
                  color: isActive ? '#ffffff' : '#a1a1aa',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={17} color={isActive ? 'var(--accent-red)' : '#71717a'} />
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500
                  }}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className={item.id === 'matches' ? 'badge badge-purple' : 'badge badge-red'}
                    style={{ fontSize: '0.65rem' }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Telemetry Summary Card */}
      <div>
        <div
          style={{
            padding: '12px',
            background: '#15161c',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '8px',
            marginBottom: '12px'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#71717a', marginBottom: '8px' }}>
            SEASON SUMMARY
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#1c1d25', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#71717a' }}>MATCHES</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{totalMatches}</div>
            </div>
            <div style={{ background: '#1c1d25', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#ff4d5e' }}>WWCD</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ff4d5e' }}>{chickenDinners} 🍗</div>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenMatchEntry}
          className="btn btn-primary"
          style={{ width: '100%', padding: '9px', borderRadius: '8px' }}
        >
          <Crosshair size={15} />
          <span>+ Record Match</span>
        </button>
      </div>
    </aside>
  );
};
