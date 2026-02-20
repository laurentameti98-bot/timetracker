# Time Tracker PWA

A mobile-first, offline-capable Progressive Web App for time tracking with projects and tasks.

## Features

- **Stopwatch timer** – Start/stop tracking; elapsed time is computed from stored start timestamp (works when phone is locked)
- **Projects & tasks** – Create and manage projects with color, add tasks per project
- **Timelog management** – Edit and delete timelogs; assign project/task before or after stopping
- **Daily list view** – Filter by date, copy to clipboard (tab-separated for pasting into spreadsheets)
- **Reports** – Time per project/task, bar and pie charts, date range filter, CSV export
- **Offline-first** – Data stored in IndexedDB; syncs to backend when online
- **PWA** – Installable, works offline with service worker

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Dexie (IndexedDB), Recharts
- **Backend:** Fastify, Drizzle ORM, SQLite
- **Shared:** Zod schemas, shared types

## Quick Start

```bash
pnpm install
pnpm dev
```

This runs both the API (port 3001) and web app (port 5173). The web app proxies `/api` to the backend.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run API and web in parallel |
| `pnpm dev:web` | Run web app only (port 5173) |
| `pnpm dev:api` | Run API only (port 3001) |
| `pnpm build` | Build all packages |
| `pnpm db:push` | Push schema to database |

## Project Structure

```
time-tracker/
├── apps/
│   ├── web/       # React PWA
│   └── api/       # Fastify backend
├── packages/
│   └── shared/    # Zod schemas, types
└── package.json
```

## API

REST API at `/api/v1`:

- `GET/POST /projects` – List, create
- `GET/PUT/DELETE /projects/:id` – Project CRUD
- `GET/POST /projects/:id/tasks` – List, create tasks
- `GET/PUT/DELETE /tasks/:id` – Task CRUD
- `GET/POST /timelogs` – List (filter by from/to), create
- `GET/PUT/DELETE /timelogs/:id` – Timelog CRUD
- `GET /reports/summary?from=&to=&groupBy=project|task|day` – Aggregated time

## Deployment (Vercel + Render)

**Frontend (Vercel):**
- Root: `apps/web`, Build: `cd ../.. && pnpm install && pnpm build --filter web`, Output: `dist`
- Add env var `VITE_API_URL` = your Render API URL (e.g. `https://your-api.onrender.com`) so sync works without manual setup
- `vercel.json` handles SPA routing (all routes serve `index.html`)

**Backend (Render):**
- Build: `pnpm install && pnpm build --filter api`, Start: `node apps/api/dist/index.js`
- Add Disk, mount at `/data`, set `DATABASE_URL=/data/sqlite.db`

**Alternative:** Set API URL manually in app Settings after deployment.

**Auth:** Set `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` (web + API) for Google Sign-In.
