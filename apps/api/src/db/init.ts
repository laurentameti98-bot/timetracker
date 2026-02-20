import { sqliteDb } from "./index.js";

export async function initDb() {
  // Users table (must exist before projects with userId)
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      google_id TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    )
  `);

  // Add subtitle column if missing (migration for existing DBs)
  try {
    sqliteDb.exec(`ALTER TABLE projects ADD COLUMN subtitle TEXT DEFAULT ''`);
  } catch {
    // Column already exists
  }

  // Add userId column if missing (migration for existing DBs)
  try {
    sqliteDb.exec(`ALTER TABLE projects ADD COLUMN user_id TEXT`);
  } catch {
    // Column already exists
  }

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      color TEXT NOT NULL DEFAULT '#0d9488',
      created_at INTEGER NOT NULL
    )
  `);
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS timelogs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      notes TEXT DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
}
