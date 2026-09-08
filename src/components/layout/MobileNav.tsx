import React, { useState } from 'react';
import {
  BarChart3,
  Crosshair,
  Users,
  CheckSquare,
  Menu,
  Trophy,
  DollarSign,
  Sliders,
  X
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMatchEntry: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, onOpenMatchEntry }) => {
  const [showDrawer, setShowDrawer] = useState(false);

  const mainNav = [
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
    { id: 'matches' as ActiveTab, label: 'Matches', icon: Crosshair },
    { id: 'roster' as ActiveTab, label: 'Roster', icon: Users },
    { id: 'tasks' as ActiveTab, label: 'Tasks', icon: CheckSquare }
  ];

  const drawerItems = [
    { id: 'tournaments' as ActiveTab, label: 'Tournaments & Open Qualifiers', icon: Trophy },
    { id: 'finance' as ActiveTab, label: 'P&L Ledger & Scrims', icon: DollarSign },
    { id: 'points' as ActiveTab, label: 'Points System Configuration', icon: Sliders }
  ];

  return (
    <>
      <style>{`
        .mobile-bottom-nav {
          display: flex;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: var(--mobile-nav-height);
          background: #0c0d11;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 50;
          align-items: center;
          justify-content: space-around;
          padding: 0 4px;
        }

        @media (min-width: 1024px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>

      <div className="mobile-bottom-nav">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--accent-red)' : '#71717a',
                cursor: 'pointer',
                flex: 1,
                padding: '6px 0'
              }}
            >
              <Icon size={19} color={isActive ? 'var(--accent-red)' : '#71717a'} />
              <span style={{
                fontSize: '0.68rem',
                fontWeight: isActive ? 700 : 500
              }}>
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setShowDrawer(!showDrawer)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: ['tournaments', 'finance', 'points'].includes(activeTab) ? 'var(--accent-red)' : '#71717a',
            cursor: 'pointer',
            flex: 1,
            padding: '6px 0'
          }}
        >
          <Menu size={19} />
          <span style={{ fontSize: '0.68rem', fontWeight: 500 }}>More</span>
        </button>
      </div>

      {showDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12, 13, 17, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}
          onClick={() => setShowDrawer(false)}
        >
          <div
            style={{
              background: '#15161c',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: 'var(--mobile-nav-height)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                TACTICAL MODULES
              </span>
              <button
                onClick={() => setShowDrawer(false)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowDrawer(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(229, 37, 53, 0.15)' : '#1c1d25',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      color: isActive ? '#ffffff' : '#a1a1aa',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Icon size={18} color={isActive ? 'var(--accent-red)' : '#71717a'} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  setShowDrawer(false);
                  onOpenMatchEntry();
                }}
                className="btn btn-primary"
                style={{ marginTop: '10px', padding: '10px' }}
              >
                <Crosshair size={16} />
                <span>+ Record Match</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
