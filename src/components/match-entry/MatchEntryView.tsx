import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Crosshair,
  Lock,
  Upload,
  CheckCircle2,
  Sparkles,
  Trophy,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BgmiMap } from '../../types';

interface MatchEntryViewProps {
  onSuccess?: () => void;
}

export const MatchEntryView: React.FC<MatchEntryViewProps> = ({ onSuccess }) => {
  const {
    tournaments,
    players,
    pointsSystems,
    activePointsSystem,
    calculatePoints,
    addMatchWithStats,
    matches
  } = useApp();

  const [tournamentId, setTournamentId] = useState<string>(
    tournaments.find((t) => t.status === 'ongoing')?.id || tournaments[0]?.id || ''
  );

  const nextMatchNumber =
    matches.filter((m) => m.tournament_id === tournamentId).length + 1;
  const [matchNumber, setMatchNumber] = useState<number>(nextMatchNumber || 1);
  const [map, setMap] = useState<BgmiMap>('Erangel');
  const [matchDate, setMatchDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [placement, setPlacement] = useState<number>(1);

  // Screenshot upload state (OCR off)
  const [screenshotData, setScreenshotData] = useState<{
    data_url: string;
    name: string;
    description: string;
  } | null>(null);

  const starterPlayers = players.filter((p) => p.status === 'starter');
  const [rosterSlots, setRosterSlots] = useState([
    {
      playerId: starterPlayers[0]?.id || players[0]?.id || '',
      isSub: false,
      kills: 4,
      damage: 820,
      survivalMinutes: 28,
      survivalSeconds: 30
    },
    {
      playerId: starterPlayers[1]?.id || players[1]?.id || '',
      isSub: false,
      kills: 5,
      damage: 1140,
      survivalMinutes: 28,
      survivalSeconds: 30
    },
    {
      playerId: starterPlayers[2]?.id || players[2]?.id || '',
      isSub: false,
      kills: 3,
      damage: 690,
      survivalMinutes: 28,
      survivalSeconds: 30
    },
    {
      playerId: starterPlayers[3]?.id || players[3]?.id || '',
      isSub: false,
      kills: 2,
      damage: 420,
      survivalMinutes: 28,
      survivalSeconds: 30
    }
  ]);

  const [submittedBanner, setSubmittedBanner] = useState<string | null>(null);

  const currentTournament = tournaments.find((t) => t.id === tournamentId);
  const systemId = currentTournament?.points_system_id || activePointsSystem.id;
  const activeSystem = pointsSystems.find((ps) => ps.id === systemId) || activePointsSystem;

  const squadPlacementPoints =
    activeSystem.placement_points[placement] !== undefined
      ? activeSystem.placement_points[placement]
      : activeSystem.default_placement_points;

  const totalSquadKills = rosterSlots.reduce((acc, slot) => acc + (Number(slot.kills) || 0), 0);
  const totalSquadDamage = rosterSlots.reduce((acc, slot) => acc + (Number(slot.damage) || 0), 0);
  const totalSquadKillPoints = totalSquadKills * (activeSystem.kill_point_value || 1);
  const totalSquadPoints = squadPlacementPoints + totalSquadKillPoints;

  const handlePlayerSlotChange = (index: number, field: string, value: any) => {
    setRosterSlots((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setScreenshotData({
        data_url: result,
        name: file.name.replace(/\.[^/.]+$/, '') || `Match ${matchNumber} Scoreboard`,
        description: `Official result screenshot for Match #${matchNumber} on ${map}`
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const statsPayload = rosterSlots.map((slot) => ({
      player_id: slot.playerId,
      placement: Number(placement),
      kills: Number(slot.kills) || 0,
      damage: Number(slot.damage) || 0,
      survival_time_seconds: (Number(slot.survivalMinutes) || 0) * 60 + (Number(slot.survivalSeconds) || 0)
    }));

    addMatchWithStats(
      {
        tournament_id: tournamentId,
        match_number: Number(matchNumber),
        map,
        match_date: matchDate,
        status: 'completed'
      },
      statsPayload,
      screenshotData || undefined
    );

    if (Number(placement) === 1) {
      confetti({
        particleCount: 110,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e52535', '#ffffff', '#a855f7', '#22c55e']
      });
    }

    setSubmittedBanner(
      `Match #${matchNumber} (${map}) successfully saved! Total Points: ${totalSquadPoints} (${squadPlacementPoints} placement + ${totalSquadKillPoints} kills)`
    );

    setMatchNumber((prev) => prev + 1);
    setScreenshotData(null);

    setTimeout(() => {
      setSubmittedBanner(null);
      if (onSuccess) onSuccess();
    }, 2400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* OCR PLUGIN CARD WITH DISABLED BUTTON */}
      <section
        className="glass-panel"
        style={{
          padding: '18px 22px',
          borderLeft: '4px solid var(--accent-red)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'rgba(229, 37, 53, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-red)'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                MATCH RESULT SCREENSHOT UPLOAD
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                  STORAGE ENABLED
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#71717a' }}>
                Store official match end-screen screenshot with the record (OCR parser disabled)
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled
            className="btn btn-disabled"
            style={{ fontSize: '0.75rem', padding: '6px 14px' }}
          >
            <Lock size={13} />
            <span>⚡ Run OCR Auto-Scan (Plugin Disabled)</span>
          </button>
        </div>

        {!screenshotData ? (
          <div style={{
            border: '2px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '18px',
            textAlign: 'center',
            background: '#1c1d25'
          }}>
            <input
              type="file"
              id="file-screenshot-upload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <label
              htmlFor="file-screenshot-upload"
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Upload size={24} color="var(--accent-red)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                Click to attach Match End-Screen Screenshot (.png, .jpg)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Screenshot will be archived with full zoom-in, description edit, and delete controls
              </span>
            </label>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#1c1d25',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={screenshotData.data_url}
                alt="Screenshot preview"
                style={{ width: '56px', height: '36px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ffffff' }}>
                  {screenshotData.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>
                  Ready to store with Match #{matchNumber}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScreenshotData(null)}
              className="btn btn-danger"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
            >
              <Trash2 size={12} />
              <span>Remove</span>
            </button>
          </div>
        )}
      </section>

      {submittedBanner && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#4ade80',
            fontSize: '0.88rem',
            fontWeight: 700
          }}
        >
          <CheckCircle2 size={18} />
          <span>{submittedBanner}</span>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: '12px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
              <Crosshair size={20} color="var(--accent-red)" />
              MANUAL MATCH STAT ENTRY
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
              Configured points system: <strong>{activeSystem.name}</strong>
            </div>
          </div>

          <div className="badge badge-red" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
            <span>Kill: {activeSystem.kill_point_value} pt</span>
            <span>•</span>
            <span>WWCD (#1): {activeSystem.placement_points[1] || 10} pts</span>
          </div>
        </div>

        {/* Row 1 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
              TOURNAMENT
            </label>
            <select
              className="input-control"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              required
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
              MAP (RONDO INCLUDED)
            </label>
            <select
              className="input-control"
              value={map}
              onChange={(e) => setMap(e.target.value as BgmiMap)}
              required
            >
              <option value="Erangel">🏝️ Erangel (8x8)</option>
              <option value="Miramar">🏜️ Miramar (8x8)</option>
              <option value="Sanhok">🌴 Sanhok (4x4)</option>
              <option value="Vikendi">❄️ Vikendi (6x6)</option>
              <option value="Nusa">⚡ Nusa (1x1)</option>
              <option value="Rondo">🏯 Rondo (8x8)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
              MATCH NUMBER
            </label>
            <input
              type="number"
              min="1"
              max="50"
              className="input-control"
              value={matchNumber}
              onChange={(e) => setMatchNumber(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
              MATCH DATE
            </label>
            <input
              type="date"
              className="input-control"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Row 2: Placement */}
        <div style={{
          background: '#1c1d25',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <label style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={15} color="var(--bar-amber)" />
              SQUAD PLACEMENT FINISH
            </label>

            <div style={{ fontSize: '0.85rem', color: 'var(--accent-red)', fontWeight: 700 }}>
              Placement Points: +{squadPlacementPoints} pts
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((rank) => {
              const pts = activeSystem.placement_points[rank] !== undefined
                ? activeSystem.placement_points[rank]
                : activeSystem.default_placement_points;
              const isSelected = placement === rank;
              return (
                <button
                  key={rank}
                  type="button"
                  onClick={() => setPlacement(rank)}
                  style={{
                    flex: '1 0 42px',
                    padding: '6px 4px',
                    borderRadius: '6px',
                    background: isSelected ? 'var(--accent-red)' : '#15161c',
                    border: isSelected ? '1px solid var(--accent-red)' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '0.78rem'
                  }}
                >
                  <div>#{rank}</div>
                  <div style={{ fontSize: '0.62rem', opacity: 0.8 }}>{pts}p</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Player Slots */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
            SQUAD ROSTER & COMBAT STATS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rosterSlots.map((slot, index) => {
              const playerKills = Number(slot.kills) || 0;
              const playerKillPoints = playerKills * (activeSystem.kill_point_value || 1);
              const playerTotalPoints = squadPlacementPoints + playerKillPoints;

              return (
                <div
                  key={index}
                  style={{
                    background: '#1c1d25',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '10px',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#71717a', marginBottom: '3px' }}>
                      SLOT #{index + 1} PLAYER
                    </label>
                    <select
                      className="input-control"
                      value={slot.playerId}
                      onChange={(e) => handlePlayerSlotChange(index, 'playerId', e.target.value)}
                      required
                    >
                      <optgroup label="Starters">
                        {players.filter((p) => p.status === 'starter').map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.ign} ({p.role.toUpperCase()})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Standby / Substitutes">
                        {players.filter((p) => p.status === 'standby').map((p) => (
                          <option key={p.id} value={p.id}>
                            [SUB] {p.ign} ({p.role.toUpperCase()})
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#71717a', marginTop: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={slot.isSub}
                        onChange={(e) => handlePlayerSlotChange(index, 'isSub', e.target.checked)}
                        style={{ accentColor: 'var(--accent-red)' }}
                      />
                      <span>Substitute</span>
                    </label>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#71717a', marginBottom: '3px' }}>
                      KILLS
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      className="input-control"
                      value={slot.kills}
                      onChange={(e) => handlePlayerSlotChange(index, 'kills', Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#71717a', marginBottom: '3px' }}>
                      DAMAGE (HP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="4000"
                      step="10"
                      className="input-control"
                      value={slot.damage}
                      onChange={(e) => handlePlayerSlotChange(index, 'damage', Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#71717a', marginBottom: '3px' }}>
                      SURVIVAL TIME
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="0"
                        max="36"
                        className="input-control"
                        placeholder="Min"
                        value={slot.survivalMinutes}
                        onChange={(e) => handlePlayerSlotChange(index, 'survivalMinutes', Number(e.target.value))}
                        required
                      />
                      <span>:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        className="input-control"
                        placeholder="Sec"
                        value={slot.survivalSeconds}
                        onChange={(e) => handlePlayerSlotChange(index, 'survivalSeconds', Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ background: '#15161c', padding: '6px 10px', borderRadius: '6px', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: '#71717a' }}>PTS SUMMARY</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ffffff' }}>
                      {playerTotalPoints} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Summary */}
        <div style={{
          background: '#1c1d25',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#71717a' }}>SQUAD KILLS</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-red)' }}>{totalSquadKills}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#71717a' }}>DAMAGE</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff' }}>{totalSquadDamage} HP</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#71717a' }}>PLACEMENT PTS</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--bar-amber)' }}>+{squadPlacementPoints}</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-red)', fontWeight: 700 }}>TOTAL MATCH POINTS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>{totalSquadPoints} PTS</div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
            <CheckCircle2 size={16} />
            <span>Save Match Result</span>
          </button>
        </div>
      </form>
    </div>
  );
};
