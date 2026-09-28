import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Task, Project } from '../types';
import { getCurrentTimeString, hasUnendedSession } from '../utils/dateUtils';
import { SearchableTimeInput } from './SearchableTimeInput';
import { Plus, Clock, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface QuickTaskBarProps {
  activeProjectId: string;
  projects: Project[];
  tasks: Task[];
  onAddTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  onEndActiveTask?: (taskId: string, endTime: string) => void;
}

export const QuickTaskBar: React.FC<QuickTaskBarProps> = ({
  activeProjectId,
  projects,
  tasks,
  onAddTask,
  onEndActiveTask,
}) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState(getCurrentTimeString());
  const [sessionNote, setSessionNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);

  // Check if there is an active running task without an end time
  const runningTask = useMemo(() => {
    return tasks.find((t) => !t.completed && hasUnendedSession(t));
  }, [tasks]);

  // Global shortcut: Alt+T focuses title input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        titleRef.current?.focus();
        titleRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!title.trim()) return;
      // Focus time input next
      const timeInputEl = document.querySelector('.quick-time-group input') as HTMLInputElement | null;
      if (timeInputEl) {
        timeInputEl.focus();
        timeInputEl.select();
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Constraint: User cannot create next task without end time for active task
    if (runningTask) {
      setErrorMsg(`Cannot create next task: Please enter end time for active task "${runningTask.title}" first.`);
      return;
    }

    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }

    const assignedProjectId = activeProjectId !== 'all' ? activeProjectId : (projects[0]?.id || '');
    if (!assignedProjectId) {
      setErrorMsg('Please create a project first before logging tasks.');
      return;
    }

    const initialStartTime = startTime || getCurrentTimeString();

    onAddTask({
      projectId: assignedProjectId,
      title: title.trim(),
      startTime: initialStartTime,
      timeSlots: [
        {
          id: `slot-${Date.now()}-1`,
          startTime: initialStartTime,
          note: sessionNote.trim() || undefined,
        }
      ],
      completed: false,
    });

    // Reset inputs, autofocus title
    setTitle('');
    setSessionNote('');
    setErrorMsg('');
    setStartTime(getCurrentTimeString());
    titleRef.current?.focus();
  };

  const handleQuickEndRunningTask = () => {
    if (runningTask && onEndActiveTask) {
      const unendedSlot = runningTask.timeSlots.find((s) => !s.endTime);
      if (unendedSlot) {
        onEndActiveTask(runningTask.id, getCurrentTimeString());
        setErrorMsg('');
      }
    }
  };

  const currentProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className={`quick-task-bar-card ${runningTask ? 'has-running-lock' : ''}`}>
      <div className="quick-task-bar-header">
        <div className="quick-bar-left-tag">
          <span className="quick-bar-tag">QUICK TASK ENTRY</span>
          <span className="shortcut-chip" title="Press Alt+T anytime to focus this input">
            Shortcut: <kbd className="kbd-badge">Alt+T</kbd>
          </span>
        </div>
        <span className="quick-bar-project-hint">
          Workspace: <strong>{currentProject ? currentProject.name : (projects[0]?.name || 'General')}</strong>
        </span>
      </div>

      {/* Warning if an active task has not ended yet */}
      {runningTask && (
        <div className="running-task-lock-banner" role="alert">
          <div className="lock-banner-left">
            <AlertCircle size={15} className="text-amber-500 shrink-0" />
            <span>
              Active Task in progress: <strong>&ldquo;{runningTask.title}&rdquo;</strong> has not ended yet.
              Please record its end time before creating the next task.
            </span>
          </div>
          {onEndActiveTask && (
            <button
              type="button"
              className="btn-end-running-quick"
              onClick={handleQuickEndRunningTask}
              title="End active task right now with current time"
            >
              <CheckCircle size={13} />
              <span>End &ldquo;{runningTask.title}&rdquo; Now</span>
            </button>
          )}
        </div>
      )}

      {errorMsg && !runningTask && (
        <div className="shadcn-alert-destructive text-xs" style={{ margin: 0, padding: '0.4rem 0.6rem' }}>
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="quick-task-form">
        {/* Task Title (Autofocus, Alt+T shortcut) */}
        <div className="quick-input-group flex-2">
          <label htmlFor="quick-task-title" className="quick-label">
            Task Title <span className="text-destructive">*</span>
          </label>
          <input
            id="quick-task-title"
            ref={titleRef}
            type="text"
            autoFocus
            disabled={!!runningTask}
            className="shadcn-input"
            placeholder={runningTask ? `Finish "${runningTask.title}" before starting new task` : "e.g. Design review (press Enter to jump to time)"}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            onKeyDown={handleTitleKeyDown}
            required
            autoComplete="off"
          />
        </div>

        {/* Start Time (Input type=time step=1 shadcn pattern) */}
        <div className="quick-input-group flex-1 quick-time-group">
          <label htmlFor="time-picker-optional" className="quick-label">
            <Clock size={12} /> Start Time <span className="text-destructive">*</span>
          </label>
          <SearchableTimeInput
            id="time-picker-optional"
            value={startTime}
            onChange={setStartTime}
            placeholder="10:30:00"
            step="1"
            required
            onEnterNext={handleSubmit}
          />
        </div>

        {/* Optional Session Note */}
        <div className="quick-input-group flex-1">
          <label htmlFor="quick-session-note" className="quick-label">
            <FileText size={12} /> Session Note (Optional)
          </label>
          <input
            id="quick-session-note"
            type="text"
            disabled={!!runningTask}
            className="shadcn-input"
            placeholder="e.g. Morning sprint block"
            value={sessionNote}
            onChange={(e) => setSessionNote(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Action Button */}
        <div className="quick-action-col">
          <button 
            type="submit" 
            disabled={!!runningTask}
            className={`shadcn-btn shadcn-btn-primary quick-add-btn ${runningTask ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={runningTask ? `Please end "${runningTask.title}" before starting a new task` : 'Add and start task'}
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </form>
    </div>
  );
};
