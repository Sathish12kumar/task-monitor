import React from 'react';
import { ClipboardList, Plus, SearchX, Sparkles, FolderPlus } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-tasks' | 'no-results' | 'no-filter-match' | 'no-projects';
  filterName?: string;
  searchQuery?: string;
  onActionClick: () => void;
  onClearSearch?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  filterName,
  searchQuery,
  onActionClick,
  onClearSearch,
}) => {
  if (type === 'no-projects') {
    return (
      <div className="empty-state-card">
        <div className="empty-icon-bubble">
          <FolderPlus size={26} />
        </div>
        <h3 className="empty-title">No projects yet</h3>
        <p className="empty-subtitle">
          Create your first project to start organizing tasks, shifts, and daily work sessions.
        </p>
        <button type="button" className="shadcn-btn shadcn-btn-primary" onClick={onActionClick}>
          <Plus size={15} />
          <span>Create First Project</span>
        </button>
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="empty-state-card">
        <div className="empty-icon-bubble">
          <SearchX size={24} />
        </div>
        <h3 className="empty-title">No matching tasks found</h3>
        <p className="empty-subtitle">
          No tasks matched your query &ldquo;<strong>{searchQuery}</strong>&rdquo;. Try another search term.
        </p>
        {onClearSearch && (
          <button type="button" className="shadcn-btn shadcn-btn-outline" onClick={onClearSearch}>
            Clear Search
          </button>
        )}
      </div>
    );
  }

  if (type === 'no-filter-match') {
    return (
      <div className="empty-state-card">
        <div className="empty-icon-bubble">
          <Sparkles size={24} />
        </div>
        <h3 className="empty-title">No {filterName} tasks</h3>
        <p className="empty-subtitle">
          There are no tasks marked as {filterName?.toLowerCase()} in this project.
        </p>
        <button type="button" className="shadcn-btn shadcn-btn-primary" onClick={onActionClick}>
          <Plus size={15} />
          <span>Add Task</span>
        </button>
      </div>
    );
  }

  return (
    <div className="empty-state-card">
      <div className="empty-icon-bubble">
        <ClipboardList size={26} />
      </div>
      <h3 className="empty-title">No tasks in this project</h3>
      <p className="empty-subtitle">
        Enter a title, start time and end time in the quick bar above to log your first task.
      </p>
      <button type="button" className="shadcn-btn shadcn-btn-primary" onClick={onActionClick}>
        <Plus size={15} />
        <span>Create First Task</span>
      </button>
    </div>
  );
};
