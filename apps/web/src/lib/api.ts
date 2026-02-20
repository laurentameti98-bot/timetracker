function getApiBase(): string {
  const custom = localStorage.getItem("apiUrl");
  if (custom) return custom.replace(/\/$/, "") + "/api/v1";
  const buildTime = import.meta.env.VITE_API_URL;
  if (buildTime) return buildTime.replace(/\/$/, "") + "/api/v1";
  return "/api/v1";
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const hasBody = options?.body != null && options.body !== "";
  const headers: Record<string, string> = {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers as Record<string, string>),
  };
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error?.message ?? err.error ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  projects: {
    list: () => fetchApi<{ id: string; name: string; subtitle?: string; color: string; createdAt: string }[]>(`/projects`),
    get: (id: string) => fetchApi<{ id: string; name: string; subtitle?: string; color: string; createdAt: string }>(`/projects/${id}`),
    create: (data: { name: string; subtitle?: string; color?: string; id?: string }) =>
      fetchApi<{ id: string; name: string; subtitle?: string; color: string; createdAt: string }>(`/projects`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name?: string; subtitle?: string; color?: string }) =>
      fetchApi<{ id: string; name: string; subtitle?: string; color: string; createdAt: string }>(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchApi<void>(`/projects/${id}`, { method: "DELETE" }),
    tasks: (projectId: string) =>
      fetchApi<{ id: string; projectId: string; name: string; createdAt: string }[]>(
        `/projects/${projectId}/tasks`
      ),
    createTask: (projectId: string, data: { name: string; id?: string }) =>
      fetchApi<{ id: string; projectId: string; name: string; createdAt: string }>(
        `/projects/${projectId}/tasks`,
        { method: "POST", body: JSON.stringify(data) }
      ),
  },
  tasks: {
    get: (id: string) =>
      fetchApi<{ id: string; projectId: string; name: string; createdAt: string }>(`/tasks/${id}`),
    update: (id: string, data: { name?: string; projectId?: string }) =>
      fetchApi<{ id: string; projectId: string; name: string; createdAt: string }>(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchApi<void>(`/tasks/${id}`, { method: "DELETE" }),
  },
  timelogs: {
    list: (from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return fetchApi<
        {
          id: string;
          projectId: string;
          taskId: string;
          startTime: string;
          endTime: string | null;
          notes: string;
          createdAt: string;
          updatedAt: string;
        }[]
      >(`/timelogs?${params}`);
    },
    create: (data: {
      projectId: string;
      taskId: string;
      startTime: string;
      endTime?: string;
      notes?: string;
      id?: string;
    }) =>
      fetchApi<{
        id: string;
        projectId: string;
        taskId: string;
        startTime: string;
        endTime: string | null;
        notes: string;
        createdAt: string;
        updatedAt: string;
      }>(`/timelogs`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: {
        projectId?: string;
        taskId?: string;
        startTime?: string;
        endTime?: string;
        notes?: string;
      }
    ) =>
      fetchApi<{
        id: string;
        projectId: string;
        taskId: string;
        startTime: string;
        endTime: string | null;
        notes: string;
        createdAt: string;
        updatedAt: string;
      }>(`/timelogs/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchApi<void>(`/timelogs/${id}`, { method: "DELETE" }),
  },
  reports: {
    summary: (from?: string, to?: string, groupBy?: "project" | "task" | "day") => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (groupBy) params.set("groupBy", groupBy);
      return fetchApi<
        | { projectId?: string; projectName?: string; totalMinutes: number }[]
        | { taskId?: string; taskName?: string; projectName?: string; totalMinutes: number }[]
        | { date?: string; totalMinutes: number }[]
      >(`/reports/summary?${params}`);
    },
  },
};
