import { db } from "./db";
import { api } from "./api";

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
