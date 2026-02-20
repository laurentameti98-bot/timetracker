import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

declare module "fastify" {
  interface FastifyRequest {
    user?: { userId: string; email: string };
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing or invalid authorization" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    req.user = payload;
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}
