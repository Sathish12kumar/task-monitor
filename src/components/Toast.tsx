import React from 'react';
import type { ToastMessage } from '../types';
import { CheckCircle2, Clock, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="shadcn-toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const icon = 
          toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-500" /> :
          toast.type === 'info' ? <Info size={16} className="text-sky-500" /> :
          <Clock size={16} className="text-primary" />;

        return (
          <div key={toast.id} className="shadcn-toast-card animate-toast-in">
            <div className="toast-icon-wrap">{icon}</div>
            <div className="toast-text-wrap">
              <span className="toast-title">{toast.title}</span>
              {toast.description && (
                <span className="toast-desc">{toast.description}</span>
              )}
            </div>
            <button
              type="button"
              className="toast-dismiss-btn"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
