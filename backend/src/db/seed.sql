-- Optional sample data so the dashboard isn't empty on first run.
-- Run manually with: psql -d fleet_command -f src/db/seed.sql

INSERT INTO drones (call_sign, model, status, battery_percent, pos_x, pos_y, home_base)
VALUES
    ('FALCON-1', 'Skyhawk X200', 'idle', 92, 0, 0, 'Main Depot'),
    ('FALCON-2', 'Skyhawk X200', 'in_mission', 61, 14, 8, 'Main Depot'),
    ('RAVEN-1',  'Corvid Mini',  'charging', 34, 2, 2, 'North Outpost'),
    ('RAVEN-2',  'Corvid Mini',  'maintenance', 0, 0, 0, 'North Outpost')
ON CONFLICT (call_sign) DO NOTHING;
