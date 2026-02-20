import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { randomUUID } from "../lib/utils";
import { useProjects, useTasks, queryKeys } from "../hooks/useApiData";
import { api } from "../lib/api";

const COLORS = [
  "#0d9488",
  "#14b8a6",
  "#0891b2",
  "#0284c7",
  "#2563eb",
  "#7c3aed",
  "#a855f7",
  "#db2777",
  "#e11d48",
  "#ea580c",
];

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectSubtitle, setNewProjectSubtitle] = useState("");
  const [newProjectColor, setNewProjectColor] = useState(COLORS[0]);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");

  const { data: projects } = useProjects();

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;
    const id = randomUUID();
    try {
      await api.projects.create({
        id,
        name: newProjectName.trim(),
        subtitle: newProjectSubtitle.trim() || undefined,
        color: newProjectColor,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      setNewProjectName("");
      setNewProjectSubtitle("");
      setNewProjectColor(COLORS[0]);
      setShowAddProject(false);
    } catch (e) {
      console.warn("Failed to create project:", e);
      alert("Failed to create project. Please try again.");
    }
  };

  const handleAddTask = async (projectId: string) => {
    if (!newTaskName.trim()) return;
    const id = randomUUID();
    try {
      await api.projects.createTask(projectId, { id, name: newTaskName.trim() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allTasks });
      setNewTaskName("");
      setExpandedProject(null);
    } catch (e) {
      console.warn("Failed to create task:", e);
      alert("Failed to create task. Please try again.");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    try {
      await api.projects.delete(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.allTasks });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "tasks" });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "timelogs" });
    } catch (e) {
      console.warn("Failed to delete project:", e);
      alert("Failed to delete project. Please try again.");
    }
  };

  const handleDeleteTask = async (projectId: string, taskId: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.tasks.delete(taskId);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allTasks });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "timelogs" });
    } catch (e) {
      console.warn("Failed to delete task:", e);
      alert("Failed to delete task. Please try again.");
    }
  };

  const projectList = projects ?? [];

  return (
    <div className="page-container">
      <h1 className="page-title">Projects & Tasks</h1>

      {projectList.map((project) => (
        <div key={project.id} className="project-card">
          <div className="project-card-header">
            <div className="project-card-title">
              <div
                className="project-color-dot"
                style={{ background: project.color }}
              />
              <div>
                <span style={{ fontWeight: 500 }}>{project.name}</span>
                {project.subtitle && (
                  <div className="project-subtitle">{project.subtitle}</div>
                )}
              </div>
            </div>
            <div className="project-card-actions">
              <button
                onClick={() =>
                  setExpandedProject(expandedProject === project.id ? null : project.id)
                }
                className="btn btn-secondary"
              >
                {expandedProject === project.id ? "Hide" : "Tasks"}
              </button>
              <button
                onClick={() => handleDeleteProject(project.id)}
                className="btn btn-danger"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
          {expandedProject === project.id && (
            <ProjectTasks
              projectId={project.id}
              newTaskName={newTaskName}
              setNewTaskName={setNewTaskName}
              onAddTask={() => handleAddTask(project.id)}
              onDeleteTask={(taskId) => handleDeleteTask(project.id, taskId)}
            />
          )}
        </div>
      ))}

      {showAddProject ? (
        <div className="add-project-form">
          <input
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="input"
            autoFocus
            style={{ marginBottom: "var(--space-2)" }}
          />
          <input
            placeholder="Subtitle (optional)"
            value={newProjectSubtitle}
            onChange={(e) => setNewProjectSubtitle(e.target.value)}
            className="input"
            style={{ marginBottom: "var(--space-3)" }}
          />
          <div className="color-picker" style={{ marginBottom: "var(--space-4)" }}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewProjectColor(c)}
                className={`color-swatch ${newProjectColor === c ? "selected" : ""}`}
                style={{ background: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button onClick={handleAddProject} className="btn btn-primary">
              <Plus size={16} />
              Add project
            </button>
            <button
              onClick={() => setShowAddProject(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddProject(true)}
          className="btn-add-project"
        >
          <Plus size={18} style={{ verticalAlign: "middle", marginRight: "var(--space-2)" }} />
          Add project
        </button>
      )}
    </div>
  );
}

function ProjectTasks({
  projectId,
  newTaskName,
  setNewTaskName,
  onAddTask,
  onDeleteTask,
}: {
  projectId: string;
  newTaskName: string;
  setNewTaskName: (v: string) => void;
  onAddTask: () => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const { data: tasks } = useTasks(projectId);

  return (
    <div className="project-tasks-panel">
      <div className="project-tasks-form">
        <input
          placeholder="New task name"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAddTask()}
          className="input"
          style={{ flex: 1 }}
        />
        <button onClick={onAddTask} className="btn btn-primary">
          <Plus size={14} />
          Add
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {(tasks ?? []).map((task) => (
          <div key={task.id} className="task-item">
            <span style={{ fontSize: "0.875rem" }}>{task.name}</span>
            <button
              onClick={() => onDeleteTask(task.id)}
              className="btn btn-ghost"
              style={{ padding: "var(--space-2) var(--space-3)", color: "var(--danger)" }}
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
