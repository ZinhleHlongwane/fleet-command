import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import DroneCard from "../components/DroneCard";
import StatusBadge from "../components/StatusBadge";
import FleetMap from "../components/FleetMap";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { operator } = useAuth();

  const [drones, setDrones] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [callSign, setCallSign] = useState("");
  const [model, setModel] = useState("");

  async function loadData() {
    try {
      const [droneData, missionData] = await Promise.all([
        api.getDrones(),
        api.getMissions(),
      ]);

      setDrones(droneData);
      setMissions(missionData);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddDrone(e) {
    e.preventDefault();

    try {
      await api.createDrone({
        call_sign: callSign,
        model,
      });

      setCallSign("");
      setModel("");
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const activeDrones = drones.filter(
    (drone) => drone.status === "active"
  );

  const idleDrones = drones.filter(
    (drone) => drone.status === "idle"
  );

  const activeMissions = missions.filter(
    (mission) => mission.status === "active"
  );

  if (loading) {
    return <p className="page-message">Loading fleet...</p>;
  }

  return (
    <div className="page dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">FLEET MANAGEMENT</p>
          <h1>Fleet Dashboard</h1>
          <p className="dashboard-subtitle">
            Monitor your drones and mission activity.
          </p>
        </div>

        {operator && (
          <button
            className="add-drone-button"
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? "Cancel" : "+ Add Drone"}
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <form onSubmit={handleAddDrone} className="inline-form">
          <input
            placeholder="Call sign (e.g. FALCON-3)"
            value={callSign}
            onChange={(e) => setCallSign(e.target.value)}
            required
          />

          <input
            placeholder="Model (e.g. Skyhawk X200)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
          />

          <button type="submit">Save Drone</button>
        </form>
      )}

      <section className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-label">Total Drones</span>
          <strong className="stat-value">{drones.length}</strong>
          <span className="stat-description">Registered in fleet</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Active Drones</span>
          <strong className="stat-value">{activeDrones.length}</strong>
          <span className="stat-description">Currently active</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Idle Drones</span>
          <strong className="stat-value">{idleDrones.length}</strong>
          <span className="stat-description">Available in fleet</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Active Missions</span>
          <strong className="stat-value">{activeMissions.length}</strong>
          <span className="stat-description">Currently in progress</span>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Fleet Overview</h2>
            <p>Your registered aircraft and current status.</p>
          </div>
          <span className="section-count">{drones.length} drones</span>
        </div>

        {drones.length === 0 ? (
          <p className="page-message">
            No drones registered yet. Add your first drone to get started.
          </p>
        ) : (
          <div className="drone-grid">
            {drones.map((drone) => (
              <DroneCard key={drone.id} drone={drone} />
            ))}
          </div>
        )}
      </section>

      <div className="dashboard-lower-grid">
  <FleetMap drones={drones} />

  <section className="dashboard-panel">
    <div className="section-heading">
      <div>
        <h2>Mission Tracking</h2>
        <p>Latest fleet mission activity.</p>
      </div>
      <Link to="/missions" className="section-link">
        View all
      </Link>
    </div>

    {missions.length === 0 ? (
      <p className="page-message">
        No missions have been dispatched yet.
      </p>
    ) : (
      <div className="mission-list">
        {missions.slice(0, 4).map((mission) => (
          <div className="mission-item" key={mission.id}>
            <div className="mission-info">
              <strong>{mission.title}</strong>
              <span>{mission.call_sign}</span>
              <span>
                Destination: ({mission.destination_x},{" "}
                {mission.destination_y})
              </span>
            </div>

            <StatusBadge status={mission.status} />
          </div>
        ))}
      </div>
    )}
  </section>
</div>
    </div>
  );
}
