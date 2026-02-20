import { useState, useEffect, useCallback } from "react";
import { db, type Task } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { randomUUID } from "../lib/utils";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function TimerPage() {
  const [elapsed, setElapsed] = useState(0);

  const activeTimer = useLiveQuery(() => db.activeTimer.toArray(), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const currentProjectId = activeTimer?.[0]?.projectId;
  const tasks = useLiveQuery(
    async (): Promise<Task[]> => {
      if (!currentProjectId) return [];
      return db.tasks.where("projectId").equals(currentProjectId).toArray();
    },
    [currentProjectId]
  );

  const current = activeTimer?.[0] ?? null;

  const tick = useCallback(() => {
    if (!current) return;
    const start = new Date(current.startTime).getTime();
    setElapsed(Date.now() - start);
  }, [current]);

  useEffect(() => {
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const isRunning = !!current;

  const handleStart = async () => {
    const proj = projects?.[0];
    const task = proj ? (await db.tasks.where("projectId").equals(proj.id).first()) : null;
    if (!proj || !task) {
      alert("Create a project and task first in the Projects tab.");
      return;
    }
    const id = randomUUID();
    const now = new Date();
    await db.activeTimer.clear();
    await db.activeTimer.add({
      id,
      projectId: proj.id,
      taskId: task.id,
      startTime: now,
    });
  };

  const handleStop = async () => {
    const t = current;
    if (!t) return;
    const now = new Date();
    const id = randomUUID();
    await db.timelogs.add({
      id,
      projectId: t.projectId,
      taskId: t.taskId,
      startTime: new Date(t.startTime),
      endTime: now,
      notes: "",
      createdAt: now,
      updatedAt: now,
    });
    await db.activeTimer.clear();
  };

  const handleChangeProject = async (projectId: string) => {
    if (!current) return;
    const task = await db.tasks.where("projectId").equals(projectId).first();
    if (!task) return;
    await db.activeTimer.update(current.id, { projectId, taskId: task.id });
  };

  const handleChangeTask = async (taskId: string) => {
    if (!current) return;
    const task = await db.tasks.get(taskId);
    if (!task) return;
    await db.activeTimer.update(current.id, { projectId: task.projectId, taskId });
  };

  return (
    <div className="page-container timer-page">
      <h1 className="page-title">Timer</h1>

      <div className="timer-hero hero-card">
        <div className="hero-label">{isRunning ? "Elapsed" : "Ready"}</div>
        <div className="timer-display">{formatDuration(elapsed)}</div>
        <button
          onClick={isRunning ? handleStop : handleStart}
          className={`btn btn-timer-main ${isRunning ? "btn-timer-stop" : "btn-timer-start"}`}
          aria-label={isRunning ? "Stop timer" : "Start timer"}
        >
          {isRunning ? "Stop" : "Start"}
        </button>
      </div>

      {isRunning && (
        <div className="card timer-selects-card">
          <div className="timer-selects">
            <select
              value={current?.projectId ?? ""}
              onChange={(e) => handleChangeProject(e.target.value)}
              className="select"
            >
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={current?.taskId ?? ""}
              onChange={(e) => handleChangeTask(e.target.value)}
              className="select"
            >
              {tasks?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
