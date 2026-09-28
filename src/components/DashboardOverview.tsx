import React, { useState, useRef, useEffect } from 'react';
import type { Project, Task, TaskSort } from '../types';
import { 
  Layers, 
  Folder, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  ArrowUpDown,
  ChevronDown,
  Check
} from 'lucide-react';

interface DashboardOverviewProps {
  activeProject?: Project;
  isAllProjects: boolean;
  tasks: Task[];
  sort: TaskSort;
  onSortChange: (s: TaskSort) => void;
  onExportExcel: () => void;
  hideCompleted: boolean;
  onToggleHideCompleted: () => void;
}

const SORT_OPTIONS: { id: TaskSort; label: string; desc: string }[] = [
  { id: 'not-ended', label: 'Not Ended First', desc: 'Tasks with active open sessions' },
  { id: 'time-spent', label: 'Time Spent (Most)', desc: 'Highest logged work hours first' },
  { id: 'started-asc', label: 'Started (Earliest)', desc: 'Morning / earliest session first' },
  { id: 'started-desc', label: 'Started (Latest)', desc: 'Afternoon / latest session first' },
  { id: 'title', label: 'Title (A-Z)', desc: 'Alphabetical task order' },
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  activeProject,
  isAllProjects,
  tasks,
  sort,
  onSortChange,
  onExportExcel,
  hideCompleted,
  onToggleHideCompleted,
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const currentSortObj = SORT_OPTIONS.find((s) => s.id === sort) || SORT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="simple-workspace-header">
      {/* Left: Project Branding & Compact Status */}
      <div className="workspace-info-col">
        <div 
          className="workspace-icon-box"
          style={{
            backgroundColor: isAllProjects ? 'rgba(99, 102, 241, 0.12)' : `${activeProject?.color}18`,
            color: isAllProjects ? '#6366f1' : (activeProject?.color || '#6366f1'),
          }}
        >
          {isAllProjects ? <Layers size={18} /> : <Folder size={18} />}
        </div>
        <div className="workspace-titles">
          <div className="workspace-title-row">
            <h1 className="workspace-name">
              {isAllProjects ? 'All Projects' : (activeProject?.name || 'Project')}
            </h1>
            {!isAllProjects && activeProject && (
              <span 
                className="workspace-color-dot"
                style={{ backgroundColor: activeProject.color }}
                title={`Accent: ${activeProject.color}`}
              />
            )}
          </div>

          <div className="workspace-summary-line">
            <span className="summary-status-item">
              <Clock size={12} className="text-muted-foreground" />
              <span><strong>{active}</strong> active</span>
            </span>
            <span className="summary-divider">•</span>
            <span className="summary-status-item">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span><strong>{completed}</strong> done</span>
            </span>
            {total > 0 && (
              <>
                <span className="summary-divider">•</span>
                <span className="summary-percent-pill">{percent}% complete</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Clean Actions (Filter, Custom Dark/Light Sort Dropdown, Excel Export) */}
      <div className="workspace-actions-col">
        {/* Toggle Active / All */}
        <button
          type="button"
          className={`shadcn-btn ${hideCompleted ? 'shadcn-btn-primary' : 'shadcn-btn-outline'} toggle-done-btn`}
          onClick={onToggleHideCompleted}
          title={hideCompleted ? 'Show completed tasks' : 'Hide completed tasks'}
        >
          <CheckCircle2 size={14} />
          <span>{hideCompleted ? 'Active Only' : 'Show All'}</span>
        </button>

        {/* Custom Sleek Dark/Light Sort Dropdown */}
        <div ref={sortRef} className="custom-sort-dropdown-wrap">
          <button
            type="button"
            className="custom-sort-trigger-btn"
            onClick={() => setIsSortOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isSortOpen}
          >
            <ArrowUpDown size={13} className="text-muted-foreground" />
            <span className="sort-current-label">{currentSortObj.label}</span>
            <ChevronDown size={13} className="text-muted-foreground sort-chevron" />
          </button>

          {isSortOpen && (
            <div className="custom-sort-menu" role="listbox">
              <div className="sort-menu-header">Order Tasks By</div>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = opt.id === sort;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`sort-menu-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      onSortChange(opt.id);
                      setIsSortOpen(false);
                    }}
                  >
                    <div className="sort-item-text">
                      <span className="sort-item-title">{opt.label}</span>
                      <span className="sort-item-desc">{opt.desc}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Export Excel */}
        <button
          type="button"
          className="shadcn-btn shadcn-btn-outline"
          onClick={onExportExcel}
          title="Export schedule to Excel"
        >
          <FileSpreadsheet size={14} className="text-emerald" />
          <span className="hide-on-mobile">Export Excel</span>
        </button>
      </div>
    </div>
  );
};
