import React, { useState } from 'react';
import { MatchScreenshot } from '../../types';
import { X, ZoomIn, ZoomOut, Edit3, Trash2, Check, Download } from 'lucide-react';

interface ScreenshotModalProps {
  screenshot: MatchScreenshot;
  onClose: () => void;
  onUpdate: (name: string, description: string) => void;
  onDelete: () => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  screenshot,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [zoom, setZoom] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(screenshot.name);
  const [description, setDescription] = useState(screenshot.description);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(name, description);
    setIsEditing(false);
  };

  return (
    <div className="lightbox-modal" onClick={onClose}>
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          width: '95vw',
          maxWidth: '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {screenshot.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Uploaded: {screenshot.uploaded_at}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '45px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px' }}
              title="Edit name and description"
            >
              <Edit3 size={16} />
              <span>Edit Info</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Delete this match screenshot?')) {
                  onDelete();
                  onClose();
                }
              }}
              className="btn btn-danger"
              style={{ padding: '6px 12px' }}
              title="Delete screenshot"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>

            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Edit Info Drawer */}
        {isEditing && (
          <form onSubmit={handleSaveEdit} style={{
            background: 'var(--bg-surface-elevated)',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Screenshot Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 2, minWidth: '260px' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Description or match notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
              <Check size={16} />
              <span>Save Details</span>
            </button>
          </form>
        )}

        {/* Image Preview Container */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          padding: '20px',
          minHeight: '380px'
        }}>
          <img
            src={screenshot.data_url}
            alt={screenshot.name}
            style={{
              maxWidth: '100%',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease',
              borderRadius: '6px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}
          />
        </div>

        {/* Footer Notes */}
        {screenshot.description && (
          <div style={{ padding: '10px 20px', background: '#ffffff', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>Note:</strong> {screenshot.description}
          </div>
        )}
      </div>
    </div>
  );
};
