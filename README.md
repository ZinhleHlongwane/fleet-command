# 🛰️ Fleet Command

A full-stack drone fleet dispatch and monitoring system, built with **PostgreSQL**, **Express (Node.js)**, and **React**.

Operators can log in, watch every drone's live status and battery level on a dashboard, dispatch missions to a destination, and review each drone's mission history and telemetry log.

> **Why this project:** it's the same "fleet management" domain as a drone-tracking API — reimagined here as a full PERN-stack app (PostgreSQL, Express, React, Node) with authentication, a relational schema, and a real UI on top, instead of a Spring Boot API alone. Good pairing for a portfolio: same idea, two different stacks.

---

## What it does

- **Operators** register and log in (JWT-based auth, passwords hashed with bcrypt).
- **Drones** have a call sign, model, status (`idle`, `in_mission`, `charging`, `maintenance`, `offline`), battery percentage, and an (x, y) position.
- **Missions** send a drone to a destination. Creating a mission automatically flips the drone's status to `in_mission`; marking it `completed` or `aborted` frees the drone back to `idle`.
- **Telemetry logs** record a time-stamped history of battery and position readings per drone, which also updates that drone's "live" row.
- The dashboard is public to view (read-only), but creating drones, dispatching missions, and changing mission status requires being logged in.

---

## Tech stack

| Layer     | Technology                                      |
|-----------|--------------------------------------------------|
| Database  | PostgreSQL                                       |
| Backend   | Node.js, Express, `pg`, JWT, bcrypt              |
| Frontend  | React (Vite), React Router, plain CSS            |

No ORM is used on the backend — queries are written directly with the `pg` driver so the SQL stays visible and easy to reason about. No UI framework is used on the frontend — just React, React Router, and hand-written CSS, so there's nothing hidden behind a component library.

---

## Project structure

```
fleet-command/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # PostgreSQL connection pool
│   │   ├── db/
│   │   │   ├── schema.sql        # Table definitions
│   │   │   ├── seed.sql          # Optional sample data
│   │   │   └── init.js           # Runs schema.sql against your database
│   │   ├── middleware/
│   │   │   ├── auth.js           # Verifies JWT on protected routes
│   │   │   ├── validate.js       # Checks required request body fields
│   │   │   └── errorHandler.js   # Turns thrown errors into JSON responses
│   │   ├── controllers/          # Business logic per resource
│   │   ├── routes/                # Express routers per resource
│   │   ├── app.js                # Express app + middleware wiring
│   │   └── server.js             # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js         # All fetch() calls to the backend live here
│   │   ├── context/AuthContext.jsx
│   │   ├── components/           # DroneCard, StatusBadge, BatteryBadge, Navbar...
│   │   ├── pages/                 # Dashboard, DroneDetail, Missions, Login, Register
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── docker-compose.yml             # Optional: run just PostgreSQL in a container
└── README.md
```

---

## Getting started

### 1. Database

**Option A — Docker (easiest):**
```bash
docker compose up -d
```
This starts PostgreSQL on `localhost:5432` with a database called `fleet_command`, user `fleet_user`, password `fleet_password` — matching the defaults in `.env.example`.

**Option B — local PostgreSQL install:**
Create a database and user yourself, then update `backend/.env` to match.

### 2. Backend

```bash
cd backend
cp .env.example .env      # edit if your DB credentials differ
npm install
npm run db:init           # creates all tables
node src/db/init.js       # (same as above — db:init runs this)
npm run dev                # starts the API on http://localhost:5000
```

Optional: load sample drones with `psql -d fleet_command -f src/db/seed.sql` (adjust connection flags to match your setup).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to `http://localhost:5000`, so the frontend and backend can run side by side without CORS headaches during development.

### 4. Try it out

1. Open `http://localhost:5173`.
2. You'll see the dashboard (empty until you add drones, or run the seed file).
3. Register an operator account, then log in.
4. Add a drone, dispatch a mission, and watch its status change.

---

## API overview

All routes are prefixed with `/api`.

| Method | Endpoint                        | Auth required | Description                          |
|--------|----------------------------------|:--------------:|---------------------------------------|
| POST   | `/auth/register`                | No             | Create an operator account            |
| POST   | `/auth/login`                   | No             | Log in, returns a JWT                 |
| GET    | `/drones`                       | No             | List all drones                       |
| GET    | `/drones/:id`                   | No             | Get one drone                         |
| POST   | `/drones`                       | Yes            | Add a new drone                       |
| PATCH  | `/drones/:id`                   | Yes            | Update a drone's fields               |
| DELETE | `/drones/:id`                   | Yes            | Remove a drone                        |
| POST   | `/drones/:id/recall`            | Yes            | Send a drone back to base, set idle   |
| GET    | `/missions`                     | No             | List all missions (with call sign)    |
| GET    | `/missions/drone/:droneId`      | No             | List missions for one drone           |
| POST   | `/missions`                     | Yes            | Dispatch a new mission                |
| PATCH  | `/missions/:id/status`          | Yes            | Update mission status                 |
| GET    | `/telemetry/drone/:droneId`     | No             | Get recent telemetry for a drone      |
| POST   | `/telemetry/drone/:droneId`     | No             | Record a telemetry reading            |

Send the JWT from login/register as a header on protected routes:
```
Authorization: Bearer <token>
```

---

## Database schema

Four tables, defined in `backend/src/db/schema.sql`:

- **`operators`** — id, name, email (unique), password_hash, created_at
- **`drones`** — id, call_sign (unique), model, status, battery_percent, pos_x, pos_y, home_base, last_seen_at, created_at
- **`missions`** — id, drone_id (FK), operator_id (FK), title, destination_x/y, status, notes, created_at, completed_at
- **`telemetry_logs`** — id, drone_id (FK), battery_percent, pos_x, pos_y, recorded_at

Status fields use `CHECK` constraints instead of a separate enum type, so the valid values are visible right in the table definition. Foreign keys cascade on delete for `missions` and `telemetry_logs`, so removing a drone cleans up its history automatically.

---

## Ideas for extending this

- Add a live map view (SVG or Canvas) plotting drone (x, y) positions instead of just printing coordinates.
- Add a WebSocket connection so telemetry updates push to the dashboard in real time instead of requiring a page refresh.
- Add role-based auth (e.g. "admin" vs "operator") so only admins can delete drones.
- Add pagination to `/missions` and `/telemetry` once there's enough data to matter.
- Write integration tests for the controllers using Jest + Supertest, and a test database.

---

