const express = require("express");
const {
  getAllDrones,
  getDroneById,
  createDrone,
  updateDrone,
  deleteDrone,
  recallDrone,
} = require("../controllers/drones.controller");
const requireFields = require("../middleware/validate");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Reading the fleet is public (handy for a read-only status board);
// changing anything requires a logged-in operator.
router.get("/", getAllDrones);
router.get("/:id", getDroneById);
router.post("/", requireAuth, requireFields(["call_sign", "model"]), createDrone);
router.patch("/:id", requireAuth, updateDrone);
router.delete("/:id", requireAuth, deleteDrone);
router.post("/:id/recall", requireAuth, recallDrone);

module.exports = router;
