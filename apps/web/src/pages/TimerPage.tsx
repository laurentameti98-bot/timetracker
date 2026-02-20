import { useState, useEffect, useCallback } from "react";
import { db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { randomUUID } from "../lib/utils";
import { useProjects, useTasks } from "../hooks/useApiData";
import { api } from "../lib/api";

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
  const { data: projects } = useProjects();
  const currentProjectId = activeTimer?.[0]?.projectId;
  const { data: tasks } = useTasks(currentProjectId ?? null);

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
    if (!proj) {
      alert("Create a project and task first in the Projects tab.");
      return;
    }
    const projectTasks = await api.projects.tasks(proj.id);
    const task = projectTasks[0];
    if (!task) {
      alert("Create a task first in the Projects tab.");
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
    if (!navigator.onLine) {
      alert("Connect to the internet to save this timelog.");
      return;
    }
    const now = new Date();
    const id = randomUUID();
    try {
      await api.timelogs.create({
        id,
        projectId: t.projectId,
        taskId: t.taskId,
        startTime: new Date(t.startTime).toISOString(),
        endTime: now.toISOString(),
        notes: "",
      });
    } catch (e) {
      console.warn("Failed to save timelog:", e);
      alert("Failed to save timelog. Please try again.");
      return;
    }
    await db.activeTimer.clear();
  };

  const handleChangeProject = async (projectId: string) => {
    if (!current) return;
    const projectTasks = await api.projects.tasks(projectId);
    const task = projectTasks[0];
    if (!task) return;
    await db.activeTimer.update(current.id, { projectId, taskId: task.id });
  };

  const handleChangeTask = async (taskId: string) => {
    if (!current) return;
    const task = tasks?.find((t) => t.id === taskId);
    if (!task) return;
    await db.activeTimer.update(current.id, { projectId: task.projectId, taskId });
  };

  const projectList = projects ?? [];
  const taskList = tasks ?? [];

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
              {projectList.map((p) => (
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
              {taskList.map((t) => (
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
