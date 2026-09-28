import type { Project, Task, ThemeMode } from '../types';
import { normalizeTaskTimeSlots } from './dateUtils';

const PROJECTS_STORAGE_KEY = 'task_monitor_projects_v6';
const TASKS_STORAGE_KEY = 'task_monitor_tasks_v6';
const THEME_STORAGE_KEY = 'task_monitor_theme_v6';

export const INITIAL_PROJECTS: Project[] = [];

export function getInitialTasks(): Task[] {
  return [];
}

const DUMMY_PROJECT_IDS = new Set(['proj-1', 'proj-2']);
const DUMMY_TASK_IDS = new Set(['task-1', 'task-2', 'task-3']);

export function loadProjects(): Project[] {
  try {
    // Clear out prior dummy data from earlier storage versions
    ['task_monitor_projects_v5', 'task_monitor_tasks_v5', 'task_monitor_projects_v4', 'task_monitor_tasks_v4', 'task_monitor_projects_v3', 'task_monitor_tasks_v3'].forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });

    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((p) => p && !DUMMY_PROJECT_IDS.has(p.id) && p.name !== 'Frontend Development' && p.name !== 'Client Projects');
    }
    return [];
  } catch {
    return [];
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
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .filter((t) => t && !DUMMY_TASK_IDS.has(t.id) && !DUMMY_PROJECT_IDS.has(t.projectId))
        .map((t) => ({
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
