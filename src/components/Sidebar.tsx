import React from 'react';
import type { Project, Task } from '../types';
import {
  FolderPlus,
  Layers,
  Trash2,
  Edit2,
  Database,
  ChevronRight,
  HardDrive
} from 'lucide-react';

interface SidebarProps {
  projects: Project[];
  tasks: Task[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  tasks,
  activeProjectId,
  onSelectProject,
  onOpenNewProjectModal,
  onEditProject,
  onDeleteProject,
  isOpenMobile,
  onCloseMobile,
}) => {
  const getProjectTaskCounts = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    const pending = projectTasks.filter((t) => !t.completed).length;
    return {
      total: projectTasks.length,
      pending,
    };
  };

  const totalPending = tasks.filter((t) => !t.completed).length;

  return (
    <>
      {isOpenMobile && (
        <div className="sidebar-backdrop-mobile" onClick={onCloseMobile} />
      )}
      <aside className={`app-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-section-title">
            <span>PROJECTS</span>
            <span className="badge-count">{projects.length}</span>
          </div>
          <button
            type="button"
            className="btn-add-project"
            onClick={onOpenNewProjectModal}
            title="Create Project"
            aria-label="Create project"
          >
            <FolderPlus size={16} />
            <span>New</span>
          </button>
        </div>

        <nav className="projects-navigation" aria-label="Projects">
          {/* All Projects button */}
          <button
            type="button"
            className={`project-nav-item ${activeProjectId === 'all' ? 'active' : ''}`}
            onClick={() => {
              onSelectProject('all');
              onCloseMobile();
            }}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon all-icon">
                <Layers size={17} />
              </span>
              <span className="nav-item-name">All Projects</span>
            </div>
            <div className="nav-item-right">
              {totalPending > 0 && (
                <span className="nav-counter-pending" title="Pending tasks">
                  {totalPending}
                </span>
              )}
              <ChevronRight size={15} className="nav-chevron" />
            </div>
          </button>

          <div className="projects-divider" />

          {/* List of custom projects */}
          <div className="projects-scroll-list">
            {projects.length === 0 ? (
              <div className="sidebar-empty-state">
                <p className="sidebar-empty-hint">No projects yet</p>

                <button
                  type="button"
                  className="sidebar-empty-create-btn"
                  onClick={onOpenNewProjectModal}
                >
                  <FolderPlus size={13} />
                  <span>Create Project</span>
                </button>
              </div>
            ) : (
              projects.map((project) => {
                const counts = getProjectTaskCounts(project.id);
                const isActive = activeProjectId === project.id;

                return (
                  <div
                    key={project.id}
                    className={`project-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectProject(project.id);
                      onCloseMobile();
                    }}
                  >
                    <div className="nav-item-left">
                      <span
                        className="nav-item-color-pill"
                        style={{ backgroundColor: project.color }}
                      />

                      <div className="nav-project-text">
                        <span className="nav-item-name">{project.name}</span>

                        {project.description && (
                          <span className="nav-item-desc">
                            {project.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="nav-item-right">
                      {counts.pending > 0 ? (
                        <span className="nav-counter-pending">
                          {counts.pending}
                        </span>
                      ) : (
                        <span className="nav-counter-total">
                          {counts.total}
                        </span>
                      )}

                      <div
                        className="project-item-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="project-menu-btn"
                          onClick={() => onEditProject(project)}
                          title="Edit Project"
                          aria-label={`Edit ${project.name}`}
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          className="project-menu-btn delete-proj"
                          onClick={() => onDeleteProject(project.id)}
                          title="Delete Project"
                          aria-label={`Delete ${project.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </nav>

        <div className="sidebar-footer">
          <div className="storage-status-card">
            <div className="storage-status-header">
              <Database size={15} className="storage-icon" />
              <span>Storage Status</span>
            </div>
            <p className="storage-status-text">
              <HardDrive size={12} className="inline mr-1" />
              Persisted in LocalStorage
            </p>
            <div className="storage-meta">
              <span>{projects.length} Projects</span>
              <span>•</span>
              <span>{tasks.length} Tasks</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
