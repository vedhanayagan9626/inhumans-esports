import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Tournament, TournamentFormat, TournamentStatus, MatchScreenshot } from '../../types';
import {
  Trophy,
  Plus,
  Crosshair,
  ExternalLink,
  MessageCircle,
  Eye,
  Trash2,
  Edit2,
  Calendar,
  Image as ImageIcon,
  ArrowRight,
  X
} from 'lucide-react';
import { ScreenshotModal } from '../match-entry/ScreenshotModal';

interface TournamentsViewProps {
  onOpenMatchEntry: () => void;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({ onOpenMatchEntry }) => {
  const {
    tournaments,
    addTournament,
    updateTournament,
    deleteTournament,
    matches,
    playerStats,
    pointsSystems,
    updateScreenshot,
    deleteScreenshot
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    tournaments.find((t) => t.status === 'ongoing')?.id || tournaments[0]?.id || ''
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [activeScreenshotModal, setActiveScreenshotModal] = useState<{
    screenshot: MatchScreenshot;
    matchId: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    organizer: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    format: 'TPP' as TournamentFormat,
    entry_fee: 0,
    prize_pool: 1000000,
    points_system_id: pointsSystems[0]?.id || '',
    status: 'available' as TournamentStatus,
    apply_link: '',
    contact_info: '',
    slots_info: ''
  });

  const filteredTournaments = tournaments.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0];
  const tournamentMatches = matches
    .filter((m) => m.tournament_id === selectedTournament?.id)
    .sort((a, b) => a.match_number - b.match_number);

  const getTournamentMetrics = (tId: string) => {
    const tMatches = matches.filter((m) => m.tournament_id === tId);
    let totalPoints = 0;
    let totalKills = 0;
    let chickenDinners = 0;

    tMatches.forEach((m) => {
      const stats = playerStats.filter((s) => s.match_id === m.id);
      if (stats.length > 0) {
        const placementPts = stats[0].placement_points;
        const kills = stats.reduce((sum, s) => sum + s.kills, 0);
        totalKills += kills;
        totalPoints += placementPts + kills;
        if (stats[0].placement === 1) chickenDinners++;
      }
    });

    return { totalPoints, totalKills, chickenDinners, matchCount: tMatches.length };
  };

