import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download } from "lucide-react";
import { db } from "../lib/db";
import { formatDuration } from "../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState<"project" | "task">("project");

  const start = new Date(from + "T00:00:00");
  const end = new Date(to + "T23:59:59.999");

  const timelogs = useLiveQuery(
    () =>
      db.timelogs
        .where("startTime")
        .between(start, end, true, true)
        .filter((l) => l.endTime != null)
        .toArray(),
    [from, to]
  );

  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const projectMap = new Map(projects?.map((p) => [p.id, p]) ?? []);
  const taskMap = new Map(tasks?.map((t) => [t.id, t]) ?? []);

  const aggregated =
    timelogs?.reduce(
      (acc, log) => {
        const mins =
          (new Date(log.endTime!).getTime() - new Date(log.startTime).getTime()) / 60000;
        const key = groupBy === "project" ? log.projectId : log.taskId;
        acc[key] = (acc[key] ?? 0) + mins;
        return acc;
      },
      {} as Record<string, number>
    ) ?? {};

  const chartData = Object.entries(aggregated).map(([id, mins]) => {
    const name =
      groupBy === "project"
        ? projectMap.get(id)?.name ?? id
        : taskMap.get(id)?.name ?? id;
    return { name, minutes: Math.round(mins), id };
  });

  const totalMinutes = Object.values(aggregated).reduce((a, b) => a + b, 0);
  const colors = [
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

  const handleExportCsv = () => {
    const rows = (timelogs ?? []).map((log) => {
      const proj = projectMap.get(log.projectId)?.name ?? "";
      const task = taskMap.get(log.taskId)?.name ?? "";
      const startStr = new Date(log.startTime).toISOString();
      const endStr = log.endTime ? new Date(log.endTime).toISOString() : "";
      const mins = log.endTime
        ? Math.round(
            (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 60000
          )
        : 0;
      return [proj, task, startStr, endStr, mins, log.notes ?? ""].join(",");
    });
    const header = "Project,Task,Start,End,Minutes,Notes";
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timelogs-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Reports</h1>

      <div className="reports-filters">
        <div className="reports-dates">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
            style={{ width: "auto", minWidth: 140 }}
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
            style={{ width: "auto", minWidth: 140 }}
          />
        </div>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as "project" | "task")}
          className="select"
          style={{ width: "auto", minWidth: 140 }}
        >
          <option value="project">By project</option>
          <option value="task">By task</option>
        </select>
        <button onClick={handleExportCsv} className="btn btn-primary">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="reports-total">
        <div className="reports-total-label">Total time</div>
        <div className="reports-total-value">
          {formatDuration(Math.round(totalMinutes))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <>
          <div className="reports-chart-bar">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: "var(--text)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--bg-card)",
                    borderRadius: "var(--radius-md)",
                  }}
                  formatter={(value: number) => [formatDuration(value), "Minutes"]}
                />
                <Bar dataKey="minutes" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="reports-chart-pie">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="minutes"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatDuration(value)}
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--bg-card)",
                    borderRadius: "var(--radius-md)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="reports-empty">No data for this period</div>
      )}
    </div>
  );
}
