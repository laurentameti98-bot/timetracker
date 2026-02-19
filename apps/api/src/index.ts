import Fastify from "fastify";
import cors from "@fastify/cors";
import { projectRoutes } from "./routes/projects.js";
import { taskRoutes } from "./routes/tasks.js";
import { timelogRoutes } from "./routes/timelogs.js";
import { reportRoutes } from "./routes/reports.js";
import { initDb } from "./db/init.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.register(async (api) => {
  api.register(projectRoutes, { prefix: "/projects" });
  api.register(timelogRoutes, { prefix: "/timelogs" });
  api.register(reportRoutes, { prefix: "/reports" });
  api.register(taskRoutes, { prefix: "/tasks" });
}, { prefix: "/api/v1" });

app.get("/health", async () => ({ status: "ok" }));

await initDb();

const port = Number(process.env.PORT) || 3001;
await app.listen({ port, host: "0.0.0.0" });
console.log(`API running at http://localhost:${port}`);
