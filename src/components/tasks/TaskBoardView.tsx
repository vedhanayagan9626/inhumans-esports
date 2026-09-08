import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../../types';
import {
  CheckSquare,
  Plus,
  User,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Send,
  X
} from 'lucide-react';

export const TaskBoardView: React.FC = () => {
  const { currentUser, tasks, createTask, updateTaskStatus, addTaskComment, players } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTaskModal, setActiveTaskModal] = useState<Task | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [permissionAlert, setPermissionAlert] = useState<string | null>(null);

  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    category: 'aim' as TaskCategory,
    assigned_to_squad: true,
    assigned_to_player_id: '',
    priority: 'high' as TaskPriority,
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    is_recurring: false,
    recurrence_rule: 'daily' as 'daily' | 'weekly',
    status: 'assigned' as TaskStatus
  });

  const columns: { id: TaskStatus; label: string; badgeClass: string }[] = [
    { id: 'assigned', label: 'ASSIGNED', badgeClass: 'badge-purple' },
    { id: 'in_progress', label: 'IN PROGRESS', badgeClass: 'badge-cyan' },
    { id: 'completed', label: 'COMPLETED (IGL GATED)', badgeClass: 'badge-amber' },
    { id: 'verified', label: 'COACH VERIFIED', badgeClass: 'badge-green' }
  ];

  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const handleStatusChange = (taskId: string, targetStatus: TaskStatus) => {
    const res = updateTaskStatus(taskId, targetStatus);
    if (!res.success) {
      setPermissionAlert(res.message);
      setTimeout(() => setPermissionAlert(null), 3500);
    } else {
      if (activeTaskModal && activeTaskModal.id === taskId) {
        setActiveTaskModal((prev) => (prev ? { ...prev, status: targetStatus } : null));
      }
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskModal || !commentInput.trim()) return;
    addTaskComment(activeTaskModal.id, commentInput);
    setCommentInput('');
    const updated = tasks.find((t) => t.id === activeTaskModal.id);
    if (updated) setActiveTaskModal(updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask({
      title: newTaskData.title,
      description: newTaskData.description,
      category: newTaskData.category,
      assigned_by: currentUser?.id || 'admin',
      assigned_to_squad: newTaskData.assigned_to_squad,
      assigned_to_player_id: newTaskData.assigned_to_squad ? undefined : newTaskData.assigned_to_player_id,
      priority: newTaskData.priority,
      due_date: newTaskData.due_date,
      status: 'assigned',
      is_recurring: newTaskData.is_recurring,
      recurrence_rule: newTaskData.is_recurring ? newTaskData.recurrence_rule : undefined
    });
    setIsCreateModalOpen(false);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'high':
        return <span className="badge badge-red">HIGH</span>;
      case 'medium':
        return <span className="badge badge-amber">MEDIUM</span>;
      case 'low':
        return <span className="badge" style={{ background: '#1c1d25', color: '#71717a' }}>LOW</span>;
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
            <CheckSquare size={15} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
              Tactical Task & Drill Board
            </h1>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
              Role-gated Kanban: Only <strong>IGL</strong> can mark Completed • Only <strong>Coach</strong> can Verify or Reopen
            </div>
          </div>
        </div>

        <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary" id="btn-create-task">
          <Plus size={15} />
          <span>+ Create Drill / Task</span>
        </button>
      </div>

      {permissionAlert && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(229, 37, 53, 0.15)',
          border: '1px solid rgba(229, 37, 53, 0.3)',
          color: '#ff4d5e',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem'
        }}>
          <AlertTriangle size={16} />
          <span>{permissionAlert}</span>
        </div>
      )}

      {/* Category Pills */}
      <div className="hide-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'aim', label: '🎯 Aim / TDM' },
          { id: 'rotation', label: '🗺️ Rotations' },
          { id: 'vod_review', label: '📺 VOD Reviews' },
          { id: 'comms', label: '🎙️ Comms Protocol' },
          { id: 'drill', label: '🛡️ Utilities' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: selectedCategory === cat.id ? 'var(--accent-red)' : '#15161c',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: selectedCategory === cat.id ? 700 : 500,
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Kanban Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '14px',
        alignItems: 'start'
      }}>
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="glass-panel"
              style={{
                padding: '14px',
                background: '#15161c',
                minHeight: '440px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                paddingBottom: '8px'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                  {col.label}
                </span>
                <span className={`badge ${col.badgeClass}`} style={{ fontSize: '0.68rem' }}>
                  {colTasks.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#71717a', fontSize: '0.78rem' }}>
                    No tasks in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const assignedPlayer = players.find((p) => p.id === task.assigned_to_player_id);

                    return (
                      <div
                        key={task.id}
                        onClick={() => setActiveTaskModal(task)}
                        style={{
                          background: '#1c1d25',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>
                            {task.category.toUpperCase()}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>
                          {task.title}
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#a1a1aa', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {task.description}
                        </div>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.72rem',
                          color: '#71717a',
                          paddingTop: '6px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} />
                            <span>{task.assigned_to_squad ? 'Full Squad' : assignedPlayer?.ign || 'Player'}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MessageSquare size={12} />
                            <span>{task.comments.length}</span>
                          </div>
                        </div>

                        {/* Quick Role Actions */}
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }} onClick={(e) => e.stopPropagation()}>
                          {task.status === 'assigned' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'in_progress')}
                              className="btn btn-secondary"
                              style={{ width: '100%', padding: '5px', fontSize: '0.72rem' }}
                            >
                              Start Drill →
                            </button>
                          )}

                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'completed')}
                              className={`btn ${currentUser?.role === 'igl' || currentUser?.role === 'admin' || currentUser?.role === 'master_admin' ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ width: '100%', padding: '5px', fontSize: '0.72rem' }}
                            >
                              <CheckCircle2 size={12} />
                              <span>Mark Complete {currentUser?.role !== 'igl' && currentUser?.role !== 'admin' && currentUser?.role !== 'master_admin' && '(IGL Only)'}</span>
                            </button>
                          )}

                          {task.status === 'completed' && (
                            <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                              <button
                                onClick={() => handleStatusChange(task.id, 'verified')}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '5px', fontSize: '0.72rem' }}
                              >
                                Verify (Coach)
                              </button>
                              <button
                                onClick={() => handleStatusChange(task.id, 'in_progress')}
                                className="btn btn-secondary"
                                style={{ padding: '5px', fontSize: '0.72rem' }}
                              >
                                <RotateCcw size={12} />
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
          );
        })}
      </div>

      {/* Modal */}
      {activeTaskModal && (
        <div className="modal-backdrop" onClick={() => setActiveTaskModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span className="badge badge-red">{activeTaskModal.category.toUpperCase()}</span>
                  {getPriorityBadge(activeTaskModal.priority)}
                </div>
                <h2 style={{ fontSize: '1.2rem', color: '#ffffff' }}>{activeTaskModal.title}</h2>
              </div>
              <button onClick={() => setActiveTaskModal(null)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#1c1d25', padding: '12px', borderRadius: '6px', marginBottom: '16px', color: '#a1a1aa', fontSize: '0.85rem' }}>
              {activeTaskModal.description}
            </div>

            <div style={{
              background: '#15161c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>OPERATOR</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{currentUser?.name || 'User'} ({currentUser?.role ? currentUser.role.toUpperCase() : 'MEMBER'})</div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {activeTaskModal.status !== 'completed' && activeTaskModal.status !== 'verified' && (
                  <button
                    onClick={() => handleStatusChange(activeTaskModal.id, 'completed')}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Mark Completed (IGL Gated)</span>
                  </button>
                )}

                {activeTaskModal.status === 'completed' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(activeTaskModal.id, 'verified')}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                      <Sparkles size={14} />
                      <span>Verify Drill (Coach)</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(activeTaskModal.id, 'in_progress')}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                      <RotateCcw size={14} />
                      <span>Reopen</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Comments Stream */}
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '8px' }}>
                Comments & Drill Notes ({activeTaskModal.comments.length})
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {activeTaskModal.comments.length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: '#71717a', padding: '6px 0' }}>
                    No notes recorded yet.
                  </div>
                ) : (
                  activeTaskModal.comments.map((c) => (
                    <div key={c.id} style={{ background: '#1c1d25', padding: '8px 10px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#71717a', marginBottom: '2px' }}>
                        <strong style={{ color: 'var(--accent-red)' }}>{c.user_name} ({c.user_role.toUpperCase()})</strong>
                        <span>{c.created_at}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#ffffff' }}>{c.comment}</div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-control"
                  placeholder={`Comment as ${currentUser?.name || 'User'}...`}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px' }}>
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#ffffff' }}>ASSIGN TACTICAL DRILL / TASK</h2>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                  TASK TITLE *
                </label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                  DESCRIPTION *
                </label>
                <textarea
                  required
                  className="input-control"
                  rows={3}
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    CATEGORY
                  </label>
                  <select
                    className="input-control"
                    value={newTaskData.category}
                    onChange={(e) => setNewTaskData({ ...newTaskData, category: e.target.value as TaskCategory })}
                  >
                    <option value="aim">🎯 Aim / TDM Drill</option>
                    <option value="rotation">🗺️ Map Rotation</option>
                    <option value="vod_review">📺 VOD Review</option>
                    <option value="drill">🛡️ Squad Utility Drill</option>
                    <option value="comms">🎙️ Comms Protocol</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}>
                    PRIORITY
                  </label>
                  <select
                    className="input-control"
                    value={newTaskData.priority}
                    onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value as TaskPriority })}
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Drill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
