import Dexie, { type EntityTable } from "dexie";

export interface Project {
  id: string;
  name: string;
  subtitle?: string;
  color: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  createdAt: Date;
}

export interface Timelog {
  id: string;
  projectId: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveTimer {
  id: string;
  projectId: string;
  taskId: string;
  startTime: Date;
}

export class TimeTrackerDB extends Dexie {
  projects!: EntityTable<Project, "id">;
  tasks!: EntityTable<Task, "id">;
  timelogs!: EntityTable<Timelog, "id">;
  activeTimer!: EntityTable<ActiveTimer, "id">;

  constructor() {
    super("TimeTrackerDB");
    this.version(1).stores({
      projects: "id, createdAt",
      tasks: "id, projectId, createdAt",
      timelogs: "id, projectId, taskId, startTime, endTime, createdAt",
      activeTimer: "id",
    });
  }
}

export const db = new TimeTrackerDB();
