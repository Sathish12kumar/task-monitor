import { useState, useEffect, useMemo } from 'react';
import type { Project, Task, TaskSort, ThemeMode, TimeSlot, ToastMessage } from './types';
import { 
  loadProjects, 
  saveProjects, 
  loadTasks, 
  saveTasks,
  loadTheme,
  saveTheme 
} from './utils/storage';
import { 
  parseMinutesFromTime, 
  normalizeTaskTimeSlots, 
  getTaskPrimaryStartTime,
  hasUnendedSession,
  calculateTotalMinutes,
  formatTimeDisplay
} from './utils/dateUtils';
import { exportTasksToExcel } from './utils/exportToExcel';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { QuickTaskBar } from './components/QuickTaskBar';
import { TaskCard } from './components/TaskCard';
import { TaskFormModal } from './components/TaskFormModal';
import { ProjectModal } from './components/ProjectModal';
import { EmptyState } from './components/EmptyState';
import { ToastContainer } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import './App.css';

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [activeProjectId, setActiveProjectId] = useState<string>('all');
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sort, setSort] = useState<TaskSort>('not-ended');
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState<boolean>(true);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Confirmation Modal state for deletion actions
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const addToast = (title: string, description?: string, type: 'default' | 'success' | 'info' = 'default') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Clock ticker to update running times live
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Sync projects and tasks to LocalStorage
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (activeProjectId !== 'all' && !projects.some((p) => p.id === activeProjectId)) {
      setActiveProjectId('all');
    }
  }, [projects, activeProjectId]);

  const activeProject = useMemo(() => {
    if (activeProjectId === 'all') return undefined;
    return projects.find((p) => p.id === activeProjectId);
  }, [projects, activeProjectId]);

  const scopedTasks = useMemo(() => {
    if (activeProjectId === 'all') {
      return tasks;
    }
    return tasks.filter((t) => t.projectId === activeProjectId);
  }, [tasks, activeProjectId]);

  // Filtered & Sorted tasks
  const { activeTasks, completedTasks, hasMatches } = useMemo(() => {
    let result = [...scopedTasks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (sort === 'not-ended') {
        const aOpen = hasUnendedSession(a) ? 1 : 0;
        const bOpen = hasUnendedSession(b) ? 1 : 0;
        if (bOpen !== aOpen) return bOpen - aOpen; // Unended sessions come first
        return parseMinutesFromTime(getTaskPrimaryStartTime(a)) - parseMinutesFromTime(getTaskPrimaryStartTime(b));
      }
      if (sort === 'time-spent') {
        const aMins = calculateTotalMinutes(normalizeTaskTimeSlots(a));
        const bMins = calculateTotalMinutes(normalizeTaskTimeSlots(b));
        if (bMins !== aMins) return bMins - aMins; // Longest time spent first
        return parseMinutesFromTime(getTaskPrimaryStartTime(a)) - parseMinutesFromTime(getTaskPrimaryStartTime(b));
      }
      if (sort === 'started-asc') {
        return parseMinutesFromTime(getTaskPrimaryStartTime(a)) - parseMinutesFromTime(getTaskPrimaryStartTime(b));
      }
      if (sort === 'started-desc') {
        return parseMinutesFromTime(getTaskPrimaryStartTime(b)) - parseMinutesFromTime(getTaskPrimaryStartTime(a));
      }
      if (sort === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    const active = result.filter((t) => !t.completed);
    const completed = result.filter((t) => t.completed);

    return {
      activeTasks: active,
      completedTasks: completed,
      hasMatches: result.length > 0,
    };
  }, [scopedTasks, searchQuery, sort]);

  // Task actions
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === existingId ? { ...t, ...taskData } : t))
      );
      addToast('Task Updated', taskData.title, 'success');
    } else {
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      addToast('Task Started', `${newTask.title} (first session at ${formatTimeDisplay(getTaskPrimaryStartTime(newTask))})`, 'success');
    }
    setEditingTask(null);
  };

  const handleAddTimeSlot = (taskId: string, startTime: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentSlots = normalizeTaskTimeSlots(t);
        const newSlot: TimeSlot = {
          id: `slot-${Date.now()}-${currentSlots.length + 1}`,
          startTime,
        };
        return {
          ...t,
          timeSlots: [...currentSlots, newSlot],
        };
      })
    );
    addToast('New Session Added', `Started session at ${formatTimeDisplay(startTime)} for "${task?.title || 'task'}"`, 'info');
  };

  const handleSetSlotStartTime = (taskId: string, slotId: string, startTime: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentSlots = normalizeTaskTimeSlots(t);
        const updatedSlots = currentSlots.map((s) =>
          s.id === slotId ? { ...s, startTime } : s
        );
        return {
          ...t,
          timeSlots: updatedSlots,
          startTime: updatedSlots[0]?.startTime,
        };
      })
    );
    addToast('Start Time Updated', `Session start changed to ${formatTimeDisplay(startTime)}`, 'info');
  };

  const handleSetSlotEndTime = (taskId: string, slotId: string, endTime: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentSlots = normalizeTaskTimeSlots(t);
        const updatedSlots = currentSlots.map((s) =>
          s.id === slotId ? { ...s, endTime } : s
        );
        return {
          ...t,
          timeSlots: updatedSlots,
          endTime: updatedSlots[updatedSlots.length - 1]?.endTime,
        };
      })
    );
    addToast('Session Ended', `End time recorded at ${formatTimeDisplay(endTime)}`, 'success');
  };

  const handleUpdateSlotNote = (taskId: string, slotId: string, note: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentSlots = normalizeTaskTimeSlots(t);
        const updatedSlots = currentSlots.map((s) =>
          s.id === slotId ? { ...s, note } : s
        );
        return {
          ...t,
          timeSlots: updatedSlots,
        };
      })
    );
    addToast('Session Note Saved', note ? `"${note}"` : 'Note cleared', 'info');
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          addToast(nextCompleted ? 'Task Completed' : 'Task Reopened', t.title, nextCompleted ? 'success' : 'info');
          return { ...t, completed: nextCompleted };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Task?',
      message: `Are you sure you want to delete "${task?.title || 'this task'}" and all its recorded work sessions? This action cannot be undone.`,
      confirmLabel: 'Delete Task',
      onConfirm: () => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        addToast('Task Deleted', task?.title, 'info');
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // Quick end running task from quick bar
  const handleQuickEndRunningTask = (taskId: string, endTime: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const currentSlots = normalizeTaskTimeSlots(task);
    const unendedSlot = currentSlots.find((s) => !s.endTime);
    if (unendedSlot) {
      handleSetSlotEndTime(taskId, unendedSlot.id, endTime);
    }
  };

  // Project actions
  const handleSaveProject = (projectData: Omit<Project, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
      setProjects((prev) =>
        prev.map((p) => (p.id === existingId ? { ...p, ...projectData } : p))
      );
      addToast('Project Updated', projectData.name, 'success');
    } else {
      const newId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newProj: Project = {
        ...projectData,
        id: newId,
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => [...prev, newProj]);
      setActiveProjectId(newId);
      addToast('Project Created', newProj.name, 'success');
    }
    setEditingProject(null);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    const relatedTasks = tasks.filter((t) => t.projectId === projectId);
    const msg = relatedTasks.length > 0
      ? `Are you sure you want to delete project "${project?.name}" and all its ${relatedTasks.length} tasks and recorded work sessions? This action cannot be undone.`
      : `Are you sure you want to delete project "${project?.name}"?`;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Project?',
      message: msg,
      confirmLabel: 'Delete Project',
      onConfirm: () => {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
        if (activeProjectId === projectId) {
          setActiveProjectId('all');
        }
        addToast('Project Deleted', project?.name, 'info');
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleOpenNewProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  // Excel Export (plain, clean, normal table)
  const handleExportExcel = () => {
    const listToExport = hideCompleted ? activeTasks : [...activeTasks, ...completedTasks];
    exportTasksToExcel(listToExport, projects, activeProject?.name);
    addToast('Excel Exported', `${listToExport.length} tasks exported successfully`, 'success');
  };

  return (
    <div className="shadcn-app-wrapper">
      <Navbar
        onOpenNewTaskModal={handleOpenNewTask}
        onOpenNewProjectModal={handleOpenNewProject}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExportExcel={handleExportExcel}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="shadcn-body">
        <Sidebar
          projects={projects}
          tasks={tasks}
          activeProjectId={activeProjectId}
          onSelectProject={(id) => setActiveProjectId(id)}
          onOpenNewProjectModal={handleOpenNewProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <main className="shadcn-main">
          {/* Clean, Simple Workspace Header */}
          <DashboardOverview
            activeProject={activeProject}
            isAllProjects={activeProjectId === 'all'}
            tasks={scopedTasks}
            sort={sort}
            onSortChange={setSort}
            onExportExcel={handleExportExcel}
            hideCompleted={hideCompleted}
            onToggleHideCompleted={() => setHideCompleted((prev) => !prev)}
          />

          {/* Quick Task Bar (Title & Start Time with Alt+T shortcut & Searchable Time) */}
          <QuickTaskBar
            activeProjectId={activeProjectId}
            projects={projects}
            tasks={scopedTasks}
            onAddTask={handleSaveTask}
            onEndActiveTask={handleQuickEndRunningTask}
          />

          <div className="tasks-container">
            {hasMatches ? (
              <div className="tasks-flow">
                {/* Active Tasks Section */}
                {activeTasks.length > 0 && (
                  <div className="task-section">
                    <div className="section-label-bar">
                      <span className="section-title">ACTIVE TASKS ({activeTasks.length})</span>
                    </div>
                    <div className="tasks-grid">
                      {activeTasks.map((task) => {
                        const taskProj = projects.find((p) => p.id === task.projectId);
                        return (
                          <TaskCard
                            key={task.id}
                            task={task}
                            project={taskProj}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                            onSetSlotStartTime={handleSetSlotStartTime}
                            onSetSlotEndTime={handleSetSlotEndTime}
                            onAddTimeSlot={handleAddTimeSlot}
                            onUpdateSlotNote={handleUpdateSlotNote}
                            showProjectBadge={activeProjectId === 'all'}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* If all tasks completed and none active */}
                {activeTasks.length === 0 && completedTasks.length > 0 && (
                  <div className="all-done-banner">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <span>All tasks completed! Great work.</span>
                  </div>
                )}

                {/* Completed Tasks Section (Collapsible) */}
                {!hideCompleted && completedTasks.length > 0 && (
                  <div className="task-section completed-group">
                    <button
                      type="button"
                      className="completed-accordion-trigger"
                      onClick={() => setIsCompletedExpanded((prev) => !prev)}
                    >
                      <div className="accordion-title-left">
                        {isCompletedExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>COMPLETED ({completedTasks.length})</span>
                      </div>
                      <span className="accordion-hint">
                        {isCompletedExpanded ? 'Click to collapse' : 'Click to expand'}
                      </span>
                    </button>

                    {isCompletedExpanded && (
                      <div className="tasks-grid completed-grid">
                        {completedTasks.map((task) => {
                          const taskProj = projects.find((p) => p.id === task.projectId);
                          return (
                            <TaskCard
                              key={task.id}
                              task={task}
                              project={taskProj}
                              onToggleComplete={handleToggleComplete}
                              onEdit={handleEditTask}
                              onDelete={handleDeleteTask}
                              onSetSlotStartTime={handleSetSlotStartTime}
                              onSetSlotEndTime={handleSetSlotEndTime}
                              onAddTimeSlot={handleAddTimeSlot}
                              onUpdateSlotNote={handleUpdateSlotNote}
                              showProjectBadge={activeProjectId === 'all'}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : searchQuery.trim() ? (
              <EmptyState
                type="no-results"
                searchQuery={searchQuery}
                onActionClick={handleOpenNewTask}
                onClearSearch={() => setSearchQuery('')}
              />
            ) : (
              <EmptyState
                type="no-tasks"
                onActionClick={handleOpenNewTask}
              />
            )}
          </div>
        </main>
      </div>

      {/* Task Creation & Edit Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        projects={projects}
        tasks={scopedTasks}
        activeProjectId={activeProjectId}
        initialTask={editingTask}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
      />

      {/* Confirmation Modal for Task & Project Deletion */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel || 'Delete'}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
