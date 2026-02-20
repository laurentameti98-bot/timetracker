import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_URL ?? "./data/sqlite.db";
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
try {
  sqlite.pragma("foreign_keys = ON");
} catch {
  // Some environments may not support it; cascade deletes are done explicitly in routes
}
export const sqliteDb = sqlite;
export const db = drizzle(sqlite, { schema });
