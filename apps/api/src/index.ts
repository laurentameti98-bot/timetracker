import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth.js";
import { projectRoutes } from "./routes/projects.js";
import { taskRoutes } from "./routes/tasks.js";
import { timelogRoutes } from "./routes/timelogs.js";
import { reportRoutes } from "./routes/reports.js";
import { initDb } from "./db/init.js";
import { requireAuth } from "./middleware/auth.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: [
    "https://timetrackerapp-mu.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    /\.vercel\.app$/,
  ],
  credentials: false,
});

app.register(async (api) => {
  api.register(authRoutes, { prefix: "/auth" });
  api.register(async (protectedApi) => {
    protectedApi.addHook("preHandler", requireAuth);
    protectedApi.register(projectRoutes, { prefix: "/projects" });
    protectedApi.register(timelogRoutes, { prefix: "/timelogs" });
    protectedApi.register(reportRoutes, { prefix: "/reports" });
    protectedApi.register(taskRoutes, { prefix: "/tasks" });
  });
}, { prefix: "/api/v1" });

app.get("/health", async () => ({ status: "ok" }));

try {
  await initDb();
} catch (err) {
  console.error("Database init failed:", err);
  throw err;
}

const port = Number(process.env.PORT) || 3001;
await app.listen({ port, host: "0.0.0.0" });
console.log(`API running at http://localhost:${port}`);
