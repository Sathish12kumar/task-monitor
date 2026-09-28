import type { Task, TimeSlot } from '../types';

export function getCurrentTimeString(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function formatTimeDisplay(timeStr?: string): string {
  if (!timeStr) return '';

  // Case 1: time is in "HH:mm" or "HH:mm:ss"
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const padHours = hours.toString().padStart(2, '0');
    return `${padHours}:${minutes} ${ampm}`;
  }

  // Case 2: ISO string
  const d = new Date(timeStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  return timeStr;
}

export function parseMinutesFromTime(timeStr?: string): number {
  if (!timeStr) return 0;
  
  if (/^\d{1,2}:\d{2}/.test(timeStr)) {
    const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
    return h * 60 + m;
  }

  const d = new Date(timeStr);
  if (!isNaN(d.getTime())) {
    return d.getHours() * 60 + d.getMinutes();
  }

  return 0;
}

export function calculateSlotDurationMinutes(startTime: string, endTime?: string): number {
  if (!startTime || !endTime) return 0;

  const startMins = parseMinutesFromTime(startTime);
  const endMins = parseMinutesFromTime(endTime);

  let diff = endMins - startMins;
  if (diff < 0) {
    diff += 24 * 60; // Crosses midnight
  }
  return diff;
}

export function formatMinutesToDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function calculateDuration(startTime: string, endTime?: string): string {
  const mins = calculateSlotDurationMinutes(startTime, endTime);
  return formatMinutesToDuration(mins);
}

export function calculateTotalMinutes(timeSlots: TimeSlot[]): number {
  let total = 0;
  for (const s of timeSlots) {
    if (s.startTime && s.endTime) {
      total += calculateSlotDurationMinutes(s.startTime, s.endTime);
    }
  }
  return total;
}

export function calculateTotalDuration(timeSlots: TimeSlot[]): string {
  const totalMins = calculateTotalMinutes(timeSlots);
  return formatMinutesToDuration(totalMins);
}

export function normalizeTaskTimeSlots(task: Partial<Task>): TimeSlot[] {
  if (Array.isArray(task.timeSlots) && task.timeSlots.length > 0) {
    return task.timeSlots;
  }
  if (task.startTime) {
    return [
      {
        id: `slot-${Date.now()}-1`,
        startTime: task.startTime,
        endTime: task.endTime,
      }
    ];
  }
  return [
    {
      id: `slot-${Date.now()}-1`,
      startTime: getCurrentTimeString(),
    }
  ];
}

export function getTaskPrimaryStartTime(task: Task): string {
  const slots = normalizeTaskTimeSlots(task);
  return slots[0]?.startTime || '00:00';
}

export function hasUnendedSession(task: Task): boolean {
  if (task.completed) return false;
  const slots = normalizeTaskTimeSlots(task);
  return slots.some((s) => !s.endTime);
}

export type TaskStatus = 'completed' | 'in-progress' | 'overdue' | 'scheduled';

export function getTaskOverallStatus(timeSlots: TimeSlot[], completed?: boolean): TaskStatus {
  if (completed) return 'completed';
  if (!timeSlots || timeSlots.length === 0) return 'scheduled';

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  // Check if any slot is currently active (start <= now <= end or no end)
  for (const slot of timeSlots) {
    const startMins = parseMinutesFromTime(slot.startTime);
    const endMins = slot.endTime ? parseMinutesFromTime(slot.endTime) : null;

    if (endMins !== null) {
      if (endMins >= startMins) {
        if (currentMins >= startMins && currentMins <= endMins) {
          return 'in-progress';
        }
      } else {
        if (currentMins >= startMins || currentMins <= endMins) {
          return 'in-progress';
        }
      }
    } else {
      if (currentMins >= startMins) {
        return 'in-progress';
      }
    }
  }

  // Check if all slots are in the future
  const allFuture = timeSlots.every((s) => parseMinutesFromTime(s.startTime) > currentMins);
  if (allFuture) return 'scheduled';

  // If latest slot has ended
  const lastSlot = timeSlots[timeSlots.length - 1];
  if (lastSlot && lastSlot.endTime) {
    const endMins = parseMinutesFromTime(lastSlot.endTime);
    if (currentMins > endMins) return 'overdue';
  }

  return 'in-progress';
}

export function getTaskStatusInfo(timeSlots: TimeSlot[], completed?: boolean): {
  label: string;
  detail: string;
} {
  if (completed) {
    return { label: 'Completed', detail: 'Task finished' };
  }

  const status = getTaskOverallStatus(timeSlots, completed);
  const total = calculateTotalDuration(timeSlots);

  if (status === 'in-progress') {
    return {
      label: 'In Progress',
      detail: total && total !== '0m' ? `Logged: ${total}` : 'Active session',
    };
  }

  if (status === 'overdue') {
    return {
      label: 'Session Ended',
      detail: total && total !== '0m' ? `Total duration: ${total}` : 'Ended',
    };
  }

  return {
    label: 'Scheduled',
    detail: `${timeSlots.length} session${timeSlots.length > 1 ? 's' : ''} planned`,
  };
}

// -------------------------------------------------------------
// Hours-based Color Categorization (1h, 2h, ... 8h)
// -------------------------------------------------------------
export interface DurationTier {
  hoursLabel: string;
  badgeClass: string;
  dotColor: string;
  bgHex: string;
}

export function getDurationTier(minutes: number): DurationTier {
  if (minutes <= 0) {
    return { hoursLabel: '0h', badgeClass: 'dur-tier-0', dotColor: '#94a3b8', bgHex: '#f1f5f9' };
  }
  const hours = minutes / 60;
  if (hours < 1) {
    return { hoursLabel: '<1h', badgeClass: 'dur-tier-sub1', dotColor: '#0ea5e9', bgHex: 'rgba(14, 165, 233, 0.12)' }; // sky
  }
  if (hours < 2) {
    return { hoursLabel: '1h', badgeClass: 'dur-tier-1', dotColor: '#0d9488', bgHex: 'rgba(13, 148, 136, 0.12)' }; // teal
  }
  if (hours < 3) {
    return { hoursLabel: '2h', badgeClass: 'dur-tier-2', dotColor: '#10b981', bgHex: 'rgba(16, 185, 129, 0.12)' }; // emerald
  }
  if (hours < 4) {
    return { hoursLabel: '3h', badgeClass: 'dur-tier-3', dotColor: '#65a30d', bgHex: 'rgba(101, 163, 13, 0.12)' }; // lime
  }
  if (hours < 5) {
    return { hoursLabel: '4h', badgeClass: 'dur-tier-4', dotColor: '#d97706', bgHex: 'rgba(217, 119, 6, 0.12)' }; // amber
  }
  if (hours < 6) {
    return { hoursLabel: '5h', badgeClass: 'dur-tier-5', dotColor: '#ea580c', bgHex: 'rgba(234, 88, 12, 0.12)' }; // orange
  }
  if (hours < 7) {
    return { hoursLabel: '6h', badgeClass: 'dur-tier-6', dotColor: '#db2777', bgHex: 'rgba(219, 39, 119, 0.12)' }; // pink
  }
  if (hours < 8) {
    return { hoursLabel: '7h', badgeClass: 'dur-tier-7', dotColor: '#7c3aed', bgHex: 'rgba(124, 58, 237, 0.12)' }; // purple
  }
  return { hoursLabel: '8h+', badgeClass: 'dur-tier-8', dotColor: '#e11d48', bgHex: 'rgba(225, 29, 72, 0.12)' }; // rose/red
}

// -------------------------------------------------------------
// Searchable / Typable Time Options & Parser
// -------------------------------------------------------------
export interface TimeOption {
  value: string; // "10:00"
  label: string; // "10:00 AM"
  searchText: string;
}

export function generateTimeOptions(): TimeOption[] {
  const options: TimeOption[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const padH = h.toString().padStart(2, '0');
      const padM = m.toString().padStart(2, '0');
      const val = `${padH}:${padM}`;
      const display = formatTimeDisplay(val);
      const h12 = h % 12 || 12;
      const ampm = h >= 12 ? 'pm' : 'am';
      const searchText = `${val} ${display} ${h12}${ampm} ${h12}:${padM}${ampm} ${h12} ${h}`.toLowerCase();
      options.push({
        value: val,
        label: display,
        searchText,
      });
    }
  }
  return options;
}

export function parseFreeformTime(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  
  // Standard HH:mm or H:mm
  if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }

  // e.g. "10am", "2pm", "10:30am", "2:45pm", "10 am", "1 pm"
  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPm = ampmMatch[3] === 'pm';
    if (hours === 12) {
      hours = isPm ? 12 : 0;
    } else if (isPm) {
      hours += 12;
    }
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Just a number e.g. "9", "10", "14"
  if (/^\d{1,2}$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num >= 0 && num <= 23) {
      return `${num.toString().padStart(2, '0')}:00`;
    }
  }

  return null;
}
