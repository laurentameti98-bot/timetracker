import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { tasks } from "../db/schema.js";
import { taskUpdateSchema } from "@time-tracker/shared";
import { eq } from "drizzle-orm";

export async function taskRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, req.params.id));
    if (!task) return reply.status(404).send({ error: "Task not found" });
    return task;
  });

  app.put<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const parsed = taskUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const [existing] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, req.params.id));
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
    const result = await db.delete(tasks).where(eq(tasks.id, req.params.id));
    if (result.changes === 0) {
      return reply.status(404).send({ error: "Task not found" });
    }
    return reply.status(204).send();
  });
}
