import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export type Project = {
  id: string;
  name: string;
  subtitle?: string;
  color: string;
  createdAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
};

export type Timelog = {
  id: string;
  projectId: string;
  taskId: string;
  startTime: string;
  endTime: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export const queryKeys = {
  projects: ["projects"] as const,
  tasks: (projectId: string) => ["tasks", projectId] as const,
  allTasks: ["allTasks"] as const,
  timelogs: (from?: string, to?: string) => ["timelogs", from, to] as const,
  timelog: (id: string) => ["timelog", id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => api.projects.list(),
  });
}

export function useTasks(projectId: string | null) {
  return useQuery({
    queryKey: queryKeys.tasks(projectId ?? ""),
    queryFn: () => api.projects.tasks(projectId!),
    enabled: !!projectId,
  });
}

export function useTimelogs(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.timelogs(from, to),
    queryFn: () => api.timelogs.list(from, to),
  });
}

export function useAllTasks() {
  const { data: projects } = useProjects();
  const projectIds = projects?.map((p) => p.id) ?? [];

  return useQuery({
    queryKey: [...queryKeys.allTasks, projectIds],
    queryFn: async () => {
      if (!projects?.length) return [];
      const all: Task[] = [];
      for (const p of projects) {
        const tasks = await api.projects.tasks(p.id);
        all.push(...tasks);
      }
      return all;
    },
    enabled: projectIds.length > 0,
  });
}

export function useTimelog(id: string | null) {
  return useQuery({
    queryKey: queryKeys.timelog(id ?? ""),
    queryFn: () => api.timelogs.get(id!),
    enabled: !!id,
  });
}

export function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    queryClient.invalidateQueries({ queryKey: queryKeys.allTasks });
    queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "tasks" });
    queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "timelogs" });
  };
}
