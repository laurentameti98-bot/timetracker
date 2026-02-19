import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { timelogs } from "../db/schema.js";
import { timelogCreateSchema, timelogUpdateSchema } from "@time-tracker/shared";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function timelogRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { from?: string; to?: string };
  }>("/", async (req) => {
    const { from, to } = req.query;
    let query = db.select().from(timelogs).orderBy(timelogs.startTime);
    if (from) {
      const fromDate = new Date(from);
      query = query.where(gte(timelogs.startTime, fromDate)) as typeof query;
    }
    if (to) {
      const toDate = new Date(to);
      query = query.where(lte(timelogs.startTime, toDate)) as typeof query;
    }
    return query;
  });

  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const [timelog] = await db
      .select()
      .from(timelogs)
      .where(eq(timelogs.id, req.params.id));
    if (!timelog) return reply.status(404).send({ error: "Timelog not found" });
    return timelog;
  });

  app.post("/", async (req, reply) => {
    const body = req.body as { projectId: string; taskId: string; startTime: string; endTime?: string; notes?: string; id?: string };
    const parsed = timelogCreateSchema.safeParse(body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const id = body.id && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : randomUUID();
    const now = new Date();
    await db.insert(timelogs).values({
      id,
      projectId: parsed.data.projectId,
      taskId: parsed.data.taskId,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime ?? null,
      notes: parsed.data.notes ?? "",
      createdAt: now,
      updatedAt: now,
    });
    const [created] = await db
      .select()
      .from(timelogs)
      .where(eq(timelogs.id, id));
    return reply.status(201).send(created);
  });

  app.put<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const parsed = timelogUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const [existing] = await db
      .select()
      .from(timelogs)
      .where(eq(timelogs.id, req.params.id));
    if (!existing)
      return reply.status(404).send({ error: "Timelog not found" });
    const updateData = { ...parsed.data, updatedAt: new Date() };
    await db
      .update(timelogs)
      .set(updateData as Record<string, unknown>)
      .where(eq(timelogs.id, req.params.id));
    const [updated] = await db
      .select()
      .from(timelogs)
      .where(eq(timelogs.id, req.params.id));
    return updated;
  });

  app.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const result = await db
      .delete(timelogs)
      .where(eq(timelogs.id, req.params.id));
    if (result.changes === 0) {
      return reply.status(404).send({ error: "Timelog not found" });
    }
    return reply.status(204).send();
  });
}
