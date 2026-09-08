import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Investment, FinancialReturn, InvestmentType, ReturnType } from '../../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  X
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { investments, returns, addInvestment, addReturn, tournaments } = useApp();
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'investment' | 'return'>('investment');

  // Form State
  const [amount, setAmount] = useState<number>(15000);
  const [entryType, setEntryType] = useState<string>('scrims');
  const [tournamentId, setTournamentId] = useState<string>('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredInvestments = investments.filter((inv) => {
    if (selectedTournamentFilter === 'all') return true;
    return inv.tournament_id === selectedTournamentFilter;
  });

  const filteredReturns = returns.filter((ret) => {
    if (selectedTournamentFilter === 'all') return true;
    return ret.tournament_id === selectedTournamentFilter;
  });

  const totalInvested = filteredInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalEarned = filteredReturns.reduce((sum, ret) => sum + ret.amount, 0);
  const netPL = totalEarned - totalInvested;
  const roi = totalInvested > 0 ? ((netPL / totalInvested) * 100).toFixed(1) : '0.0';

  const handleOpenModal = (type: 'investment' | 'return') => {
    setModalType(type);
    setEntryType(type === 'investment' ? 'scrims' : 'prize');
    setAmount(type === 'investment' ? 25000 : 100000);
    setNote('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === 'investment') {
      addInvestment({
        tournament_id: tournamentId || undefined,
        type: entryType as InvestmentType,
        amount: Number(amount),
        note,
        spent_date: date
      });
    } else {
      addReturn({
        tournament_id: tournamentId || undefined,
        type: entryType as ReturnType,
        amount: Number(amount),
        note,
        received_date: date
      });
    }
    setIsModalOpen(false);
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
            <DollarSign size={15} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
              P&L Financial Ledger (Scrims, Training & Wildcards)
            </h1>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
              Allocations for daily paid scrims, wildcard slot entry fees, and tournament prize returns
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => handleOpenModal('investment')} className="btn btn-danger" style={{ padding: '7px 14px' }}>
            <PlusCircle size={14} />
            <span>- Log Expense / Scrims</span>
          </button>
          <button onClick={() => handleOpenModal('return')} className="btn btn-primary" style={{ padding: '7px 14px' }}>
            <PlusCircle size={14} />
            <span>+ Log Prize / Revenue</span>
          </button>
        </div>
      </div>

      {/* Metric Cards matching reference */}
      <div className="stat-grid">
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#71717a' }}>TOTAL INVESTED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: '4px 0' }}>
            ₹{totalInvested.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
            Scrims, Bootcamps, Wildcards & Gear
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--bar-green)' }}>TOTAL EARNED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--bar-green)', margin: '4px 0' }}>
            ₹{totalEarned.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
            Prize Money & Sponsorships
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', borderLeft: netPL >= 0 ? '3px solid var(--bar-green)' : '3px solid var(--accent-red)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: netPL >= 0 ? 'var(--bar-green)' : 'var(--accent-red)' }}>
            NET PROFIT / LOSS
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: netPL >= 0 ? 'var(--bar-green)' : 'var(--accent-red)', margin: '4px 0' }}>
            {netPL >= 0 ? `+₹${netPL.toLocaleString('en-IN')}` : `-₹${Math.abs(netPL).toLocaleString('en-IN')}`}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
            Cumulative campaign balance
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--bar-amber)' }}>RETURN ON INVESTMENT (ROI)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--bar-amber)', margin: '4px 0' }}>
            {roi}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
            Efficiency ratio across campaigns
          </div>
        </div>
      </div>

      {/* Filter by Tournament */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '0.8rem', color: '#71717a' }}>Filter Ledger:</span>
        <select
          className="input-control"
          style={{ width: 'auto', minWidth: '220px' }}
          value={selectedTournamentFilter}
          onChange={(e) => setSelectedTournamentFilter(e.target.value)}
        >
          <option value="all">All Operations (Scrims + Tourneys)</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Two Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-red)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={16} />
            INVESTMENTS & EXPENSES ({filteredInvestments.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredInvestments.length === 0 ? (
              <div style={{ color: '#71717a', fontSize: '0.8rem', padding: '16px 0' }}>
                No expenses logged for this filter.
              </div>
            ) : (
              filteredInvestments.map((inv) => {
                const tourney = tournaments.find((t) => t.id === inv.tournament_id);
                return (
                  <div
                    key={inv.id}
                    style={{
                      background: '#1c1d25',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: '3px solid var(--accent-red)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                        {inv.note}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                        <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>{inv.type.toUpperCase()}</span>
                        {tourney && <span style={{ marginLeft: '6px' }}>• {tourney.name}</span>}
                        <span style={{ marginLeft: '6px' }}>• {inv.spent_date}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-red)' }}>
                      -₹{inv.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--bar-green)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} />
            RETURNS & PRIZE MONEY ({filteredReturns.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredReturns.length === 0 ? (
              <div style={{ color: '#71717a', fontSize: '0.8rem', padding: '16px 0' }}>
                No returns logged for this filter.
              </div>
            ) : (
              filteredReturns.map((ret) => {
                const tourney = tournaments.find((t) => t.id === ret.tournament_id);
                return (
                  <div
                    key={ret.id}
                    style={{
                      background: '#1c1d25',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: '3px solid var(--bar-green)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                        {ret.note}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{ret.type.toUpperCase()}</span>
                        {tourney && <span style={{ marginLeft: '6px' }}>• {tourney.name}</span>}
                        <span style={{ marginLeft: '6px' }}>• {ret.received_date}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--bar-green)' }}>
                      +₹{ret.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#ffffff' }}>
                {modalType === 'investment' ? 'LOG EXPENSE / SCRIMS / WILDCARDS' : 'RECORD RETURN / PRIZE MONEY'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                  AMOUNT (₹ INR) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="500"
                  required
                  className="input-control"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    CATEGORY TYPE *
                  </label>
                  {modalType === 'investment' ? (
                    <select
                      className="input-control"
                      value={entryType}
                      onChange={(e) => setEntryType(e.target.value)}
                    >
                      <option value="scrims">Paid Daily Tier-1 Scrims Slot</option>
                      <option value="training">Training / Custom Room Drill Server</option>
                      <option value="wildcard">Wildcard Slot Registration Fee</option>
                      <option value="entry_fee">Official Tournament Entry Fee</option>
                      <option value="bootcamp">Bootcamp Accommodation</option>
                      <option value="gear">Gaming Gear & Accessories</option>
                      <option value="coaching">Specialist Coaching / VOD Analyst</option>
                      <option value="other">Travel & Logistics</option>
                    </select>
                  ) : (
                    <select
                      className="input-control"
                      value={entryType}
                      onChange={(e) => setEntryType(e.target.value)}
                    >
                      <option value="prize">Tournament Prize Money</option>
                      <option value="sponsorship">Brand Sponsorship / Jersey Sleeve</option>
                      <option value="other">YouTube Scrim Stream Revenue</option>
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    LINKED TOURNAMENT (OPTIONAL)
                  </label>
                  <select
                    className="input-control"
                    value={tournamentId}
                    onChange={(e) => setTournamentId(e.target.value)}
                  >
                    <option value="">None (General Team Operations)</option>
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                  DESCRIPTION *
                </label>
                <input
                  type="text"
                  required
                  className="input-control"
                  placeholder="e.g. Paid Tier-1 Scrims Slot - 2 Weeks package"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                  TRANSACTION DATE
                </label>
                <input
                  type="date"
                  className="input-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className={modalType === 'investment' ? 'btn btn-danger' : 'btn btn-primary'}>
                  {modalType === 'investment' ? 'Save Expense' : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
