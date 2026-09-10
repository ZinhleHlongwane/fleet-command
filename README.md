# Fleet Command 🛰️

A full-stack drone fleet management app I built using PostgreSQL, Express, React, and Node (PERN stack).

I already had a drone fleet API built with Spring Boot for one of my other projects (Cloud Fleet Microservices), so I wanted to rebuild the same idea using a JavaScript stack instead, same domain, different tech, so I could compare the two approaches and get more practice outside of Java.

## What it does

- Operators can register and log in (JWT auth, passwords hashed with bcrypt)
- Drones have a call sign, model, status, battery %, and a position on a grid
- You can dispatch a drone on a mission to a destination — this automatically updates the drone's status to `in_mission`
- Marking a mission as completed or aborted frees the drone back up to `idle`
- Each drone keeps a telemetry log (battery + position readings over time)
- Anyone can view the dashboard, but you need to be logged in to add drones, dispatch missions, or change mission status

## Tech stack

- **Database:** PostgreSQL
- **Backend:** Node.js + Express, `pg` for queries (no ORM), JWT for auth, bcrypt for password hashing
- **Frontend:** React (Vite), React Router, plain CSS — no UI framework

I kept the ORM and UI framework out on purpose so the SQL and the styling stay visible instead of hidden behind abstractions I can't fully explain yet.

## Project structure

```
fleet-command/
├── backend/
│   └── src/
│       ├── config/        # DB connection pool
│       ├── db/            # schema.sql, seed.sql, init script
│       ├── middleware/    # auth check, validation, error handling
│       ├── controllers/   # route logic
│       └── routes/
├── frontend/
│   └── src/
│       ├── api/           # all fetch calls to the backend
│       ├── context/       # auth context
│       ├── components/
│       └── pages/
├── docker-compose.yml      # spins up Postgres in a container
└── README.md
```

## Running it locally

**1. Get PostgreSQL running**

Either with Docker:
```
docker compose up -d
```
or install PostgreSQL yourself and create a database called `fleet_command`.

**2. Backend**
```
cd backend
cp .env.example .env
npm install
npm run db:init
npm run dev
```
This starts the API on `http://localhost:5000`.

**3. Frontend**
```
cd frontend
npm install
npm run dev
```
This starts the app on `http://localhost:5173`. The dev server proxies `/api` calls to the backend, so both need to be running at the same time.

**4. Optional — sample data**
```
psql -d fleet_command -f backend/src/db/seed.sql
```
adds a few starter drones so the dashboard isn't empty.

## API routes

All routes start with `/api`.

| Method | Route | Auth? | What it does |
|---|---|---|---|
| POST | `/auth/register` | no | create an operator account |
| POST | `/auth/login` | no | log in, get a token back |
| GET | `/drones` | no | list all drones |
| GET | `/drones/:id` | no | get one drone |
| POST | `/drones` | yes | add a drone |
| PATCH | `/drones/:id` | yes | update a drone |
| DELETE | `/drones/:id` | yes | remove a drone |
| POST | `/drones/:id/recall` | yes | send a drone back to base |
| GET | `/missions` | no | list all missions |
| GET | `/missions/drone/:droneId` | no | missions for one drone |
| POST | `/missions` | yes | dispatch a mission |
| PATCH | `/missions/:id/status` | yes | update mission status |
| GET | `/telemetry/drone/:droneId` | no | telemetry history for a drone |
| POST | `/telemetry/drone/:droneId` | no | log a telemetry reading |

Protected routes need the token from login/register sent as:
```
Authorization: Bearer <token>
```

## Database schema

Four tables:
- `operators` — id, name, email, password_hash, created_at
- `drones` — id, call_sign, model, status, battery_percent, pos_x, pos_y, home_base, last_seen_at
- `missions` — id, drone_id (FK), operator_id (FK), title, destination_x/y, status, notes, created_at, completed_at
- `telemetry_logs` — id, drone_id (FK), battery_percent, pos_x, pos_y, recorded_at

Statuses are restricted with `CHECK` constraints instead of a separate enum, mainly so I could see the valid values directly in the schema file without looking anywhere else.

## Things I'd add if I kept working on this

- A live map view instead of just printing (x, y) coordinates as numbers
- WebSockets so telemetry updates show up without refreshing the page
- Roles (admin vs operator) so only admins can delete drones
- Tests for the backend controllers with Jest + Supertest
- Pagination on `/missions` and `/telemetry` once there's more data

## License

MIT
