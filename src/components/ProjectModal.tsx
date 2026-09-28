import React, { useState, useEffect, useRef } from 'react';
import type { Project } from '../types';
import { X, Palette, AlertCircle } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'createdAt'>, existingId?: string) => void;
  initialProject?: Project | null;
}

const COLOR_PALETTE = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Blue', value: '#3b82f6' },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0].value);
  const [error, setError] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialProject) {
        setName(initialProject.name);
        setDescription(initialProject.description || '');
        setColor(initialProject.color || COLOR_PALETTE[0].value);
      } else {
        setName('');
        setDescription('');
        const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)].value;
        setColor(randomColor);
      }
      setError('');

      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isOpen, initialProject]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please provide a project name');
      if (nameInputRef.current) nameInputRef.current.focus();
      return;
    }

    onSave(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      },
      initialProject?.id
    );

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} onKeyDown={handleKeyDown}>
      <div
        className="shadcn-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
      >
        <div className="dialog-header">
          <div className="dialog-header-text">
            <h2 id="project-modal-title">{initialProject ? 'Edit Project' : 'New Project'}</h2>
            <p className="dialog-desc">Create a workspace to organize your scheduled tasks</p>
          </div>
          <button
            type="button"
            className="dialog-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="shadcn-alert-destructive" role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-field">
            <label htmlFor="project-name" className="field-label">
              Project Name <span className="text-destructive">*</span>
            </label>
            <input
              id="project-name"
              ref={nameInputRef}
              type="text"
              autoFocus
              className="shadcn-input"
              placeholder="e.g., Mobile App Launch or Client Redesign"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label htmlFor="project-desc" className="field-label">
              Description (Optional)
            </label>
            <input
              id="project-desc"
              type="text"
              className="shadcn-input"
              placeholder="e.g., Deliverables, milestones & release goals"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              <Palette size={13} /> Project Accent Color
            </label>
            <div className="color-swatch-list">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`color-swatch-btn ${color === c.value ? 'selected' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                  aria-label={`Select ${c.name} color`}
                >
                  {color === c.value && <div className="color-swatch-check" />}
                </button>
              ))}
            </div>
          </div>

          <div className="dialog-footer">
            <button type="button" className="shadcn-btn shadcn-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="shadcn-btn shadcn-btn-primary">
              {initialProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
