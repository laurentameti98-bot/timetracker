import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { formatTime, formatDuration, formatDate } from "../lib/utils";
import EditTimelogModal from "../components/EditTimelogModal";
import { useTimelogs, useProjects, useAllTasks } from "../hooks/useApiData";
import { api } from "../lib/api";

export default function LogsPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [editingId, setEditingId] = useState<string | null>(null);

  const from = selectedDate + "T00:00:00";
  const to = selectedDate + "T23:59:59.999";

  const { data: timelogs } = useTimelogs(from, to);
  const { data: projects } = useProjects();
  const { data: tasks } = useAllTasks();

  const projectMap = new Map(projects?.map((p) => [p.id, p]) ?? []);
  const taskMap = new Map(tasks?.map((t) => [t.id, t]) ?? []);

  const logs = (timelogs ?? []).filter((l) => l.endTime != null);

  const handleCopy = async () => {
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
    if (!confirm("Delete this timelog?")) return;
    try {
      await api.timelogs.delete(id);
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "timelogs" });
    } catch (e) {
      console.warn("Failed to delete timelog:", e);
      alert("Failed to delete timelog. Please try again.");
    }
  };

  const handleSaved = () => {
    setEditingId(null);
    queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "timelogs" });
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
        {logs.map((log) => {
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
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
