import express from "express";
import {
  getTelemetryForDrone,
  recordTelemetry,
} from "../controllers/telemetry.controller";
import requireFields = require("../middleware/validate");

const router = express.Router();

router.get("/drone/:droneId", getTelemetryForDrone);

router.post(
  "/drone/:droneId",
  requireFields(["battery_percent", "pos_x", "pos_y"]),
  recordTelemetry
);

export = router;