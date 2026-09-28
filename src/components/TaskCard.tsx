import React, { useState } from 'react';
import type { Task, Project } from '../types';
import { 
  formatTimeDisplay, 
  calculateDuration, 
  calculateTotalDuration,
  calculateSlotDurationMinutes,
  calculateTotalMinutes,
  getDurationTier,
  getTaskOverallStatus, 
  getTaskStatusInfo, 
  getCurrentTimeString,
  normalizeTaskTimeSlots 
} from '../utils/dateUtils';
import { SearchableTimeInput } from './SearchableTimeInput';
import { 
  Check, 
  Trash2, 
  Edit3, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  Plus, 
  CheckCircle, 
  X,
  FileText
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  project?: Project;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onSetSlotStartTime?: (taskId: string, slotId: string, startTime: string) => void;
  onSetSlotEndTime: (taskId: string, slotId: string, endTime: string) => void;
  onAddTimeSlot: (taskId: string, startTime: string) => void;
  onUpdateSlotNote?: (taskId: string, slotId: string, note: string) => void;
  showProjectBadge?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  project,
  onToggleComplete,
  onEdit,
  onDelete,
  onSetSlotStartTime,
  onSetSlotEndTime,
  onAddTimeSlot,
  onUpdateSlotNote,
  showProjectBadge = false,
}) => {
  const [editingField, setEditingField] = useState<{ slotId: string; type: 'start' | 'end' } | null>(null);
  const [customTime, setCustomTime] = useState(getCurrentTimeString());
  const [editingNoteSlotId, setEditingNoteSlotId] = useState<string | null>(null);
  const [slotNoteText, setSlotNoteText] = useState<string>('');

  const slots = normalizeTaskTimeSlots(task);
  const status = getTaskOverallStatus(slots, task.completed);
  const info = getTaskStatusInfo(slots, task.completed);
  const totalDuration = calculateTotalDuration(slots);
  const totalMinutes = calculateTotalMinutes(slots);
  const totalTier = getDurationTier(totalMinutes);

  const lastSlot = slots[slots.length - 1];
  const canAddNewSession = !!lastSlot?.endTime;

  const handleStartEnteringStartTime = (slotId: string, currentStart?: string) => {
    setEditingField({ slotId, type: 'start' });
    setCustomTime(currentStart || getCurrentTimeString());
  };

  const handleStartEnteringEndTime = (slotId: string, currentEnd?: string) => {
    setEditingField({ slotId, type: 'end' });
    setCustomTime(currentEnd || getCurrentTimeString());
  };

  const handleSaveTime = (slotId: string, type: 'start' | 'end') => {
    if (customTime) {
      if (type === 'start' && onSetSlotStartTime) {
        onSetSlotStartTime(task.id, slotId, customTime);
      } else if (type === 'end') {
        onSetSlotEndTime(task.id, slotId, customTime);
      }
      setEditingField(null);
    }
  };

  const handleEndNow = (slotId: string) => {
    onSetSlotEndTime(task.id, slotId, getCurrentTimeString());
    setEditingField(null);
  };

  const handleAddNewSlot = () => {
    // Constraint: cannot create next session without endtime for current session
    if (lastSlot && !lastSlot.endTime) {
      handleStartEnteringEndTime(lastSlot.id);
      return;
    }
    onAddTimeSlot(task.id, getCurrentTimeString());
  };

  const handleStartEditNote = (slotId: string, currentNote?: string) => {
    setEditingNoteSlotId(slotId);
    setSlotNoteText(currentNote || '');
  };

  const handleSaveNote = (slotId: string) => {
    if (onUpdateSlotNote) {
      onUpdateSlotNote(task.id, slotId, slotNoteText.trim());
    }
    setEditingNoteSlotId(null);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <span className="shadcn-badge badge-completed">Completed</span>;
      case 'overdue':
        return (
          <span className="shadcn-badge badge-overdue">
            <AlertCircle size={11} /> Session Ended
          </span>
        );
      case 'in-progress':
        return (
          <span className="shadcn-badge badge-progress">
            <span className="pulsing-cyan-dot" /> In Progress
          </span>
        );
      case 'scheduled':
      default:
        return <span className="shadcn-badge badge-scheduled">Scheduled</span>;
    }
  };

  return (
    <div className={`shadcn-card task-card-item card-${status} ${task.completed ? 'task-done' : ''}`}>
      <div className="card-inner">
        {/* Tactile Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={task.completed}
          className={`shadcn-check ${task.completed ? 'is-checked' : ''}`}
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>

        <div className="card-content-area">
          {/* Top Bar */}
          <div className="card-top-bar">
            <div className="badge-row">
              {getStatusBadge()}
              {showProjectBadge && project && (
                <span 
                  className="project-chip"
                  style={{
                    backgroundColor: `${project.color}15`,
                    color: project.color,
                    borderColor: `${project.color}35`,
                  }}
                >
                  <span className="project-chip-dot" style={{ backgroundColor: project.color }} />
                  {project.name}
                </span>
              )}
            </div>

            <div className="action-button-group">
              <button
                type="button"
                className="shadcn-icon-action"
                onClick={() => onEdit(task)}
                title="Edit task & sessions"
                aria-label="Edit task"
              >
                <Edit3 size={13} />
              </button>
              <button
                type="button"
                className="shadcn-icon-action btn-del"
                onClick={() => onDelete(task.id)}
                title="Delete task (confirmation required)"
                aria-label="Delete task"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Task Title */}
          <h3 className={`task-title-text ${task.completed ? 'strikethrough' : ''}`}>
            {task.title}
          </h3>

          {/* Work Sessions (Time Slots) */}
          <div className="slots-timetable-container">
            {slots.map((slot, index) => {
              const isEditingStart = editingField?.slotId === slot.id && editingField?.type === 'start';
              const isEditingEnd = editingField?.slotId === slot.id && editingField?.type === 'end';
              const isEditingNote = editingNoteSlotId === slot.id;
              
              const slotMins = slot.endTime ? calculateSlotDurationMinutes(slot.startTime, slot.endTime) : 0;
              const slotDuration = slot.endTime ? calculateDuration(slot.startTime, slot.endTime) : '';
              const slotTier = getDurationTier(slotMins);

              return (
                <div key={slot.id} className="slot-wrapper">
                  <div className="slot-row">
                    <div className="slot-index-pill">
                      Session {index + 1}
                    </div>

                    <div className="slot-times-group">
                      {/* Start Time (display or change) */}
                      {isEditingStart ? (
                        <div className="inline-time-editor-box">
                          <SearchableTimeInput
                            value={customTime}
                            onChange={setCustomTime}
                            placeholder="Start time"
                            required
                            autoFocus
                            onEnterNext={() => handleSaveTime(slot.id, 'start')}
                          />
                          <div className="inline-actions-duo">
                            <button 
                              type="button"
                              className="inline-save-btn" 
                              title="Save start time"
                              onClick={() => handleSaveTime(slot.id, 'start')}
                            >
                              <CheckCircle size={15} />
                            </button>
                            <button 
                              type="button" 
                              className="inline-cancel-btn" 
                              onClick={() => setEditingField(null)}
                              title="Cancel"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="slot-time-unit">
                          <span className="time-val font-mono">{formatTimeDisplay(slot.startTime)}</span>
                          <button
                            type="button"
                            className="edit-slot-btn"
                            onClick={() => handleStartEnteringStartTime(slot.id, slot.startTime)}
                            title="Change start time"
                          >
                            <Edit3 size={11} />
                          </button>
                        </div>
                      )}

                      <ArrowRight size={12} className="time-arrow-mini" />

                      {/* End Time (display or change) */}
                      {isEditingEnd ? (
                        <div className="inline-time-editor-box">
                          <SearchableTimeInput
                            value={customTime}
                            onChange={setCustomTime}
                            placeholder="End time"
                            required
                            autoFocus
                            onEnterNext={() => handleSaveTime(slot.id, 'end')}
                          />
                          <div className="inline-actions-duo">
                            <button 
                              type="button"
                              className="inline-save-btn" 
                              title="Save end time"
                              onClick={() => handleSaveTime(slot.id, 'end')}
                            >
                              <CheckCircle size={15} />
                            </button>
                            <button 
                              type="button" 
                              className="inline-cancel-btn" 
                              onClick={() => setEditingField(null)}
                              title="Cancel"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                      ) : slot.endTime ? (
                        <div className="slot-end-val-row">
                          <span className="time-val font-mono">{formatTimeDisplay(slot.endTime)}</span>
                          
                          {/* Duration Pill with Hours Color (1h, 2h, ... 8h) */}
                          {slotDuration && (
                            <span 
                              className={`slot-duration-pill ${slotTier.badgeClass}`}
                              style={{ 
                                backgroundColor: slotTier.bgHex, 
                                borderColor: `${slotTier.dotColor}35`, 
                                color: slotTier.dotColor 
                              }}
                              title={`${slotTier.hoursLabel} tier (${slotDuration})`}
                            >
                              <span className="tier-dot" style={{ backgroundColor: slotTier.dotColor }} />
                              {slotDuration}
                            </span>
                          )}

                          <button
                            type="button"
                            className="edit-slot-btn"
                            onClick={() => handleStartEnteringEndTime(slot.id, slot.endTime)}
                            title="Change end time"
                          >
                            <Edit3 size={11} />
                          </button>
                        </div>
                      ) : (
                        <div className="enter-end-time-btn-row">
                          <button
                            type="button"
                            className="btn-enter-end-time"
                            onClick={() => handleStartEnteringEndTime(slot.id)}
                            title="Pick end time"
                          >
                            + End Time
                          </button>
                          <button
                            type="button"
                            className="btn-end-now"
                            onClick={() => handleEndNow(slot.id)}
                            title="Set to current time"
                          >
                            End Now
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Note Action Icon */}
                    <button
                      type="button"
                      className={`slot-note-btn ${slot.note ? 'has-note' : ''}`}
                      onClick={() => handleStartEditNote(slot.id, slot.note)}
                      title={slot.note ? `Note: ${slot.note}` : 'Add note for this session'}
                    >
                      <FileText size={12} />
                    </button>
                  </div>

                  {/* Session Note Display or Inline Edit */}
                  {isEditingNote ? (
                    <div className="inline-note-form">
                      <input
                        type="text"
                        className="shadcn-input inline-note-input"
                        placeholder="Add note for this session (e.g. Code review, debugging)..."
                        value={slotNoteText}
                        onChange={(e) => setSlotNoteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNote(slot.id);
                          if (e.key === 'Escape') setEditingNoteSlotId(null);
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="inline-save-btn"
                        onClick={() => handleSaveNote(slot.id)}
                        title="Save note"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        type="button"
                        className="inline-cancel-btn"
                        onClick={() => setEditingNoteSlotId(null)}
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : slot.note ? (
                    <div 
                      className="slot-note-bar"
                      onClick={() => handleStartEditNote(slot.id, slot.note)}
                      title="Click to edit note"
                    >
                      <span className="slot-note-text">
                        <FileText size={10} className="text-muted-foreground" />
                        {slot.note}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {/* Button to add another time slot - Only enabled if current session has end time! */}
            {!task.completed && (
              canAddNewSession ? (
                <button
                  type="button"
                  className="btn-add-session-slot"
                  onClick={handleAddNewSlot}
                  title="Add next work session"
                >
                  <Plus size={12} />
                  <span>+ Add Session (e.g. 2pm - 6pm)</span>
                </button>
              ) : (
                <div 
                  className="add-session-locked-pill"
                  onClick={() => handleStartEnteringEndTime(lastSlot.id)}
                  title="Click to enter end time for current session"
                >
                  <AlertCircle size={12} className="text-amber-500 shrink-0" />
                  <span>Enter end time for Session {slots.length} to start next session</span>
                </div>
              )
            )}
          </div>

          {/* Card Footer: Status & Colored Total Duration */}
          <div className="card-footer-meta">
            <div className="status-caption">
              <Clock size={12} />
              <span>{info.detail}</span>
            </div>

            {totalDuration && totalDuration !== '0m' && (
              <div 
                className="total-duration-badge"
                style={{ 
                  backgroundColor: totalTier.bgHex, 
                  borderColor: `${totalTier.dotColor}35` 
                }}
                title={`Total logged: ${totalDuration} (${totalTier.hoursLabel} tier)`}
              >
                <span className="total-duration-label">Total:</span>
                <span className="font-mono font-semibold" style={{ color: totalTier.dotColor }}>
                  {totalDuration}
                </span>
                <span 
                  className="tier-hour-pill" 
                  style={{ backgroundColor: totalTier.dotColor, color: '#ffffff' }}
                >
                  {totalTier.hoursLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
