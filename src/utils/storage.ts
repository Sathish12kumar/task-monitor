import type { Project, Task, ThemeMode } from '../types';
import { normalizeTaskTimeSlots } from './dateUtils';

const PROJECTS_STORAGE_KEY = 'task_monitor_projects_v5';
const TASKS_STORAGE_KEY = 'task_monitor_tasks_v5';
const THEME_STORAGE_KEY = 'task_monitor_theme_v5';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Frontend Development',
    description: 'Sprint tasks, split shifts & daily sessions',
    color: '#6366f1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    name: 'Client Projects',
    description: 'Scheduled milestones & billable hours',
    color: '#06b6d4',
    createdAt: new Date().toISOString(),
  }
];

export function getInitialTasks(): Task[] {
  return [
    {
      id: 'task-1',
      projectId: 'proj-1',
      title: 'UI Dashboard & Feature Implementation',
      // Morning 10:00 AM to 1:00 PM & Afternoon 2:00 PM to 6:00 PM as requested
      timeSlots: [
        {
          id: 'slot-1-1',
          startTime: '10:00',
          endTime: '13:00',
        },
        {
          id: 'slot-1-2',
          startTime: '14:00',
          endTime: '18:00',
        }
      ],
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      projectId: 'proj-1',
      title: 'Code review, test verification & QA',
      timeSlots: [
        {
          id: 'slot-2-1',
          startTime: '09:30',
          endTime: '12:00',
        },
        {
          id: 'slot-2-2',
          startTime: '14:30',
          // Active afternoon session waiting for end time!
        }
      ],
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      projectId: 'proj-2',
      title: 'Weekly sprint planning & architecture sync',
      timeSlots: [
        {
          id: 'slot-3-1',
          startTime: '11:00',
          endTime: '12:30',
        }
      ],
      completed: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      saveProjects(INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PROJECTS;
  } catch {
    return INITIAL_PROJECTS;
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to save projects to localStorage:', error);
  }
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialTasks();
      saveTasks(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((t) => ({
        ...t,
        timeSlots: normalizeTaskTimeSlots(t),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

export function loadTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Failed to save theme to localStorage:', error);
  }
}
