// Telemetry is a simple time-series log per drone: battery level and
// position at a point in time. Recording a reading also updates the
// drone's "live" row so the dashboard always shows the latest state.

const db = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");

const getTelemetryForDrone = asyncHandler(async (req, res) => {
  const { droneId } = req.params;
  const result = await db.query(
    `SELECT * FROM telemetry_logs
     WHERE drone_id = $1
     ORDER BY recorded_at DESC
     LIMIT 50`,
    [droneId]
  );
  res.json(result.rows);
});

const recordTelemetry = asyncHandler(async (req, res) => {
  const { droneId } = req.params;
  const { battery_percent, pos_x, pos_y } = req.body;

  const droneExists = await db.query("SELECT id FROM drones WHERE id = $1", [droneId]);
  if (droneExists.rows.length === 0) {
    throw new ApiError(404, "Drone not found");
  }

  const logResult = await db.query(
    `INSERT INTO telemetry_logs (drone_id, battery_percent, pos_x, pos_y)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [droneId, battery_percent, pos_x, pos_y]
  );

  await db.query(
    `UPDATE drones SET battery_percent = $1, pos_x = $2, pos_y = $3, last_seen_at = NOW()
     WHERE id = $4`,
    [battery_percent, pos_x, pos_y, droneId]
  );

  res.status(201).json(logResult.rows[0]);
});

module.exports = { getTelemetryForDrone, recordTelemetry };
