import React, { useState, useEffect, useRef } from 'react';
import type { Task, Project, TimeSlot } from '../types';
import { normalizeTaskTimeSlots, hasUnendedSession } from '../utils/dateUtils';
import { SearchableTimeInput } from './SearchableTimeInput';
import { ConfirmModal } from './ConfirmModal';
import { X, Clock, AlertCircle, Plus, Trash2, FileText } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt'>, existingId?: string) => void;
  projects: Project[];
  tasks: Task[];
  activeProjectId: string;
  initialTask?: Task | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projects,
  tasks,
  activeProjectId,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [projectId, setProjectId] = useState(activeProjectId);
  const [error, setError] = useState('');
  const [sessionToDeleteIndex, setSessionToDeleteIndex] = useState<number | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Check if any other task is currently running without end time
  const runningTask = !initialTask ? tasks.find((t) => !t.completed && hasUnendedSession(t)) : null;

  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTitle(initialTask.title);
        setTimeSlots(normalizeTaskTimeSlots(initialTask));
        setProjectId(initialTask.projectId);
      } else {
        setTitle('');
        // Default with morning session 10:00 to 13:00 as requested
        setTimeSlots([
          {
            id: `slot-${Date.now()}-1`,
            startTime: '10:00',
            endTime: '13:00',
            note: 'Morning work block',
          },
          {
            id: `slot-${Date.now()}-2`,
            startTime: '14:00',
            endTime: '18:00',
            note: 'Afternoon session',
          }
        ]);
        setProjectId(activeProjectId !== 'all' ? activeProjectId : (projects[0]?.id || ''));
      }
      setError('');
      setSessionToDeleteIndex(null);

      const timer = setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isOpen, initialTask, activeProjectId, projects]);

  if (!isOpen) return null;

  const handleSlotChange = (index: number, field: 'startTime' | 'endTime' | 'note', value: string) => {
    setTimeSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
    if (error) setError('');
  };

  const handleAddSlot = () => {
    // Constraint: cannot create next session without endtime for current session
    const lastSlot = timeSlots[timeSlots.length - 1];
    if (lastSlot && !lastSlot.endTime) {
      setError(`Please enter an end time for Session ${timeSlots.length} before adding another session.`);
      return;
    }

    let nextStart = '14:00';
    if (lastSlot?.endTime) {
      const [h] = lastSlot.endTime.split(':').map((x) => parseInt(x, 10));
      nextStart = `${Math.min(23, h + 1).toString().padStart(2, '0')}:00`;
    }

    setTimeSlots((prev) => [
      ...prev,
      {
        id: `slot-${Date.now()}-${prev.length + 1}`,
        startTime: nextStart,
        endTime: '',
        note: '',
      }
    ]);
    setError('');
  };

  const handlePromptDeleteSession = (index: number) => {
    if (timeSlots.length <= 1) return;
    setSessionToDeleteIndex(index);
  };

  const handleConfirmDeleteSession = () => {
    if (sessionToDeleteIndex !== null) {
      setTimeSlots((prev) => prev.filter((_, i) => i !== sessionToDeleteIndex));
      setSessionToDeleteIndex(null);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Constraint: User cannot create next task without end time for active task
    if (runningTask) {
      setError(`Cannot create task: Active task "${runningTask.title}" has not ended yet. Please record its end time first.`);
      return;
    }

    if (!title.trim()) {
      setError('Please enter a task title');
      titleInputRef.current?.focus();
      return;
    }

    if (timeSlots.length === 0 || !timeSlots[0].startTime) {
      setError('Please enter at least one session start time');
      return;
    }

    // Constraint: For multi-sessions, previous sessions must have an end time
    for (let i = 0; i < timeSlots.length - 1; i++) {
      if (!timeSlots[i].endTime) {
        setError(`Session ${i + 1} does not have an end time. Please specify end time before saving.`);
        return;
      }
    }

    const assignedProjectId = projectId || projects[0]?.id;
    if (!assignedProjectId) {
      setError('Please select a project');
      return;
    }

    onSave(
      {
        projectId: assignedProjectId,
        title: title.trim(),
        timeSlots,
        completed: initialTask ? initialTask.completed : false,
      },
      initialTask?.id
    );

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && sessionToDeleteIndex === null) onClose();
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} onKeyDown={handleKeyDown}>
        <div
          className="shadcn-dialog modal-multi-session"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-dialog-title"
        >
          <div className="dialog-header">
            <div className="dialog-header-text">
              <h2 id="task-dialog-title">{initialTask ? 'Edit Task Sessions' : 'New Task with Sessions'}</h2>
              <p className="dialog-desc">Type or search times & add session notes (e.g. 10am-1pm & 2pm-6pm)</p>
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

          {runningTask && (
            <div className="running-task-lock-banner" style={{ margin: '0.75rem 1.25rem 0' }}>
              <AlertCircle size={15} className="text-amber-500 shrink-0" />
              <span>
                Active Task in progress: <strong>&ldquo;{runningTask.title}&rdquo;</strong> has not ended yet.
                You must end it before creating a new task.
              </span>
            </div>
          )}

          {error && (
            <div className="shadcn-alert-destructive" role="alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="dialog-form">
            {/* Project Selection */}
            <div className="form-field">
              <label htmlFor="task-project" className="field-label">
                Project Workspace
              </label>
              <select
                id="task-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="shadcn-select w-full"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title Field */}
            <div className="form-field">
              <label htmlFor="task-title" className="field-label">
                Task Title <span className="text-destructive">*</span>
              </label>
              <input
                id="task-title"
                ref={titleInputRef}
                type="text"
                autoFocus
                disabled={!!runningTask}
                className="shadcn-input"
                placeholder={runningTask ? `Finish "${runningTask.title}" first` : "e.g. Frontend Development & Testing"}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                required
                autoComplete="off"
              />
            </div>

            {/* Time Sessions List */}
            <div className="form-field">
              <div className="field-header-row">
                <label className="field-label">
                  <Clock size={13} /> Work Sessions / Time Slots
                </label>
                <span className="text-xs text-muted-foreground">Type or pick from dropdown</span>
              </div>

              <div className="modal-slots-list">
                {timeSlots.map((slot, index) => (
                  <div key={slot.id || index} className="modal-slot-item">
                    <div className="modal-slot-header">
                      <span className="slot-badge-label">
                        Session {index + 1}
                      </span>
                      {timeSlots.length > 1 && (
                        <button
                          type="button"
                          className="btn-trash-slot-mini"
                          onClick={() => handlePromptDeleteSession(index)}
                          title="Delete this session (confirmation modal)"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="slot-inputs-grid">
                      <div className="slot-time-input-group">
                        <span className="mini-sub-label">Start Time</span>
                        <SearchableTimeInput
                          value={slot.startTime}
                          onChange={(val) => handleSlotChange(index, 'startTime', val)}
                          placeholder="e.g. 10:00 AM"
                          required
                        />
                      </div>

                      <div className="slot-time-input-group">
                        <span className="mini-sub-label">End Time (Optional for last session)</span>
                        <SearchableTimeInput
                          value={slot.endTime || ''}
                          onChange={(val) => handleSlotChange(index, 'endTime', val)}
                          placeholder="e.g. 01:00 PM"
                        />
                      </div>
                    </div>

                    {/* Session Note */}
                    <div className="slot-note-field">
                      <span className="mini-sub-label">
                        <FileText size={11} /> Session Notes
                      </span>
                      <input
                        type="text"
                        className="shadcn-input text-xs"
                        placeholder="e.g. Morning feature development, bug fixes..."
                        value={slot.note || ''}
                        onChange={(e) => handleSlotChange(index, 'note', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Button to add another session */}
              <button
                type="button"
                className="shadcn-btn shadcn-btn-outline w-full justify-center btn-add-another-slot"
                onClick={handleAddSlot}
              >
                <Plus size={14} />
                <span>+ Add Another Session (e.g. 2:00 PM to 6:00 PM)</span>
              </button>
            </div>

            <div className="dialog-footer">
              <button type="button" className="shadcn-btn shadcn-btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!runningTask}
                className={`shadcn-btn shadcn-btn-primary ${runningTask ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {initialTask ? 'Update Sessions' : 'Save Task'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal for Session Deletion */}
      <ConfirmModal
        isOpen={sessionToDeleteIndex !== null}
        title="Delete Work Session?"
        message={`Are you sure you want to delete Session ${(sessionToDeleteIndex !== null ? sessionToDeleteIndex + 1 : 1)}? This cannot be undone.`}
        confirmLabel="Delete Session"
        onConfirm={handleConfirmDeleteSession}
        onCancel={() => setSessionToDeleteIndex(null)}
      />
    </>
  );
};
