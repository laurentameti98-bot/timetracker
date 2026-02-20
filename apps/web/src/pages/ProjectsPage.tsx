import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2 } from "lucide-react";
import { db } from "../lib/db";
import { randomUUID } from "../lib/utils";

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
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectSubtitle, setNewProjectSubtitle] = useState("");
  const [newProjectColor, setNewProjectColor] = useState(COLORS[0]);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");

  const projects = useLiveQuery(() => db.projects.toArray(), []);

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;
    const id = randomUUID();
    const now = new Date();
    await db.projects.add({
      id,
      name: newProjectName.trim(),
      subtitle: newProjectSubtitle.trim() || undefined,
      color: newProjectColor,
      createdAt: now,
    });
    setNewProjectName("");
    setNewProjectSubtitle("");
    setNewProjectColor(COLORS[0]);
    setShowAddProject(false);
  };

  const handleAddTask = async (projectId: string) => {
    if (!newTaskName.trim()) return;
    const id = randomUUID();
    const now = new Date();
    await db.tasks.add({
      id,
      projectId,
      name: newTaskName.trim(),
      createdAt: now,
    });
    setNewTaskName("");
    setExpandedProject(null);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("Delete this project and all its tasks?")) {
      await db.tasks.where("projectId").equals(id).delete();
      await db.timelogs.where("projectId").equals(id).delete();
      await db.projects.delete(id);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm("Delete this task?")) {
      await db.timelogs.where("taskId").equals(id).delete();
      await db.tasks.delete(id);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Projects & Tasks</h1>

      {(projects ?? []).map((project) => (
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
              onDeleteTask={handleDeleteTask}
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
  onDeleteTask: (id: string) => void;
}) {
  const tasks = useLiveQuery(
    () => db.tasks.where("projectId").equals(projectId).toArray(),
    [projectId]
  );

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
