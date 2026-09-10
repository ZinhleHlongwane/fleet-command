// Missions link a drone to a destination and a status.
// Creating a mission also flips the drone's status to "in_mission" so the
// dashboard reflects reality without a separate manual update.

const db = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");

const getAllMissions = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT missions.*, drones.call_sign
     FROM missions
     JOIN drones ON drones.id = missions.drone_id
     ORDER BY missions.created_at DESC`
  );
  res.json(result.rows);
});

const getMissionsForDrone = asyncHandler(async (req, res) => {
  const { droneId } = req.params;
  const result = await db.query(
    "SELECT * FROM missions WHERE drone_id = $1 ORDER BY created_at DESC",
    [droneId]
  );
  res.json(result.rows);
});

const createMission = asyncHandler(async (req, res) => {
  const { drone_id, title, destination_x, destination_y, notes } = req.body;

  const drone = await db.query("SELECT id, status FROM drones WHERE id = $1", [drone_id]);
  if (drone.rows.length === 0) {
    throw new ApiError(404, "That drone doesn't exist");
  }
  if (drone.rows[0].status === "maintenance" || drone.rows[0].status === "offline") {
    throw new ApiError(400, "This drone isn't available for a mission right now");
  }

  // A transaction here keeps "create the mission" and "update the drone
  // status" as one atomic step - if either fails, both roll back, so we
  // never end up with a mission but a drone that's still marked idle.
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const missionResult = await client.query(
      `INSERT INTO missions (drone_id, operator_id, title, destination_x, destination_y, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [drone_id, req.operator?.id || null, title, destination_x, destination_y, notes || null]
    );

    await client.query(
      "UPDATE drones SET status = 'in_mission', last_seen_at = NOW() WHERE id = $1",
      [drone_id]
    );

    await client.query("COMMIT");
    res.status(201).json(missionResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

const updateMissionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["planned", "active", "completed", "aborted"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${validStatuses.join(", ")}`);
  }

  const completedAt = status === "completed" || status === "aborted" ? "NOW()" : "NULL";

  const result = await db.query(
    `UPDATE missions SET status = $1, completed_at = ${completedAt}
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Mission not found");
  }

  // If the mission wrapped up, free the drone back to idle.
  if (status === "completed" || status === "aborted") {
    await db.query("UPDATE drones SET status = 'idle' WHERE id = $1", [
      result.rows[0].drone_id,
    ]);
  }

  res.json(result.rows[0]);
});

module.exports = {
  getAllMissions,
  getMissionsForDrone,
  createMission,
  updateMissionStatus,
};
