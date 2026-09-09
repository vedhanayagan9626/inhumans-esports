import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Investment, FinancialReturn, InvestmentType, ReturnType } from '../../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Edit2,
  Trash2,
  X
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const {
    currentUser,
    investments,
    returns,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addReturn,
    updateReturn,
    deleteReturn,
    tournaments
  } = useApp();
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'investment' | 'return'>('investment');
  const [editingEntry, setEditingEntry] = useState<{ type: 'investment' | 'return'; id: string } | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const canManageFinance = currentUser ? ['master_admin', 'admin', 'igl'].includes(currentUser.role) : true;
  const canDelete = currentUser ? ['master_admin', 'admin', 'igl'].includes(currentUser.role) : true;

  // Custom in-app delete confirmation modal (bulletproof across all browsers)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    type: 'investment' | 'return';
    id: string;
    note: string;
    amount: number;
  } | null>(null);

  const confirmAndExecuteDelete = () => {
    if (!deleteConfirmItem) return;
    if (deleteConfirmItem.type === 'investment') {
      deleteInvestment(deleteConfirmItem.id);
      setFeedbackBanner(`Expense entry "${deleteConfirmItem.note}" (-₹${deleteConfirmItem.amount.toLocaleString('en-IN')}) permanently deleted.`);
    } else {
      deleteReturn(deleteConfirmItem.id);
      setFeedbackBanner(`Revenue entry "${deleteConfirmItem.note}" (+₹${deleteConfirmItem.amount.toLocaleString('en-IN')}) permanently deleted.`);
    }
    setDeleteConfirmItem(null);
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

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
    setEditingEntry(null);
    setModalType(type);
    setEntryType(type === 'investment' ? 'scrims' : 'prize');
    setAmount(type === 'investment' ? 25000 : 100000);
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEditInvestment = (inv: Investment) => {
    setEditingEntry({ type: 'investment', id: inv.id });
    setModalType('investment');
    setAmount(inv.amount);
    setEntryType(inv.type);
    setTournamentId(inv.tournament_id || '');
    setNote(inv.note);
    setDate(inv.spent_date);
    setIsModalOpen(true);
  };

  const handleOpenEditReturn = (ret: FinancialReturn) => {
    setEditingEntry({ type: 'return', id: ret.id });
    setModalType('return');
    setAmount(ret.amount);
    setEntryType(ret.type);
    setTournamentId(ret.tournament_id || '');
    setNote(ret.note);
    setDate(ret.received_date);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      if (editingEntry.type === 'investment') {
        updateInvestment(editingEntry.id, {
          tournament_id: tournamentId || undefined,
          type: entryType as InvestmentType,
          amount: Number(amount),
          note,
          spent_date: date
        });
        setFeedbackBanner(`Expense record "${note}" updated successfully.`);
      } else {
        updateReturn(editingEntry.id, {
          tournament_id: tournamentId || undefined,
          type: entryType as ReturnType,
          amount: Number(amount),
          note,
          received_date: date
        });
        setFeedbackBanner(`Revenue entry "${note}" (+₹${Number(amount).toLocaleString('en-IN')}) updated successfully.`);
      }
      setTimeout(() => setFeedbackBanner(null), 3500);
    } else {
      if (modalType === 'investment') {
        addInvestment({
          tournament_id: tournamentId || undefined,
          type: entryType as InvestmentType,
          amount: Number(amount),
          note,
          spent_date: date
        });
        setFeedbackBanner(`New expense "${note}" recorded.`);
      } else {
        addReturn({
          tournament_id: tournamentId || undefined,
          type: entryType as ReturnType,
          amount: Number(amount),
          note,
          received_date: date
        });
        setFeedbackBanner(`New revenue entry "${note}" (+₹${Number(amount).toLocaleString('en-IN')}) recorded.`);
      }
      setTimeout(() => setFeedbackBanner(null), 3500);
    }
    setIsModalOpen(false);
    setEditingEntry(null);
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

      {feedbackBanner && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: 'var(--bar-green)',
          fontSize: '0.82rem',
          fontWeight: 600
        }}>
          {feedbackBanner}
        </div>
      )}

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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-red)' }}>
                        -₹{inv.amount.toLocaleString('en-IN')}
                      </div>
                      {canManageFinance && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditInvestment(inv)}
                            className="btn btn-secondary"
                            title="Edit Expense"
                            style={{ padding: '4px 9px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmItem({
                              type: 'investment',
                              id: inv.id,
                              note: inv.note,
                              amount: inv.amount
                            })}
                            className="btn btn-danger"
                            title="Delete Expense (Admin/Super Admin)"
                            style={{ padding: '4px 9px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--bar-green)' }}>
                        +₹{ret.amount.toLocaleString('en-IN')}
                      </div>
                      {canManageFinance && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditReturn(ret)}
                            className="btn btn-secondary"
                            title="Edit Revenue Entry"
                            style={{ padding: '4px 9px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmItem({
                              type: 'return',
                              id: ret.id,
                              note: ret.note,
                              amount: ret.amount
                            })}
                            className="btn btn-danger"
                            title="Delete Revenue Entry (Admin/Super Admin)"
                            style={{ padding: '4px 9px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
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
              <h2 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 800 }}>
                {editingEntry
                  ? (modalType === 'investment' ? 'EDIT EXPENSE RECORD' : 'EDIT REVENUE / PRIZE ENTRY')
                  : (modalType === 'investment' ? 'LOG EXPENSE / SCRIMS / WILDCARDS' : 'RECORD RETURN / PRIZE MONEY')}
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
                  step="1"
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                {editingEntry && canDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      const idToDelete = editingEntry.id;
                      const typeToDelete = editingEntry.type;
                      const noteToDelete = note;
                      const amountToDelete = Number(amount);
                      setIsModalOpen(false);
                      setDeleteConfirmItem({
                        type: typeToDelete,
                        id: idToDelete,
                        note: noteToDelete,
                        amount: amountToDelete
                      });
                    }}
                    className="btn btn-danger"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      padding: '8px 14px',
                      border: '1px solid rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete This Entry</span>
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className={modalType === 'investment' ? 'btn btn-danger' : 'btn btn-primary'}>
                    {editingEntry
                      ? (modalType === 'investment' ? 'Update Expense Record' : 'Update Revenue Entry')
                      : (modalType === 'investment' ? 'Save Expense' : 'Save Income')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulletproof In-App Delete Confirmation Modal (Admin & Super Admin Privilege) */}
      {deleteConfirmItem && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmItem(null)} style={{ zIndex: 1100 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              padding: '24px',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              boxShadow: '0 16px 48px rgba(239, 68, 68, 0.25)',
              background: '#0d0d10'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  flexShrink: 0
                }}
              >
                <Trash2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Admin / Super Admin Privilege • Delete
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 800, margin: '2px 0 0 0' }}>
                  Delete {deleteConfirmItem.type === 'investment' ? 'Expense Record' : 'Revenue Entry'}?
                </h3>
              </div>
            </div>

            <div
              style={{
                background: '#16161a',
                borderRadius: '8px',
                padding: '14px 16px',
                border: '1px solid #27272a',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '4px' }}>
                Description / Title:
              </div>
              <div style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 700, marginBottom: '10px' }}>
                "{deleteConfirmItem.note}"
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #27272a', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#71717a' }}>Amount:</span>
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: deleteConfirmItem.type === 'investment' ? '#ef4444' : 'var(--bar-green)'
                  }}
                >
                  {deleteConfirmItem.type === 'investment' ? '-' : '+'}₹{deleteConfirmItem.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#a1a1aa', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this entry? This action will immediately remove it from the live database, update team ROI and P&L calculations.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndExecuteDelete}
                className="btn btn-danger"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={16} />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
