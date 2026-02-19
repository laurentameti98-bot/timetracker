import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { timelogs, projects, tasks } from "../db/schema.js";
import { eq, gte, lte, sql, and } from "drizzle-orm";

export async function reportRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: {
      from?: string;
      to?: string;
      groupBy?: "project" | "task" | "day";
    };
  }>("/summary", async (req) => {
    const { from, to, groupBy = "project" } = req.query;
    const fromDate = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0));
    const toDate = to ? new Date(to) : new Date();

    if (groupBy === "project") {
      const result = await db
        .select({
          projectId: timelogs.projectId,
          projectName: projects.name,
          totalMinutes: sql<number>`cast(
            sum(
              (unixepoch(${timelogs.endTime}) - unixepoch(${timelogs.startTime})) / 60
            ) as integer
          )`,
        })
        .from(timelogs)
        .innerJoin(projects, eq(timelogs.projectId, projects.id))
        .where(
          and(
            gte(timelogs.startTime, fromDate),
            lte(timelogs.startTime, toDate),
            sql`${timelogs.endTime} IS NOT NULL`
          )
        )
        .groupBy(timelogs.projectId, projects.name);
      return result;
    }

    if (groupBy === "task") {
      const result = await db
        .select({
          taskId: timelogs.taskId,
          taskName: tasks.name,
          projectName: projects.name,
          totalMinutes: sql<number>`cast(
            sum(
              (unixepoch(${timelogs.endTime}) - unixepoch(${timelogs.startTime})) / 60
            ) as integer
          )`,
        })
        .from(timelogs)
        .innerJoin(tasks, eq(timelogs.taskId, tasks.id))
        .innerJoin(projects, eq(timelogs.projectId, projects.id))
        .where(
          and(
            gte(timelogs.startTime, fromDate),
            lte(timelogs.startTime, toDate),
            sql`${timelogs.endTime} IS NOT NULL`
          )
        )
        .groupBy(timelogs.taskId, tasks.name, projects.name);
      return result;
    }

    if (groupBy === "day") {
      const result = await db
        .select({
          date: sql<string>`date(${timelogs.startTime})`,
          totalMinutes: sql<number>`cast(
            sum(
              (unixepoch(${timelogs.endTime}) - unixepoch(${timelogs.startTime})) / 60
            ) as integer
          )`,
        })
        .from(timelogs)
        .where(
          and(
            gte(timelogs.startTime, fromDate),
            lte(timelogs.startTime, toDate),
            sql`${timelogs.endTime} IS NOT NULL`
          )
        )
        .groupBy(sql`date(${timelogs.startTime})`);
      return result;
    }

    return [];
  });
}
