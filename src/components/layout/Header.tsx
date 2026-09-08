import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, PlusCircle, RefreshCw, Trophy, User as UserIcon, LogIn, LogOut, ChevronDown, Search, Flame, UserCheck } from 'lucide-react';
import { UserRole } from '../../types';
import { LoginModal } from '../auth/LoginModal';
import { UserApprovalsModal } from '../auth/UserApprovalsModal';
import inhumanIcon from '../../assets/inhuman-icon.png';

import { ActiveTab } from './Sidebar';
import { Globe } from 'lucide-react';

interface HeaderProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onOpenMatchEntry: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab = 'analytics', setActiveTab, onOpenMatchEntry }) => {
  const { currentUser, setCurrentUser, users, resetToSeedData, tournaments, logout, pendingUsers, canApproveUsers } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);

  const navLinks: { id: ActiveTab; label: string }[] = [
    { id: 'analytics', label: 'Schedule & Stats' },
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'roster', label: 'Roster' },
    { id: 'matches', label: 'Matches & OCR' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'finance', label: 'P&L Ledger' },
    { id: 'points', label: 'Points System' }
  ];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'master_admin':
        return (
          <span className="badge badge-amber" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(229, 37, 53, 0.25) 100%)',
            border: '1px solid #f59e0b',
            color: '#fbbf24',
            fontWeight: 800
          }}>
            MASTER ADMIN
          </span>
        );
      case 'coach':
        return <span className="badge badge-amber">COACH</span>;
      case 'igl':
        return <span className="badge badge-red">IGL</span>;
      case 'player':
        return <span className="badge badge-green">PLAYER</span>;
      case 'admin':
        return <span className="badge badge-purple">ADMIN</span>;
    }
  };

  return (
    <>
      {/* Top Navbar matching INHUMANS Esports Dark Aesthetic */}
      <header className="header-container">
        {/* Left: INHUMANS Esports Logo & Title */}
        <div
          onClick={() => setActiveTab && setActiveTab('analytics')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
        >
          {/* InHUMAN Fox Emblem with subtle red glow */}
          <div style={{
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 0 8px rgba(229, 37, 53, 0.45))'
          }}>
            <img
              src={inhumanIcon}
              alt="INHUMANS"
              style={{
                height: '30px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.05rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}>
              INHUMANS
            </span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--accent-red)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}>
              ESPORTS
            </span>
          </div>
        </div>

        {/* Center: Navigation Links strictly on a single row (flex-wrap: nowrap) */}
        {setActiveTab && (
          <nav
            className="header-desktop-nav hide-scrollbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap',
              flex: 1,
              justifyContent: 'center',
              padding: '0 4px',
              minWidth: 0
            }}
          >
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className="header-nav-btn"
                  style={{
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? '#ffffff' : '#8a8d9a'
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#ffffff'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#8a8d9a'; }}
                >
                  {link.label}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: '2px',
                      right: '2px',
                      height: '2.5px',
                      background: 'var(--accent-red)',
                      borderRadius: '2px'
                    }} />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right side: Search, Approvals Badge, Record Match, User Pill, Globe */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Search pill */}
          <div className="header-search-box" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="#656977" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Search"
              style={{
                width: '120px',
                background: '#16171e',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '6px 12px 6px 32px',
                fontSize: '0.78rem',
                color: '#ffffff',
                outline: 'none'
              }}
            />
          </div>

          {/* User Approvals Badge Button (Visible to Master Admin, Admins & IGLs) */}
          {canApproveUsers && (
            <button
              onClick={() => setShowApprovalsModal(true)}
              style={{
                padding: '6px 10px',
                fontSize: '0.78rem',
                borderRadius: '20px',
                background: pendingUsers.length > 0 ? 'rgba(229, 37, 53, 0.2)' : '#16171e',
                border: pendingUsers.length > 0 ? '1px solid var(--accent-red)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: pendingUsers.length > 0 ? '#ff4d5e' : '#8a8d9a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}
              title="Review & approve account registration requests"
              id="btn-header-approvals"
            >
              <UserCheck size={14} />
              <span className="header-user-text">Approvals</span>
              {pendingUsers.length > 0 && (
                <span style={{
                  background: 'var(--accent-red)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '0.68rem',
                  fontWeight: 800
                }}>
                  {pendingUsers.length}
                </span>
              )}
            </button>
          )}

          {/* Quick Record Match Button */}
          <button
            onClick={onOpenMatchEntry}
            className="btn btn-primary header-record-btn"
            style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', whiteSpace: 'nowrap' }}
            id="btn-quick-log-match"
          >
            <PlusCircle size={14} />
            <span>Record Match</span>
          </button>

          {/* User Profile Pill / Auth Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              style={{
                padding: '5px 10px',
                fontSize: '0.78rem',
                borderRadius: '20px',
                background: '#16171e',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
              id="btn-user-auth-menu"
            >
              <span style={{ fontSize: '0.9rem' }}>{currentUser?.avatar || '👤'}</span>
              <span className="header-user-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>
                {currentUser?.name || 'Operator'}
              </span>
              {currentUser && getRoleBadge(currentUser.role)}
              <ChevronDown size={12} color="#71717a" />
            </button>

            {/* Dropdown Menu */}
            {showRoleMenu && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  width: '280px',
                  padding: '8px',
                  zIndex: 100,
                  background: '#15161c',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
                }}
              >
                <div style={{
                  fontSize: '0.7rem',
                  color: '#71717a',
                  padding: '6px 8px',
                  fontWeight: 600,
                  letterSpacing: '0.04em'
                }}>
                  CURRENT USER (1-HOUR SESSION ACTIVE)
                </div>

                <div style={{ padding: '8px', background: '#1c1d25', borderRadius: '6px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{currentUser?.avatar || '👤'}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentUser?.name || 'Guest'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentUser?.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approvals Action inside dropdown */}
                {canApproveUsers && (
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      setShowApprovalsModal(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginBottom: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={14} color="var(--accent-red)" />
                      <span>Review Approvals</span>
                    </div>
                    {pendingUsers.length > 0 && (
                      <span className="badge badge-red">{pendingUsers.length}</span>
                    )}
                  </button>
                )}

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '6px', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      logout();
                      setShowRoleMenu(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(229, 37, 53, 0.1)',
                      border: '1px solid rgba(229, 37, 53, 0.25)',
                      color: '#ff4d5e',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    id="btn-header-logout"
                  >
                    <LogOut size={14} />
                    <span>Log Out (Clear 1-Hour Session)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Wipe and reset site to empty real esports dataset? (Master Admin account will be preserved)')) {
                        resetToSeedData();
                        setShowRoleMenu(false);
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 8px',
                      borderRadius: '6px',
                      background: 'none',
                      border: 'none',
                      color: '#71717a',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={12} />
                    <span>Reset to Empty Real State</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Globe Icon */}
          <button
            className="header-globe-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#8a8d9a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '50%'
            }}
            title="Language & Global Region"
          >
            <Globe size={17} />
          </button>
        </div>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <UserApprovalsModal
        isOpen={showApprovalsModal}
        onClose={() => setShowApprovalsModal(false)}
      />
    </>
  );
};
