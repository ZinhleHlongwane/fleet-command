const express = require("express");
const {
  getAllMissions,
  getMissionsForDrone,
  createMission,
  updateMissionStatus,
} = require("../controllers/missions.controller");
const requireFields = require("../middleware/validate");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.get("/", getAllMissions);
router.get("/drone/:droneId", getMissionsForDrone);
router.post(
  "/",
  requireAuth,
  requireFields(["drone_id", "title", "destination_x", "destination_y"]),
  createMission
);
router.patch("/:id/status", requireAuth, requireFields(["status"]), updateMissionStatus);

module.exports = router;