  const openAddModal = () => {
    setEditingTournament(null);
    setFormData({
      name: '',
      organizer: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      format: 'TPP',
      entry_fee: 0,
      prize_pool: 1000000,
      points_system_id: pointsSystems[0]?.id || '',
      status: 'available',
      apply_link: '',
      contact_info: '',
      slots_info: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (t: Tournament) => {
    setEditingTournament(t);
    setFormData({
      name: t.name,
      organizer: t.organizer || '',
      start_date: t.start_date || new Date().toISOString().split('T')[0],
      end_date: t.end_date || new Date().toISOString().split('T')[0],
      format: t.format || 'TPP',
      entry_fee: t.entry_fee || 0,
      prize_pool: t.prize_pool || 0,
      points_system_id: t.points_system_id || pointsSystems[0]?.id || '',
      status: t.status,
      apply_link: t.apply_link || '',
      contact_info: t.contact_info || '',
      slots_info: t.slots_info || ''
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteTournament = (t: Tournament, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Are you sure you want to delete tournament "${t.name}" and all its match data?`)) {
      deleteTournament(t.id);
      if (selectedTournamentId === t.id) {
        setSelectedTournamentId(tournaments.find((item) => item.id !== t.id)?.id || '');
      }
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTournament) {
      updateTournament(editingTournament.id, {
        name: formData.name,
        organizer: formData.organizer,
        start_date: formData.start_date,
        end_date: formData.end_date,
        format: formData.format,
        entry_fee: Number(formData.entry_fee),
        prize_pool: Number(formData.prize_pool),
        points_system_id: formData.points_system_id || pointsSystems[0]?.id || '',
        status: formData.status,
        apply_link: formData.apply_link || undefined,
        contact_info: formData.contact_info || undefined,
        slots_info: formData.slots_info || undefined
      });
    } else {
      addTournament({
        name: formData.name,
        organizer: formData.organizer,
        start_date: formData.start_date,
        end_date: formData.end_date,
        format: formData.format,
        entry_fee: Number(formData.entry_fee),
        prize_pool: Number(formData.prize_pool),
        points_system_id: formData.points_system_id || pointsSystems[0]?.id || '',
        status: formData.status,
        apply_link: formData.apply_link || undefined,
        contact_info: formData.contact_info || undefined,
        slots_info: formData.slots_info || undefined
      });
    }
    setIsAddModalOpen(false);
    setEditingTournament(null);
  };

  const getStatusBadge = (status: TournamentStatus) => {
    switch (status) {
      case 'available':
        return <span className="badge badge-purple">OPEN TO APPLY</span>;
      case 'ongoing':
        return <span className="badge badge-red">LIVE / ONGOING</span>;
      case 'registered':
        return <span className="badge badge-amber">REGISTERED</span>;
      case 'completed':
        return <span className="badge badge-green">COMPLETED</span>;
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
            <Trophy size={15} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
              Tournaments & Open Qualifiers
            </h1>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
              Available qualifiers to apply, live registered brackets, and match records
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={openAddModal} className="btn btn-secondary">
            <Plus size={15} />
            <span>+ Add Tournament</span>
          </button>
          <button onClick={onOpenMatchEntry} className="btn btn-primary">
            <Crosshair size={15} />
            <span>Record Match</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
        {[
          { id: 'all', label: `All (${tournaments.length})` },
          { id: 'available', label: `Available to Apply (${tournaments.filter((t) => t.status === 'available').length})` },
          { id: 'registered', label: `Registered (${tournaments.filter((t) => t.status === 'registered').length})` },
          { id: 'ongoing', label: `Ongoing Live (${tournaments.filter((t) => t.status === 'ongoing').length})` },
          { id: 'completed', label: `Completed (${tournaments.filter((t) => t.status === 'completed').length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: statusFilter === tab.id ? 'var(--accent-red)' : '#15161c',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: statusFilter === tab.id ? 700 : 500,
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tournaments Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: '16px'
      }}>
        {filteredTournaments.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            background: '#15161c',
            borderRadius: '14px',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            color: '#71717a'
          }}>
            <Trophy size={40} color="var(--accent-red)" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
            <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800 }}>No Tournaments Added Yet</h3>
            <p style={{ color: '#71717a', fontSize: '0.82rem', marginTop: '6px', maxWidth: '440px', margin: '6px auto 16px auto' }}>
              Schedule registered tournament brackets, BGIS/BMPS open qualifiers, or practice scrim series.
            </p>
            <button onClick={openAddModal} className="btn btn-primary" style={{ padding: '8px 18px' }}>
              + Add First Tournament
            </button>
          </div>
        ) : (
          filteredTournaments.map((t) => {
          const isSelected = selectedTournament?.id === t.id;
          const metrics = getTournamentMetrics(t.id);

          return (
            <div
              key={t.id}
              className="glass-panel"
              style={{
                padding: '18px',
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--accent-red)' : 'var(--border-subtle)',
                boxShadow: isSelected ? '0 0 15px var(--accent-red-glow)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
              onClick={() => setSelectedTournamentId(t.id)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#71717a' }}>
                    {t.organizer}
                  </span>
                  {getStatusBadge(t.status)}
                </div>

                <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '8px', fontWeight: 800 }}>
                  {t.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '10px' }}>
                  <span className="badge badge-purple">{t.format}</span>
                  <span>Prize: <strong style={{ color: 'var(--bar-green)' }}>₹{(t.prize_pool / 100000).toFixed(1)}L</strong></span>
                  {t.entry_fee > 0 ? (
                    <span>Fee: ₹{t.entry_fee.toLocaleString('en-IN')}</span>
                  ) : (
                    <span style={{ color: 'var(--bar-green)', fontWeight: 600 }}>Free Entry</span>
                  )}
                </div>

                {t.slots_info && (
                  <div style={{ fontSize: '0.72rem', color: '#ff4d5e', background: 'rgba(229, 37, 53, 0.1)', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px', border: '1px solid rgba(229, 37, 53, 0.2)' }}>
                    ℹ️ {t.slots_info}
                  </div>
                )}

                {(t.apply_link || t.contact_info) && (
                  <div style={{ background: '#1c1d25', padding: '8px 10px', borderRadius: '6px', marginBottom: '8px' }}>
                    {t.apply_link && (
                      <div style={{ marginBottom: t.contact_info ? '6px' : '0' }}>
                        <a
                          href={t.apply_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--accent-red)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          <ExternalLink size={12} />
                          <span>Direct Registration Link →</span>
                        </a>
                      </div>
                    )}
                    {t.contact_info && (
                      <div style={{ fontSize: '0.72rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MessageCircle size={12} color="var(--bar-green)" />
                        <span>Contact: <strong style={{ color: '#ffffff' }}>{t.contact_info}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Match Stats Counter */}
              <div style={{
                background: '#1c1d25',
                borderRadius: '6px',
                padding: '6px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.72rem'
              }}>
                <span>Matches: <strong style={{ color: '#ffffff' }}>{metrics.matchCount}</strong></span>
                <span>WWCD: <strong style={{ color: '#ff4d5e' }}>{metrics.chickenDinners} 🍗</strong></span>
                <span>Points: <strong style={{ color: 'var(--bar-blue)' }}>{metrics.totalPoints}</strong></span>
              </div>

              {/* Card Footer Actions: Edit & Delete */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                paddingTop: '8px'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>
                  {t.start_date}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(t); }}
                    className="btn btn-secondary"
                    title="Edit Tournament"
                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteTournament(t, e)}
                    className="btn btn-danger"
                    title="Delete Tournament"
                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* Match Details & Screenshots */}
      {selectedTournament && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', color: '#ffffff', fontWeight: 800 }}>
                  {selectedTournament.name}
                </h2>
                {getStatusBadge(selectedTournament.status)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
                Organizer: {selectedTournament.organizer} • {selectedTournament.start_date} to {selectedTournament.end_date} • Format: {selectedTournament.format}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => openEditModal(selectedTournament)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button
                onClick={(e) => handleDeleteTournament(selectedTournament, e)}
                className="btn btn-danger"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
              <button onClick={onOpenMatchEntry} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                <Plus size={14} />
                <span>Record Match</span>
              </button>
            </div>
          </div>

          {tournamentMatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#71717a', fontSize: '0.85rem' }}>
              No matches recorded for this tournament yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tournamentMatches.map((m) => {
                const stats = playerStats.filter((s) => s.match_id === m.id);
                const squadPlacement = stats[0]?.placement || 16;
                const totalKills = stats.reduce((acc, s) => acc + s.kills, 0);
                const totalPoints = (stats[0]?.placement_points || 0) + totalKills;
                const isWWCD = squadPlacement === 1;

                return (
                  <div
                    key={m.id}
                    style={{
                      background: isWWCD ? 'rgba(229, 37, 53, 0.12)' : '#1c1d25',
                      border: isWWCD ? '1px solid rgba(229, 37, 53, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        background: isWWCD ? 'var(--accent-red)' : '#15161c',
                        color: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800
                      }}>
                        <span style={{ fontSize: '0.6rem' }}>M</span>
                        <span style={{ fontSize: '0.95rem' }}>#{m.match_number}</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                            {m.map}
                          </span>
                          {isWWCD && (
                            <span className="badge badge-red">
                              🍗 WWCD (#1)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#71717a' }}>
                          {m.match_date}
                        </div>
                      </div>
                    </div>

                    {/* Screenshot thumbnail if attached */}
                    {m.screenshot ? (
                      <div
                        onClick={() => setActiveScreenshotModal({ screenshot: m.screenshot!, matchId: m.id })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: '#15161c',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '4px 10px 4px 6px',
                          cursor: 'pointer'
                        }}
                      >
                        <img
                          src={m.screenshot.data_url}
                          alt="End screen screenshot"
                          style={{ width: '44px', height: '28px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={12} color="var(--accent-red)" />
                            <span>View Screenshot (.png)</span>
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#71717a' }}>
                            Zoom, Edit, Delete
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ImageIcon size={13} />
                        <span>No image attached</span>
                      </div>
                    )}

                    {/* Right scores */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.68rem', color: '#71717a' }}>FINISH</div>
                        <div style={{ fontWeight: 800, color: isWWCD ? '#ff4d5e' : '#ffffff' }}>
                          #{squadPlacement}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.68rem', color: '#71717a' }}>KILLS</div>
                        <div style={{ fontWeight: 800, color: 'var(--accent-red)' }}>
                          {totalKills}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.68rem', color: '#71717a' }}>TOTAL</div>
                        <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#ffffff' }}>
                          {totalPoints} pts
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#ffffff' }}>
                {editingTournament ? `EDIT TOURNAMENT: ${editingTournament.name}` : 'REGISTER NEW TOURNAMENT'}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                  TOURNAMENT NAME *
                </label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    ORGANIZER *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-control"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    STATUS *
                  </label>
                  <select
                    className="input-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TournamentStatus })}
                  >
                    <option value="available">Open for Application / Registration</option>
                    <option value="registered">Registered Squad</option>
                    <option value="ongoing">Live Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    DIRECT APPLY LINK
                  </label>
                  <input
                    type="url"
                    className="input-control"
                    placeholder="https://..."
                    value={formData.apply_link}
                    onChange={(e) => setFormData({ ...formData, apply_link: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    ORGANIZER CONTACT INFO
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="WhatsApp / Discord"
                    value={formData.contact_info}
                    onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    PRIZE POOL (₹)
                  </label>
                  <input
                    type="number"
                    className="input-control"
                    value={formData.prize_pool}
                    onChange={(e) => setFormData({ ...formData, prize_pool: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    ENTRY FEE (₹)
                  </label>
                  <input
                    type="number"
                    className="input-control"
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTournament ? 'Update Tournament' : 'Save Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {activeScreenshotModal && (
        <ScreenshotModal
          screenshot={activeScreenshotModal.screenshot}
          onClose={() => setActiveScreenshotModal(null)}
          onUpdate={(name, desc) => {
            updateScreenshot(activeScreenshotModal.matchId, name, desc);
            setActiveScreenshotModal(null);
          }}
          onDelete={() => {
            deleteScreenshot(activeScreenshotModal.matchId);
            setActiveScreenshotModal(null);
          }}
        />
      )}
    </div>
  );
};
