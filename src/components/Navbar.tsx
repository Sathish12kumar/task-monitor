import React, { useState, useEffect } from 'react';
import type { ThemeMode } from '../types';
import { 
  Plus, 
  Menu, 
  Clock, 
  Search, 
  Activity, 
  FolderPlus,
  FileSpreadsheet,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  onOpenNewTaskModal: () => void;
  onOpenNewProjectModal: () => void;
  onToggleMobileSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExportExcel: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTaskModal,
  onOpenNewProjectModal,
  onToggleMobileSidebar,
  searchQuery,
  onSearchChange,
  onExportExcel,
  theme,
  onToggleTheme,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="shadcn-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>

        <div className="brand-badge">
          <div className="brand-icon-box">
            <Activity size={18} />
          </div>
          <div className="brand-meta">
            <div className="brand-title-line">
              <span className="brand-title">TaskMonitor</span>
              <span className="live-dot-chip">
                <span className="pulsing-dot" /> LIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="search"
            className="shadcn-search-input"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search tasks"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Clock */}
        <div className="clock-chip" title="Current Local Time">
          <Clock size={13} className="clock-icon" />
          <span className="clock-text">{currentTime}</span>
        </div>

        {/* Excel Export Button */}
        <button
          type="button"
          className="shadcn-btn shadcn-btn-outline"
          onClick={onExportExcel}
          title="Export current tasks to Microsoft Excel (.xls)"
        >
          <FileSpreadsheet size={15} className="text-emerald" />
          <span className="hide-on-mobile">Export Excel</span>
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          className="shadcn-btn shadcn-btn-icon"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle dark/light mode"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* New Project */}
        <button
          type="button"
          className="shadcn-btn shadcn-btn-outline"
          onClick={onOpenNewProjectModal}
          title="Create New Project"
        >
          <FolderPlus size={15} />
          <span className="hide-on-mobile">Project</span>
        </button>

        {/* New Task */}
        <button
          type="button"
          className="shadcn-btn shadcn-btn-primary"
          onClick={onOpenNewTaskModal}
          title="Create Task"
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
