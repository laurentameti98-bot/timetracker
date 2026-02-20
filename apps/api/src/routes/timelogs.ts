import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { timelogs, projects } from "../db/schema.js";
import { timelogCreateSchema, timelogUpdateSchema } from "@time-tracker/shared";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function timelogRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { from?: string; to?: string };
  }>("/", async (req) => {
    const userId = req.user!.userId;
    const { from, to } = req.query;
    const conditions = [eq(projects.userId, userId)];
    if (from) conditions.push(gte(timelogs.startTime, new Date(from)));
    if (to) conditions.push(lte(timelogs.startTime, new Date(to)));
    const result = await db
      .select({ timelog: timelogs })
      .from(timelogs)
      .innerJoin(projects, eq(timelogs.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(timelogs.startTime);
    return result.map((r) => r.timelog);
  });

  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const userId = req.user!.userId;
    const [row] = await db
      .select({ timelog: timelogs })
      .from(timelogs)
      .innerJoin(projects, eq(timelogs.projectId, projects.id))
      .where(and(eq(timelogs.id, req.params.id), eq(projects.userId, userId)));
    if (!row) return reply.status(404).send({ error: "Timelog not found" });
    return row.timelog;
  });

  app.post("/", async (req, reply) => {
    const userId = req.user!.userId;
    const body = req.body as { projectId: string; taskId: string; startTime: string; endTime?: string; notes?: string; id?: string };
    const parsed = timelogCreateSchema.safeParse(body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, parsed.data.projectId), eq(projects.userId, userId)));
    if (!project) return reply.status(404).send({ error: "Project not found" });
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
    const userId = req.user!.userId;
    const parsed = timelogUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const [row] = await db
      .select({ timelog: timelogs })
      .from(timelogs)
      .innerJoin(projects, eq(timelogs.projectId, projects.id))
      .where(and(eq(timelogs.id, req.params.id), eq(projects.userId, userId)));
    if (!row) return reply.status(404).send({ error: "Timelog not found" });
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
    const userId = req.user!.userId;
    const [row] = await db
      .select()
      .from(timelogs)
      .innerJoin(projects, eq(timelogs.projectId, projects.id))
      .where(and(eq(timelogs.id, req.params.id), eq(projects.userId, userId)));
    if (!row) return reply.status(404).send({ error: "Timelog not found" });
    await db.delete(timelogs).where(eq(timelogs.id, req.params.id));
    return reply.status(204).send();
  });
}
