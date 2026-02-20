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
        subtitle: (p as { subtitle?: string }).subtitle ?? "",
        color: p.color,
        createdAt: new Date(p.createdAt),
      });
    }

    const remoteProjectIds = new Set(remoteProjects.map((p) => p.id));
    const localProjects = await db.projects.toArray();
    for (const p of localProjects) {
      if (!remoteProjectIds.has(p.id)) {
        await db.projects.delete(p.id);
      }
    }

    const remoteTaskIds: string[] = [];
    for (const p of remoteProjects) {
      const remoteTasks = await api.projects.tasks(p.id).catch(() => []);
      for (const t of remoteTasks) {
        remoteTaskIds.push(t.id);
        await db.tasks.put({
          id: t.id,
          projectId: t.projectId,
          name: t.name,
          createdAt: new Date(t.createdAt),
        });
      }
    }
    const remoteTaskIdSet = new Set(remoteTaskIds);
    const localTasks = await db.tasks.toArray();
    for (const t of localTasks) {
      if (!remoteTaskIdSet.has(t.id)) {
        await db.tasks.delete(t.id);
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
    const remoteLogIds = new Set(remoteLogs.map((l) => l.id));
    const localLogs = await db.timelogs.toArray();
    for (const l of localLogs) {
      if (l.endTime && !remoteLogIds.has(l.id)) {
        await db.timelogs.delete(l.id);
      }
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
          subtitle: p.subtitle ?? "",
          color: p.color,
          id: p.id,
        });
        remoteIds.add(p.id);
      } catch (e) {
        console.warn("Sync project failed:", e);
      }
    }
  }

  const localProjectIds = new Set(projects.map((p) => p.id));
  for (const p of remoteProjects) {
    if (!localProjectIds.has(p.id)) {
      try {
        await api.projects.delete(p.id);
      } catch (e) {
        console.warn("Sync project delete failed:", e);
      }
    }
  }

  const tasks = await db.tasks.toArray();
  const localTaskIds = new Set(tasks.map((t) => t.id));
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

  for (const p of remoteProjects) {
    const remoteTasks = await api.projects.tasks(p.id).catch(() => []);
    for (const t of remoteTasks) {
      if (!localTaskIds.has(t.id)) {
        try {
          await api.tasks.delete(t.id);
        } catch (e) {
          console.warn("Sync task delete failed:", e);
        }
      }
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

  const localLogIds = new Set(timelogs.map((l) => l.id));
  for (const l of remoteLogs) {
    if (!localLogIds.has(l.id)) {
      try {
        await api.timelogs.delete(l.id);
      } catch (e) {
        console.warn("Sync timelog delete failed:", e);
      }
    }
  }

  const now = Date.now();
  localStorage.setItem("lastSync", String(now));
  return now;
}

/** Full sync: push local changes first, then pull server state. Call after mutations when online. */
export async function sync() {
  await syncToServer();
  await syncFromServer();
}
