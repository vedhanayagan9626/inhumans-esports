import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Check, X, UserCheck, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types';

interface UserApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserApprovalsModal: React.FC<UserApprovalsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, pendingUsers, approveUser, rejectUser } = useApp();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMasterAdmin = currentUser?.role === 'master_admin';
  const isAdminOrIgl = currentUser?.role === 'admin' || currentUser?.role === 'igl';

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'master_admin':
        return <span className="badge badge-amber">MASTER ADMIN</span>;
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

  const handleApprove = (userId: string) => {
    const res = approveUser(userId);
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleReject = (userId: string) => {
    const res = rejectUser(userId);
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <UserCheck size={20} color="var(--accent-red)" />
              PENDING LOGIN APPROVALS
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#71717a', marginTop: '3px' }}>
              {isMasterAdmin
                ? 'Master Admin (Shaam) authority: Approves Admin, IGL, Coach and Player login requests'
                : 'Admin / IGL authority: Can approve new Player login requests'}
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '0.82rem',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Pending Users List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
          {pendingUsers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: '#1c1d25',
              borderRadius: '10px',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              color: '#71717a'
            }}>
              <CheckCircle2 size={32} color="#22c55e" style={{ margin: '0 auto 10px auto', opacity: 0.8 }} />
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>No Pending Approvals</div>
              <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                All user accounts have been verified and activated.
              </div>
            </div>
          ) : (
            pendingUsers.map((user) => {
              const canActOnUser = isMasterAdmin || (isAdminOrIgl && user.role === 'player');

              return (
                <div
                  key={user.id}
                  style={{
                    background: '#1c1d25',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: '#15161c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem'
                    }}>
                      {user.avatar || '👤'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                          {user.name}
                        </span>
                        {getRoleBadge(user.role)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8a8d9a', marginTop: '2px' }}>
                        {user.email}
                      </div>
                      {user.created_at && (
                        <div style={{ fontSize: '0.68rem', color: '#52525b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Clock size={10} />
                          <span>Requested {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {canActOnUser ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(user.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            color: '#4ade80',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#22c55e'; e.currentTarget.style.color = '#ffffff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)'; e.currentTarget.style.color = '#4ade80'; }}
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(user.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(229, 37, 53, 0.15)',
                            border: '1px solid rgba(229, 37, 53, 0.3)',
                            color: '#ff4d5e',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-red)'; e.currentTarget.style.color = '#ffffff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(229, 37, 53, 0.15)'; e.currentTarget.style.color = '#ff4d5e'; }}
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} color="#f59e0b" />
                        <span>Requires Master Admin (Shaam)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{ marginTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
            Approving a player automatically registers their profile into Roster.
          </span>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
