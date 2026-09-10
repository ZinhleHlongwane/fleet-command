// Wires together middleware and routes. Kept separate from server.js
// so tests could import the app without actually starting a listener.

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const droneRoutes = require("./routes/drones.routes");
const missionRoutes = require("./routes/missions.routes");
const telemetryRoutes = require("./routes/telemetry.routes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "fleet-command-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/drones", droneRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/telemetry", telemetryRoutes);

// 404 for anything that didn't match a route above
app.use((req, res) => {
  res.status(404).json({ error: "That endpoint doesn't exist" });
});

// Must be registered last - this is what catches errors thrown anywhere above
app.use(errorHandler);

module.exports = app;
