import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import BatteryBadge from "../components/BatteryBadge";
import { useAuth } from "../context/AuthContext";

export default function DroneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { operator } = useAuth();

  const [drone, setDrone] = useState(null);
  const [missions, setMissions] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [error, setError] = useState("");

  async function loadAll() {
    try {
      const [droneData, missionData, telemetryData] = await Promise.all([
        api.getDrone(id),
        api.getMissionsForDrone(id),
        api.getTelemetry(id),
      ]);

      setDrone(droneData);
      setMissions(missionData);
      setTelemetry(telemetryData);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRecall() {
    try {
      await api.recallDrone(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Remove ${drone.call_sign} from the fleet? This can't be undone.`
      )
    ) {
      return;
    }

    try {
      await api.deleteDrone(id);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !drone) {
    return <p className="error-text">{error}</p>;
  }

  if (!drone) {
    return <p className="page-message">Loading drone...</p>;
  }

  return (
    <div className="page drone-detail-page">
      <div className="drone-detail-heading">
        <div>
          <p className="eyebrow">FLEET MANAGEMENT / AIRCRAFT</p>
          <Link to="/" className="back-link">
            ← Back to Fleet
          </Link>

          <div className="drone-title-row">
            <div>
              <h1>{drone.call_sign}</h1>
              <p className="dashboard-subtitle">{drone.model}</p>
            </div>
            <StatusBadge status={drone.status} />
          </div>
        </div>

        {operator && (
          <div className="drone-detail-actions">
            <button onClick={handleRecall}>
              Recall to Base
            </button>
            <button className="danger" onClick={handleDelete}>
              Remove Drone
            </button>
          </div>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="drone-detail-stats">
        <div className="drone-stat-card">
          <span className="stat-label">BATTERY LEVEL</span>
          <div className="drone-stat-value">
            <BatteryBadge percent={drone.battery_percent} />
          </div>
          <span className="stat-description">Current power level</span>
        </div>

        <div className="drone-stat-card">
          <span className="stat-label">CURRENT POSITION</span>
          <strong className="drone-stat-value">
            {Number(drone.pos_x).toFixed(2)},{" "}
            {Number(drone.pos_y).toFixed(2)}
          </strong>
          <span className="stat-description">Operational coordinates</span>
        </div>

        <div className="drone-stat-card">
          <span className="stat-label">HOME BASE</span>
          <strong className="drone-stat-value">
            {drone.home_base || "Not assigned"}
          </strong>
          <span className="stat-description">Registered base location</span>
        </div>

        <div className="drone-stat-card">
          <span className="stat-label">LAST SEEN</span>
          <strong className="drone-stat-value drone-last-seen">
            {drone.last_seen_at
              ? new Date(drone.last_seen_at).toLocaleString()
              : "Not available"}
          </strong>
          <span className="stat-description">Latest recorded contact</span>
        </div>
      </section>

      <section className="dashboard-panel drone-history-panel">
        <div className="section-heading">
          <div>
            <h2>Mission History</h2>
            <p>Previous missions assigned to this aircraft.</p>
          </div>
          <span className="section-count">
            {missions.length} missions
          </span>
        </div>

        {missions.length === 0 ? (
          <p className="page-message">
            No missions logged for this drone yet.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mission</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {missions.map((mission) => (
                  <tr key={mission.id}>
                    <td>{mission.title}</td>
                    <td>
                      ({mission.destination_x}, {mission.destination_y})
                    </td>
                    <td>
                      <StatusBadge status={mission.status} />
                    </td>
                    <td>
                      {new Date(mission.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-panel drone-history-panel">
        <div className="section-heading">
          <div>
            <h2>Recent Telemetry</h2>
            <p>Recorded battery and position readings.</p>
          </div>
          <span className="section-count">
            {telemetry.length} records
          </span>
        </div>

        {telemetry.length === 0 ? (
          <p className="page-message">
            No telemetry recorded yet.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recorded At</th>
                  <th>Battery</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {telemetry.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {new Date(record.recorded_at).toLocaleString()}
                    </td>
                    <td>{record.battery_percent}%</td>
                    <td>
                      ({record.pos_x}, {record.pos_y})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
