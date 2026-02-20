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
    "#a855f7",
    "#e100ff",
    "#7f00ff",
    "#ff416c",
    "#ff4b2b",
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#ec4899",
    "#06b6d4",
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
        <div className="segmented" role="tablist" aria-label="Group by">
          <button
            type="button"
            role="tab"
            className={`segmented__item ${groupBy === "project" ? "is-active" : ""}`}
            onClick={() => setGroupBy("project")}
          >
            By project
          </button>
          <button
            type="button"
            role="tab"
            className={`segmented__item ${groupBy === "task" ? "is-active" : ""}`}
            onClick={() => setGroupBy("task")}
          >
            By task
          </button>
        </div>
        <button onClick={handleExportCsv} className="btn btn-primary">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="reports-total hero-card">
        <div className="reports-total-label">Total time</div>
        <div className="reports-total-value">
          {formatDuration(Math.round(totalMinutes))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <>
          <div className="reports-chart-card card">
            <div className="reports-chart-bar">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} axisLine={{ stroke: "transparent" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: "#fff", fontSize: 12 }}
                  axisLine={{ stroke: "transparent" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(18,21,34,0.95)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 16px 50px rgba(0,0,0,0.4)",
                    padding: "12px 16px",
                  }}
                  formatter={(value: number) => [formatDuration(value), "Minutes"]}
                />
                <Bar dataKey="minutes" fill="rgba(255,255,255,0.9)" radius={[0, 8, 8, 0]} />
              </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="reports-chart-card card">
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
                  labelLine={{ stroke: "rgba(255,255,255,0.6)" }}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatDuration(value)}
                  contentStyle={{
                    background: "rgba(18,21,34,0.95)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 16px 50px rgba(0,0,0,0.4)",
                    padding: "12px 16px",
                  }}
                />
              </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="reports-empty">No data for this period</div>
      )}
    </div>
  );
}
