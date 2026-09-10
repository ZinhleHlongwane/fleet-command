const express = require("express");
const {
  getTelemetryForDrone,
  recordTelemetry,
} = require("../controllers/telemetry.controller");
const requireFields = require("../middleware/validate");

const router = express.Router();

router.get("/drone/:droneId", getTelemetryForDrone);
router.post(
  "/drone/:droneId",
  requireFields(["battery_percent", "pos_x", "pos_y"]),
  recordTelemetry
);

module.exports = router;
