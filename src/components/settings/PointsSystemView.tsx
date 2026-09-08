import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sliders, CheckCircle2, RefreshCw } from 'lucide-react';

export const PointsSystemView: React.FC = () => {
  const { pointsSystems, activePointsSystem, updatePointsSystem } = useApp();
  const [selectedSystemId, setSelectedSystemId] = useState<string>(activePointsSystem.id);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);

  const selectedSystem = pointsSystems.find((ps) => ps.id === selectedSystemId) || activePointsSystem;

  const [localPoints, setLocalPoints] = useState<Record<number, number>>(selectedSystem.placement_points);
  const [killPointVal, setKillPointVal] = useState<number>(selectedSystem.kill_point_value);
  const [defaultPlacementPts, setDefaultPlacementPts] = useState<number>(selectedSystem.default_placement_points);

  const handleSelectSystem = (id: string) => {
    setSelectedSystemId(id);
    const target = pointsSystems.find((ps) => ps.id === id) || activePointsSystem;
    setLocalPoints(target.placement_points);
    setKillPointVal(target.kill_point_value);
    setDefaultPlacementPts(target.default_placement_points);
  };

  const handlePlacementChange = (rank: number, val: number) => {
    setLocalPoints((prev) => ({
      ...prev,
      [rank]: Math.max(0, val)
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePointsSystem({
      ...selectedSystem,
      placement_points: localPoints,
      kill_point_value: Number(killPointVal),
      default_placement_points: Number(defaultPlacementPts)
    });

    setSaveSuccessBanner(true);
    setTimeout(() => setSaveSuccessBanner(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={22} color="var(--accent-blue)" />
            CONFIGURABLE TOURNAMENT POINTS MATRIX
          </h1>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Calibrate placement points tables and kill values per tournament
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {pointsSystems.map((ps) => (
            <button
              key={ps.id}
              onClick={() => handleSelectSystem(ps.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: selectedSystemId === ps.id ? 'var(--accent-blue-light)' : '#ffffff',
                border: selectedSystemId === ps.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                color: selectedSystemId === ps.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {ps.name} {ps.is_default && '★'}
            </button>
          ))}
        </div>
      </div>

      {saveSuccessBanner && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '6px',
          background: 'var(--accent-green-light)',
          border: '1px solid #a7f3d0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--accent-green)',
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={16} />
          <span>Points Matrix updated! Applied across all matches.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              {selectedSystem.name}
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              ID: {selectedSystem.id}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '3px', fontWeight: 600 }}>
                POINTS PER KILL
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                className="input-control"
                style={{ width: '90px', textAlign: 'center', fontWeight: 'bold' }}
                value={killPointVal}
                onChange={(e) => setKillPointVal(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '3px', fontWeight: 600 }}>
                DEFAULT PTS (9th+)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                className="input-control"
                style={{ width: '80px', textAlign: 'center' }}
                value={defaultPlacementPts}
                onChange={(e) => setDefaultPlacementPts(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </div>

        {/* 16 Ranks Grid */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            PLACEMENT POINTS (1st to 16th Rank)
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: '10px'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((rank) => {
              const currentPts = localPoints[rank] !== undefined ? localPoints[rank] : defaultPlacementPts;
              const isWWCD = rank === 1;

              return (
                <div
                  key={rank}
                  style={{
                    background: isWWCD ? 'var(--accent-amber-light)' : 'var(--bg-surface-elevated)',
                    border: isWWCD ? '1px solid #fde68a' : '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: isWWCD ? 'var(--accent-amber)' : 'var(--text-primary)'
                  }}>
                    {isWWCD && '🍗 '}RANK #{rank}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      className="input-control"
                      style={{
                        width: '54px',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        padding: '4px'
                      }}
                      value={currentPts}
                      onChange={(e) => handlePlacementChange(rank, Number(e.target.value))}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              setLocalPoints(selectedSystem.placement_points);
              setKillPointVal(selectedSystem.kill_point_value);
            }}
            className="btn btn-secondary"
          >
            <RefreshCw size={13} />
            <span>Reset Unsaved</span>
          </button>

          <button type="submit" className="btn btn-primary" id="btn-save-points-matrix">
            <CheckCircle2 size={15} />
            <span>Save Points Matrix</span>
          </button>
        </div>
      </form>
    </div>
  );
};
