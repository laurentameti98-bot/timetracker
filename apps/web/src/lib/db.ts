import Dexie, { type EntityTable } from "dexie";

export interface ActiveTimer {
  id: string;
  projectId: string;
  taskId: string;
  startTime: Date;
}

export class TimeTrackerDB extends Dexie {
  activeTimer!: EntityTable<ActiveTimer, "id">;

  constructor() {
    super("TimeTrackerDB");
    this.version(1).stores({
      projects: "id, createdAt",
      tasks: "id, projectId, createdAt",
      timelogs: "id, projectId, taskId, startTime, endTime, createdAt",
      activeTimer: "id",
    });
    this.version(2).stores({
      projects: null,
      tasks: null,
      timelogs: null,
      activeTimer: "id",
    });
  }
}

export const db = new TimeTrackerDB();
