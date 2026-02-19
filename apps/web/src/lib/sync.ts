import { db } from "./db";
import { api } from "./api";

export async function syncFromServer() {
  if (!navigator.onLine) return;

  try {
    const remoteProjects = await api.projects.list().catch(() => []);
    for (const p of remoteProjects) {
      await db.projects.put({
        id: p.id,
        name: p.name,
        color: p.color,
        createdAt: new Date(p.createdAt),
      });
    }

    for (const p of remoteProjects) {
      const remoteTasks = await api.projects.tasks(p.id).catch(() => []);
      for (const t of remoteTasks) {
        await db.tasks.put({
          id: t.id,
          projectId: t.projectId,
          name: t.name,
          createdAt: new Date(t.createdAt),
        });
      }
    }

    const remoteLogs = await api.timelogs.list().catch(() => []);
    for (const l of remoteLogs) {
      if (!l.endTime) continue;
      await db.timelogs.put({
        id: l.id,
        projectId: l.projectId,
        taskId: l.taskId,
        startTime: new Date(l.startTime),
        endTime: new Date(l.endTime),
        notes: l.notes ?? "",
        createdAt: new Date(l.createdAt),
        updatedAt: new Date(l.updatedAt),
      });
    }
  } catch (e) {
    console.warn("Sync from server failed:", e);
  }
}

export async function syncToServer() {
  if (!navigator.onLine) return;

  const projects = await db.projects.toArray();
  const remoteProjects = await api.projects.list().catch(() => []);
  const remoteIds = new Set(remoteProjects.map((p) => p.id));

  for (const p of projects) {
    if (!remoteIds.has(p.id)) {
      try {
        await api.projects.create({
          name: p.name,
          color: p.color,
          id: p.id,
        });
        remoteIds.add(p.id);
      } catch (e) {
        console.warn("Sync project failed:", e);
      }
    }
  }

  const tasks = await db.tasks.toArray();
  const remoteTasksByProject = new Map<string, Set<string>>();
  for (const t of tasks) {
    try {
      let ids = remoteTasksByProject.get(t.projectId);
      if (!ids) {
        const remoteTasks = await api.projects.tasks(t.projectId);
        ids = new Set(remoteTasks.map((rt) => rt.id));
        remoteTasksByProject.set(t.projectId, ids);
      }
      if (!ids.has(t.id)) {
        await api.projects.createTask(t.projectId, { name: t.name, id: t.id });
        ids.add(t.id);
      }
    } catch (e) {
      console.warn("Sync task failed:", e);
    }
  }

  const timelogs = (await db.timelogs.toArray()).filter((l) => l.endTime != null);
  const remoteLogs = await api.timelogs.list().catch(() => []);
  const remoteLogIds = new Set(remoteLogs.map((l) => l.id));

  for (const log of timelogs) {
    if (!remoteLogIds.has(log.id) && log.endTime) {
      try {
        await api.timelogs.create({
          id: log.id,
          projectId: log.projectId,
          taskId: log.taskId,
          startTime: new Date(log.startTime).toISOString(),
          endTime: new Date(log.endTime!).toISOString(),
          notes: log.notes,
        });
      } catch (e) {
        console.warn("Sync timelog failed:", e);
      }
    }
  }

  const now = Date.now();
  localStorage.setItem("lastSync", String(now));
  return now;
}
