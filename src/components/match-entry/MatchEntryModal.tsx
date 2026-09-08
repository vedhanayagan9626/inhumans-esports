import React from 'react';
import { MatchEntryView } from './MatchEntryView';
import { X } from 'lucide-react';

interface MatchEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MatchEntryModal: React.FC<MatchEntryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '920px', padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={22} />
          </button>
        </div>

        <MatchEntryView onSuccess={onClose} />
      </div>
    </div>
  );
};
