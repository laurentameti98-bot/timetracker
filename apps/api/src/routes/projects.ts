import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { projects, tasks } from "../db/schema.js";
import {
  projectCreateSchema,
  projectUpdateSchema,
  taskCreateSchema,
} from "@time-tracker/shared";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function projectRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return db.select().from(projects).orderBy(projects.createdAt);
  });

  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, req.params.id));
    if (!project) return reply.status(404).send({ error: "Project not found" });
    return project;
  });

  app.post("/", async (req, reply) => {
    const body = req.body as { name: string; color?: string; id?: string };
    const parsed = projectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const id = body.id && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : randomUUID();
    const now = new Date();
    await db.insert(projects).values({
      id,
      name: parsed.data.name,
      color: parsed.data.color ?? "#0d9488",
      createdAt: now,
    });
    const [created] = await db.select().from(projects).where(eq(projects.id, id));
    return reply.status(201).send(created);
  });

  app.put<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const parsed = projectUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const [existing] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, req.params.id));
    if (!existing) return reply.status(404).send({ error: "Project not found" });
    await db
      .update(projects)
      .set(parsed.data as Record<string, unknown>)
      .where(eq(projects.id, req.params.id));
    const [updated] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, req.params.id));
    return updated;
  });

  app.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const result = await db
      .delete(projects)
      .where(eq(projects.id, req.params.id));
    if (result.changes === 0) {
      return reply.status(404).send({ error: "Project not found" });
    }
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/tasks", async (req, reply) => {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, req.params.id));
    if (!project) return reply.status(404).send({ error: "Project not found" });
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, req.params.id))
      .orderBy(tasks.createdAt);
  });

  app.post<{ Params: { id: string } }>("/:id/tasks", async (req, reply) => {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, req.params.id));
    if (!project) return reply.status(404).send({ error: "Project not found" });
    const body = req.body as { name: string; id?: string };
    const parsed = taskCreateSchema.safeParse({
      ...body,
      projectId: req.params.id,
    });
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const id = body.id && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : randomUUID();
    const now = new Date();
    await db.insert(tasks).values({
      id,
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      createdAt: now,
    });
    const [created] = await db.select().from(tasks).where(eq(tasks.id, id));
    return reply.status(201).send(created);
  });
}
