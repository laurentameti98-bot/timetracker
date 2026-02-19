import { useState, useEffect } from "react";
import { db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";

interface Props {
  id: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditTimelogModal({ id, onClose, onSaved }: Props) {
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  const timelog = useLiveQuery(() => db.timelogs.get(id), [id]);
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const tasks = useLiveQuery(
    () => (projectId ? db.tasks.where("projectId").equals(projectId).toArray() : []),
    [projectId]
  );

  useEffect(() => {
    if (timelog) {
      setProjectId(timelog.projectId);
      setTaskId(timelog.taskId);
      setStartTime(new Date(timelog.startTime).toISOString().slice(0, 16));
      setEndTime(
        timelog.endTime ? new Date(timelog.endTime).toISOString().slice(0, 16) : ""
      );
      setNotes(timelog.notes ?? "");
    }
  }, [timelog]);

  useEffect(() => {
    if (projectId && tasks?.length && !tasks.some((t) => t.id === taskId)) {
      setTaskId(tasks[0].id);
    }
  }, [projectId, tasks, taskId]);

  const handleSave = async () => {
    if (!timelog) return;
    const now = new Date();
    await db.timelogs.update(id, {
      projectId,
      taskId,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      notes: notes || undefined,
      updatedAt: now,
    });
    onSaved();
  };

  if (!timelog) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit timelog</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="form-label">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="select"
            >
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Task</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="select"
            >
              {tasks?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Start</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">End</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="textarea"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
          <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>
            Save
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
