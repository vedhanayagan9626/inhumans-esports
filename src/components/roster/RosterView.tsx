import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Player, PlayerRole, PlayerStatus } from '../../types';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Smartphone,
  Calendar,
  Lock,
  Hash,
  ArrowLeftRight,
  ShieldAlert,
  X
} from 'lucide-react';

export const RosterView: React.FC = () => {
  const {
    players,
    addPlayer,
    updatePlayer,
    deletePlayer,
    swapStarter,
    canChangePlayerRole,
    playerStats,
    canManageRoster,
    currentUser
  } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [swapModalTarget, setSwapModalTarget] = useState<Player | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    ign: '',
    igid: '',
    role: 'assault' as PlayerRole,
    status: 'starter' as PlayerStatus,
    join_date: new Date().toISOString().split('T')[0],
    device: 'iPhone 15 Pro',
    notes: '',
    avatar: '⚡'
  });

  const starters = players.filter((p) => p.status === 'starter');
  const startersCount = starters.length;

  const isOwnPlayerCard = (p: Player) => {
    if (!currentUser) return false;
    const curName = (currentUser.name || '').toLowerCase().trim();
    const curEmail = (currentUser.email || '').toLowerCase().trim();
    const pName = (p.name || '').toLowerCase().trim();
    const pIgn = (p.ign || '').toLowerCase().trim();

    return (
      (pName && pName === curName) ||
      (pIgn && pIgn === curName) ||
      (curEmail && curEmail.startsWith(pName)) ||
      p.id === currentUser.id ||
      p.id === `p_${currentUser.id}` ||
      (currentUser.player_id && p.id === currentUser.player_id)
    );
  };

  const canEditCard = (p: Player) => {
    return canManageRoster || isOwnPlayerCard(p);
  };

  const filteredPlayers = players.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  const getPlayerMetrics = (playerId: string) => {
    const stats = playerStats.filter((s) => s.player_id === playerId);
    const count = stats.length;
    if (count === 0) return { matchesCount: 0, kd: '0.00', avgDamage: 0, avgPoints: '0.0' };

    const totalKills = stats.reduce((sum, s) => sum + s.kills, 0);
    const totalDamage = stats.reduce((sum, s) => sum + s.damage, 0);
    const totalPoints = stats.reduce((sum, s) => sum + s.total_points, 0);

    return {
      matchesCount: count,
      kd: (totalKills / count).toFixed(2),
      avgDamage: Math.round(totalDamage / count),
      avgPoints: (totalPoints / count).toFixed(1)
    };
  };

  const openAddModal = () => {
    if (!canManageRoster) {
      setFeedbackBanner('Permission Denied: Only Master Admin, Coach, IGL, and Admin are authorized to add players.');
      setTimeout(() => setFeedbackBanner(null), 3500);
      return;
    }
    setFormData({
      name: '',
      ign: '',
      igid: '',
      role: 'assault',
      status: startersCount < 4 ? 'starter' : 'standby',
      join_date: new Date().toISOString().split('T')[0],
      device: 'iPhone 15 Pro',
      notes: '',
      avatar: '⚡'
    });
    setEditingPlayer(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (player: Player) => {
    if (!canEditCard(player)) {
      setFeedbackBanner('Permission Denied: You can only edit your own player profile.');
      setTimeout(() => setFeedbackBanner(null), 3500);
      return;
    }
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      ign: player.ign,
      igid: player.igid || '',
      role: player.role,
      status: player.status,
      join_date: player.join_date,
      device: player.device || '',
      notes: player.notes || '',
      avatar: player.avatar || '🎯'
    });
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlayer) {
      const res = updatePlayer(editingPlayer.id, formData);
      if (res.success) {
        setFeedbackBanner(res.message);
        setTimeout(() => setFeedbackBanner(null), 3000);
      } else {
        setFeedbackBanner(res.message);
        setTimeout(() => setFeedbackBanner(null), 4000);
      }
    } else {
      const res = addPlayer(formData);
      if (res.success) {
        setFeedbackBanner(res.message);
        setTimeout(() => setFeedbackBanner(null), 3000);
      } else {
        setFeedbackBanner(res.message);
        setTimeout(() => setFeedbackBanner(null), 4000);
      }
    }
    setIsAddModalOpen(false);
  };

  const handlePromoteToStarter = (player: Player) => {
    if (!canChangePlayerRole) return;
    if (startersCount >= 4) {
      setSwapModalTarget(player);
      return;
    }
    const res = updatePlayer(player.id, { status: 'starter' });
    setFeedbackBanner(res.message);
    setTimeout(() => setFeedbackBanner(null), 3000);
  };

  const handleDemoteToStandby = (player: Player) => {
    if (!canChangePlayerRole) return;
    const res = updatePlayer(player.id, { status: 'standby' });
    setFeedbackBanner(res.message);
    setTimeout(() => setFeedbackBanner(null), 3000);
  };

  const handleExecuteSwap = (starterPlayerId: string) => {
    if (!swapModalTarget) return;
    const res = swapStarter(starterPlayerId, swapModalTarget.id);
    setFeedbackBanner(res.message);
    setTimeout(() => setFeedbackBanner(null), 3500);
    setSwapModalTarget(null);
  };

  const getRoleBadge = (role: PlayerRole) => {
    switch (role) {
      case 'igl':
        return <span className="badge badge-red">🎯 IGL / SHOT CALLER</span>;
      case 'assault':
        return <span className="badge badge-purple">⚡ ASSAULTER</span>;
      case 'sniper':
        return <span className="badge badge-cyan">🔭 SNIPER / DMR</span>;
      case 'support':
        return <span className="badge badge-green">🛡️ SUPPORT / MEDIC</span>;
    }
  };

  const getStatusBadge = (status: PlayerStatus) => {
    switch (status) {
      case 'starter':
        return <span className="badge badge-green">STARTER (PLAYING 4)</span>;
      case 'standby':
        return <span className="badge badge-amber">STANDBY / SUB</span>;
      case 'inactive':
        return <span className="badge" style={{ background: '#1c1d25', color: '#71717a' }}>INACTIVE</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Users size={15} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
              Squad Roster & Player Intelligence
            </h1>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
              Starters, standby substitutes, character IGIDs, and role authorizations
            </div>
          </div>
        </div>

        {canManageRoster ? (
          <button onClick={openAddModal} className="btn btn-primary" id="btn-add-player">
            <UserPlus size={15} />
            <span>+ Add Player</span>
          </button>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={13} />
            <span>Roster management reserved for Coach, IGL & Admin</span>
          </div>
        )}
      </div>

      {feedbackBanner && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(229, 37, 53, 0.15)',
          border: '1px solid rgba(229, 37, 53, 0.3)',
          color: '#ff4d5e',
          fontSize: '0.82rem',
          fontWeight: 600
        }}>
          {feedbackBanner}
        </div>
      )}

      {/* Filter Tabs matching dark pill style */}
      <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
        {[
          { id: 'all', label: `All (${players.length})` },
          { id: 'starter', label: `Starters (${players.filter((p) => p.status === 'starter').length})` },
          { id: 'standby', label: `Standby / Subs (${players.filter((p) => p.status === 'standby').length})` },
          { id: 'inactive', label: `Inactive (${players.filter((p) => p.status === 'inactive').length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: filterStatus === tab.id ? 'var(--accent-red)' : '#15161c',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: filterStatus === tab.id ? 700 : 500,
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Players Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
        gap: '16px'
      }}>
        {filteredPlayers.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            background: '#15161c',
            borderRadius: '14px',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            color: '#71717a'
          }}>
            <Users size={40} color="var(--accent-red)" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
            <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800 }}>Roster is Currently Empty</h3>
            <p style={{ color: '#71717a', fontSize: '0.82rem', marginTop: '6px', maxWidth: '440px', margin: '6px auto 16px auto' }}>
              Add your starting fraggers, support, IGL, and standby players with Character IGIDs.
            </p>
            {canManageRoster && (
              <button onClick={openAddModal} className="btn btn-primary" style={{ padding: '8px 18px' }}>
                + Add First Player
              </button>
            )}
          </div>
        ) : (
          filteredPlayers.map((player) => {
          const metrics = getPlayerMetrics(player.id);
          const isStarter = player.status === 'starter';

          return (
            <div
              key={player.id}
              className="glass-panel"
              style={{
                padding: '20px',
                borderLeft: isStarter ? '3px solid var(--accent-red)' : '3px solid var(--bar-amber)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#1c1d25',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      {player.avatar || '⚡'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: 0, fontWeight: 800 }}>
                        {player.ign}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#71717a' }}>
                        {player.name}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {getStatusBadge(player.status)}
                    {getRoleBadge(player.role)}
                  </div>
                </div>

                {/* IGID (In-Game Character ID) Highlight */}
                <div style={{
                  background: '#1c1d25',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  margin: '10px 0',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#a1a1aa' }}>
                    <Hash size={12} color="var(--accent-red)" />
                    <span>CHARACTER IGID:</span>
                  </div>
                  <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#ffffff' }}>
                    {player.igid || '—'}
                  </strong>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  fontSize: '0.72rem',
                  color: '#71717a'
                }}>
                  {player.device && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Smartphone size={12} />
                      <span>{player.device}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    <span>Joined: {player.join_date}</span>
                  </div>
                </div>

                {player.notes && (
                  <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '8px', fontStyle: 'italic' }}>
                    "{player.notes}"
                  </div>
                )}
              </div>

              {/* Stats Strip */}
              <div style={{
                background: '#1c1d25',
                borderRadius: '8px',
                padding: '8px 10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#71717a' }}>MATCHES</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>{metrics.matchesCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#ff4d5e' }}>K/D</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ff4d5e' }}>{metrics.kd}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#71717a' }}>AVG DMG</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>{metrics.avgDamage}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--bar-blue)' }}>AVG PTS</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--bar-blue)' }}>{metrics.avgPoints}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                paddingTop: '10px'
              }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {canChangePlayerRole && (
                    <>
                      {player.status === 'starter' ? (
                        <button
                          onClick={() => handleDemoteToStandby(player)}
                          className="btn btn-secondary"
                          title="Move starter to Standby"
                          style={{ padding: '5px 9px', fontSize: '0.72rem', color: 'var(--bar-amber)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                        >
                          <span>⬇ Standby</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePromoteToStarter(player)}
                          className="btn btn-secondary"
                          title={startersCount >= 4 ? 'Swap with an active starter' : 'Promote to Starter'}
                          style={{ padding: '5px 9px', fontSize: '0.72rem', color: 'var(--bar-green)', borderColor: 'rgba(34, 197, 94, 0.3)' }}
                        >
                          <ArrowLeftRight size={12} />
                          <span>{startersCount >= 4 ? 'Swap to Starter' : '⭐ Starter'}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {canEditCard(player) && (
                    <button
                      onClick={() => openEditModal(player)}
                      className="btn btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                    >
                      <Edit2 size={12} />
                      <span>{isOwnPlayerCard(player) && !canChangePlayerRole ? 'Edit My Info' : 'Edit'}</span>
                    </button>
                  )}

                  {canManageRoster && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${player.ign} from the squad?`)) {
                          deletePlayer(player.id);
                        }
                      }}
                      className="btn btn-danger"
                      style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* Quick Swap Starter Modal */}
      {swapModalTarget && (
        <div className="modal-backdrop" onClick={() => setSwapModalTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', color: '#ffffff', fontWeight: 800 }}>
                  SWAP STARTER ROSTER
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '2px' }}>
                  Promoting <strong style={{ color: 'var(--bar-green)' }}>{swapModalTarget.ign}</strong> to Playing 4. Select a starter to bench to Standby:
                </div>
              </div>
              <button
                onClick={() => setSwapModalTarget(null)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '14px 0' }}>
              {starters.map((starter) => (
                <div
                  key={starter.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: '#1c1d25',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{starter.avatar || '⚡'}</span>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                        {starter.ign}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                        {starter.name} • {starter.role.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecuteSwap(starter.id)}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    <ArrowLeftRight size={13} />
                    <span>Swap Out</span>
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setSwapModalTarget(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#ffffff' }}>
                {editingPlayer ? `EDIT PLAYER: ${editingPlayer.ign}` : 'ADD NEW SQUAD PLAYER'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    IN-GAME NAME (IGN) *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-control"
                    placeholder="e.g. SHADOW"
                    value={formData.ign}
                    onChange={(e) => setFormData({ ...formData, ign: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    CHARACTER IGID (ID NUMBER) *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-control"
                    placeholder="e.g. 512948201"
                    value={formData.igid}
                    onChange={(e) => setFormData({ ...formData, igid: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    REAL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-control"
                    placeholder="e.g. Aarav Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    TACTICAL ROLE * {!canChangePlayerRole && <span style={{ color: 'var(--accent-red)', fontSize: '0.68rem' }}>(🔒 Locked to IGL / Admin)</span>}
                  </label>
                  <select
                    className="input-control"
                    value={formData.role}
                    disabled={!canChangePlayerRole}
                    style={!canChangePlayerRole ? { opacity: 0.6, cursor: 'not-allowed', background: '#181920' } : {}}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as PlayerRole })}
                  >
                    <option value="igl">🎯 IGL / Shot Caller</option>
                    <option value="assault">⚡ Assaulter / Entry Fragger</option>
                    <option value="sniper">🔭 Sniper / DMR</option>
                    <option value="support">🛡️ Support / Utility</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    STATUS * {!canChangePlayerRole && <span style={{ color: 'var(--accent-red)', fontSize: '0.68rem' }}>(🔒 Locked to IGL / Admin)</span>}
                    {canChangePlayerRole && startersCount >= 4 && (!editingPlayer || editingPlayer.status !== 'starter') && (
                      <span style={{ color: 'var(--bar-amber)', fontSize: '0.68rem', display: 'block' }}>Max 4 starters reached</span>
                    )}
                  </label>
                  <select
                    className="input-control"
                    value={formData.status}
                    disabled={!canChangePlayerRole}
                    style={!canChangePlayerRole ? { opacity: 0.6, cursor: 'not-allowed', background: '#181920' } : {}}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PlayerStatus })}
                  >
                    <option
                      value="starter"
                      disabled={startersCount >= 4 && (!editingPlayer || editingPlayer.status !== 'starter')}
                    >
                      STARTER (Playing 4) {startersCount >= 4 && (!editingPlayer || editingPlayer.status !== 'starter') ? '— [FULL 4/4]' : ''}
                    </option>
                    <option value="standby">STANDBY / SUBSTITUTE</option>
                    <option value="inactive">INACTIVE</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    PRIMARY DEVICE
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. iPhone 15 Pro Max"
                    value={formData.device}
                    onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                  SCOUTING NOTES
                </label>
                <textarea
                  className="input-control"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPlayer ? 'Save Changes' : 'Add Player to Squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
