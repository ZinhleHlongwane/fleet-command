-- Fleet Command database schema
-- Run this once against a fresh "fleet_command" database to create all tables.
-- (npm run db:init does this for you automatically.)

-- Operators are the humans who log in and control the fleet.
CREATE TABLE IF NOT EXISTS operators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Drones are the physical units being tracked.
-- status is kept as plain text with a CHECK constraint instead of an enum
-- type so it stays easy to read directly in the database.
CREATE TABLE IF NOT EXISTS drones (
    id SERIAL PRIMARY KEY,
    call_sign VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'idle'
        CHECK (status IN ('idle', 'in_mission', 'charging', 'maintenance', 'offline')),
    battery_percent INTEGER NOT NULL DEFAULT 100
        CHECK (battery_percent BETWEEN 0 AND 100),
    pos_x NUMERIC(10, 2) NOT NULL DEFAULT 0,
    pos_y NUMERIC(10, 2) NOT NULL DEFAULT 0,
    home_base VARCHAR(100) NOT NULL DEFAULT 'Main Depot',
    last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Missions are jobs assigned to a drone: fly from A to B and do something.
CREATE TABLE IF NOT EXISTS missions (
    id SERIAL PRIMARY KEY,
    drone_id INTEGER NOT NULL REFERENCES drones(id) ON DELETE CASCADE,
    operator_id INTEGER REFERENCES operators(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    destination_x NUMERIC(10, 2) NOT NULL,
    destination_y NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned', 'active', 'completed', 'aborted')),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Telemetry is a time-stamped log of readings sent by a drone during flight.
-- This is what powers the little history chart on the drone detail page.
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id SERIAL PRIMARY KEY,
    drone_id INTEGER NOT NULL REFERENCES drones(id) ON DELETE CASCADE,
    battery_percent INTEGER NOT NULL CHECK (battery_percent BETWEEN 0 AND 100),
    pos_x NUMERIC(10, 2) NOT NULL,
    pos_y NUMERIC(10, 2) NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missions_drone_id ON missions(drone_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_drone_id ON telemetry_logs(drone_id);
