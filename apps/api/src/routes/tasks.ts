import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { tasks, timelogs, projects } from "../db/schema.js";
import { taskUpdateSchema } from "@time-tracker/shared";
import { eq, and } from "drizzle-orm";

async function getTaskIfOwned(
  dbInstance: typeof import("../db/index.js").db,
  taskId: string,
  userId: string
) {
  const [row] = await dbInstance
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(eq(tasks.id, taskId), eq(projects.userId, userId)));
  return row?.task ?? null;
}

export async function taskRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const userId = req.user!.userId;
    const task = await getTaskIfOwned(db, req.params.id, userId);
    if (!task) return reply.status(404).send({ error: "Task not found" });
    return task;
  });

  app.put<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const userId = req.user!.userId;
    const parsed = taskUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const existing = await getTaskIfOwned(db, req.params.id, userId);
    if (!existing) return reply.status(404).send({ error: "Task not found" });
    await db
      .update(tasks)
      .set(parsed.data as Record<string, unknown>)
      .where(eq(tasks.id, req.params.id));
    const [updated] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, req.params.id));
    return updated;
  });

  app.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const userId = req.user!.userId;
    const existing = await getTaskIfOwned(db, req.params.id, userId);
    if (!existing) return reply.status(404).send({ error: "Task not found" });
    // Cascade: delete timelogs before task
    await db.delete(timelogs).where(eq(timelogs.taskId, req.params.id));
    await db.delete(tasks).where(eq(tasks.id, req.params.id));
    return reply.status(204).send();
  });
}
