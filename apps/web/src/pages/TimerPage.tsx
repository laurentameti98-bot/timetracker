import { useState, useEffect, useCallback, useMemo } from "react";
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

const RING_RADIUS = 90;
const RING_STROKE = 10;
const SEGMENT_COUNT = 60;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SEGMENT_LENGTH = CIRCUMFERENCE / SEGMENT_COUNT - 2;
const SEGMENT_GAP = 2;

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

  const fillCount = useMemo(() => {
    if (!isRunning) return 0;
    const totalSeconds = Math.floor(elapsed / 1000);
    const rem = totalSeconds % 120;
    return rem <= 60 ? rem : 120 - rem;
  }, [isRunning, elapsed]);

  const trackDashArray = useMemo(
    () => Array(SEGMENT_COUNT).fill(`${SEGMENT_LENGTH} ${SEGMENT_GAP}`).join(" "),
    []
  );

  const progressDashArray = useMemo(() => {
    if (fillCount === 0) return "0 9999";
    return (
      Array(fillCount)
        .fill(`${SEGMENT_LENGTH} ${SEGMENT_GAP}`)
        .join(" ") + " 0 9999"
    );
  }, [fillCount]);

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
    <div className="page-container">
      <h1 className="page-title">Timer</h1>

      <div className="timer-card">
        <div className="timer-display">{formatDuration(elapsed)}</div>

        <div className="timer-circle-wrapper">
          <svg
            className="timer-ring"
            viewBox={`0 0 ${(RING_RADIUS + RING_STROKE) * 2} ${(RING_RADIUS + RING_STROKE) * 2}`}
            aria-hidden
          >
            <circle
              className="timer-ring-track"
              cx={RING_RADIUS + RING_STROKE}
              cy={RING_RADIUS + RING_STROKE}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              strokeDasharray={trackDashArray}
              transform={`rotate(-90 ${RING_RADIUS + RING_STROKE} ${RING_RADIUS + RING_STROKE})`}
            />
            <circle
              className="timer-ring-progress"
              cx={RING_RADIUS + RING_STROKE}
              cy={RING_RADIUS + RING_STROKE}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              strokeDasharray={progressDashArray}
              transform={`rotate(-90 ${RING_RADIUS + RING_STROKE} ${RING_RADIUS + RING_STROKE})`}
            />
          </svg>
          <button
            onClick={isRunning ? handleStop : handleStart}
            className={`btn-timer-round ${isRunning ? "btn-timer-stop" : "btn-timer-start"}`}
            aria-label={isRunning ? "Stop timer" : "Start timer"}
          >
            {isRunning ? "Stop" : "Start"}
          </button>
        </div>

        {isRunning && (
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
        )}
      </div>
    </div>
  );
}
