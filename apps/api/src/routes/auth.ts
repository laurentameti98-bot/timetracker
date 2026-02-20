import { FastifyInstance } from "fastify";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const clientId = process.env.GOOGLE_CLIENT_ID;
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: { idToken: string } }>("/google", async (req, reply) => {
    const { idToken } = req.body;
    if (!idToken) {
      return reply.status(400).send({ error: "idToken is required" });
    }
    if (!clientId) {
      return reply.status(500).send({ error: "GOOGLE_CLIENT_ID not configured" });
    }

    const client = new OAuth2Client(clientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      payload = ticket.getPayload();
    } catch (e) {
      return reply.status(401).send({ error: "Invalid Google token" });
    }

    if (!payload?.email || !payload.sub) {
      return reply.status(401).send({ error: "Invalid token payload" });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name ?? null;

    const [existing] = await db.select().from(users).where(eq(users.googleId, googleId));

    let user;
    if (existing) {
      await db
        .update(users)
        .set({ email, name })
        .where(eq(users.id, existing.id));
      user = { ...existing, email, name };
    } else {
      const id = randomUUID();
      const now = new Date();
      await db.insert(users).values({
        id,
        email,
        name,
        googleId,
        createdAt: now,
      });
      const [created] = await db.select().from(users).where(eq(users.id, id));
      user = created!;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  });
}
