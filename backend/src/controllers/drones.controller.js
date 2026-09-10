// CRUD operations for drones, plus a couple of fleet-specific actions
// like "recall to base" and "recharge".

const db = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");

const getAllDrones = asyncHandler(async (req, res) => {
  const result = await db.query("SELECT * FROM drones ORDER BY call_sign ASC");
  res.json(result.rows);
});

const getDroneById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.query("SELECT * FROM drones WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    throw new ApiError(404, "Drone not found");
  }

  res.json(result.rows[0]);
});

const createDrone = asyncHandler(async (req, res) => {
  const { call_sign, model, home_base } = req.body;

  const result = await db.query(
    `INSERT INTO drones (call_sign, model, home_base)
     VALUES ($1, $2, COALESCE($3, 'Main Depot'))
     RETURNING *`,
    [call_sign, model, home_base]
  );

  res.status(201).json(result.rows[0]);
});

const updateDrone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { call_sign, model, status, battery_percent, pos_x, pos_y, home_base } = req.body;

  const result = await db.query(
    `UPDATE drones SET
        call_sign = COALESCE($1, call_sign),
        model = COALESCE($2, model),
        status = COALESCE($3, status),
        battery_percent = COALESCE($4, battery_percent),
        pos_x = COALESCE($5, pos_x),
        pos_y = COALESCE($6, pos_y),
        home_base = COALESCE($7, home_base),
        last_seen_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [call_sign, model, status, battery_percent, pos_x, pos_y, home_base, id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Drone not found");
  }

  res.json(result.rows[0]);
});

const deleteDrone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.query("DELETE FROM drones WHERE id = $1 RETURNING id", [id]);

  if (result.rows.length === 0) {
    throw new ApiError(404, "Drone not found");
  }

  res.status(204).send();
});

// Sends a drone back to its home base coordinates (0,0 in this simple model)
// and marks it idle. A realistic fleet system would path-plan this; here
// we just simulate the end state so the UI has something to react to.
const recallDrone = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `UPDATE drones SET status = 'idle', pos_x = 0, pos_y = 0, last_seen_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Drone not found");
  }

  res.json(result.rows[0]);
});

module.exports = {
  getAllDrones,
  getDroneById,
  createDrone,
  updateDrone,
  deleteDrone,
  recallDrone,
};
