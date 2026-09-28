import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop confirm-modal-backdrop" onClick={onCancel}>
      <div 
        className="shadcn-dialog confirm-dialog-box" 
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        <div className="confirm-modal-content">
          <div className="confirm-icon-bubble">
            <AlertTriangle size={22} className="text-destructive" />
          </div>
          
          <div className="confirm-text-area">
            <h3 id="confirm-modal-title" className="confirm-modal-title">
              {title}
            </h3>
            <p id="confirm-modal-desc" className="confirm-modal-desc">
              {message}
            </p>
          </div>

          <button
            type="button"
            className="dialog-close-btn confirm-close-btn"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="shadcn-btn shadcn-btn-outline"
            onClick={onCancel}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`shadcn-btn ${isDestructive ? 'btn-destructive' : 'shadcn-btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
