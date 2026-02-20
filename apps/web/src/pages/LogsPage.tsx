import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { db } from "../lib/db";
import { formatTime, formatDuration, formatDate } from "../lib/utils";
import EditTimelogModal from "../components/EditTimelogModal";
import { sync } from "../lib/sync";

export default function LogsPage() {
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [editingId, setEditingId] = useState<string | null>(null);

  const startOfDay = new Date(selectedDate + "T00:00:00");
  const endOfDay = new Date(selectedDate + "T23:59:59.999");

  const timelogs = useLiveQuery(
    () =>
      db.timelogs
        .where("startTime")
        .between(startOfDay, endOfDay, true, true)
        .sortBy("startTime"),
    [selectedDate]
  );

  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const projectMap = new Map(projects?.map((p) => [p.id, p]) ?? []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const taskMap = new Map(tasks?.map((t) => [t.id, t]) ?? []);

  const handleCopy = async () => {
    const logs = timelogs ?? [];
    const lines = logs.map((log) => {
      const proj = projectMap.get(log.projectId)?.name ?? "?";
      const task = taskMap.get(log.taskId)?.name ?? "?";
      const start = formatTime(new Date(log.startTime));
      const end = log.endTime ? formatTime(new Date(log.endTime)) : "-";
      const mins = log.endTime
        ? Math.round((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 60000)
        : 0;
      return `${proj}\t${task}\t${start}\t${end}\t${mins}\t${log.notes ?? ""}`;
    });
    const header = "Project\tTask\tStart\tEnd\tMinutes\tNotes";
    await navigator.clipboard.writeText([header, ...lines].join("\n"));
    alert("Copied to clipboard!");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this timelog?")) {
      await db.timelogs.delete(id);
      if (navigator.onLine) sync().catch(() => {});
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Daily Logs</h1>

      <div className="logs-toolbar">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input"
          style={{ width: "auto", minWidth: 140 }}
        />
        <button onClick={handleCopy} className="btn btn-primary">
          <Copy size={16} />
          Copy to clipboard
        </button>
      </div>

      <div className="logs-list">
        {(timelogs ?? []).map((log) => {
          const proj = projectMap.get(log.projectId);
          const task = taskMap.get(log.taskId);
          const mins = log.endTime
            ? Math.round(
                (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 60000
              )
            : 0;
          return (
            <div key={log.id} className="log-card">
              <div className="log-card-body">
                <div className="log-card-header">
                  <span
                    className="log-card-badge"
                    style={{ background: proj?.color ?? "#0d9488" }}
                  >
                    {proj?.name ?? "?"}
                  </span>
                  <span className="text-muted">{task?.name ?? "?"}</span>
                </div>
                <div className="log-meta">
                  {formatTime(new Date(log.startTime))} –
                  {log.endTime ? formatTime(new Date(log.endTime)) : "running"}
                  {" · "}
                  {formatDuration(mins)}
                </div>
                {log.notes && (
                  <div className="text-muted" style={{ marginTop: "var(--space-1)", fontSize: "0.75rem" }}>
                    {log.notes}
                  </div>
                )}
              </div>
              <div className="log-card-actions">
                <button
                  onClick={() => setEditingId(log.id)}
                  className="btn btn-secondary"
                  aria-label="Edit"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="btn btn-danger"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editingId && (
        <EditTimelogModal
          id={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
