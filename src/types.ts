export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  startTime: string; // e.g. "10:00"
  endTime?: string;  // e.g. "13:00"
  note?: string;     // Notes for this specific work session
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  timeSlots: TimeSlot[]; // Supports multiple sessions (e.g. 10am-1pm & 2pm-6pm)
  completed: boolean;
  createdAt: string;
  // Backward compatibility fields
  startTime?: string;
  endTime?: string;
}

export type TaskFilter = 'all' | 'in-progress' | 'completed' | 'overdue';
export type TaskSort = 'not-ended' | 'time-spent' | 'started-asc' | 'started-desc' | 'title';
export type ThemeMode = 'dark' | 'light';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'info';
}
