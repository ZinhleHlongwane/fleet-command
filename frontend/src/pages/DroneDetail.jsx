// Detail view for a single drone: its live stats, recent telemetry,
// and the mission history for that drone. Also where an operator
// can recall the drone or delete it from the fleet.

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    if (!confirm(`Remove ${drone.call_sign} from the fleet? This can't be undone.`)) return;
    try {
      await api.deleteDrone(id);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!drone) return <p className="page-message">Loading drone...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{drone.call_sign}</h1>
        <StatusBadge status={drone.status} />
      </div>

      <div className="detail-grid">
        <p>
          <strong>Model:</strong> {drone.model}
        </p>
        <p>
          <strong>Battery:</strong> <BatteryBadge percent={drone.battery_percent} />
        </p>
        <p>
          <strong>Position:</strong> ({drone.pos_x}, {drone.pos_y})
        </p>
        <p>
          <strong>Home base:</strong> {drone.home_base}
        </p>
        <p>
          <strong>Last seen:</strong> {new Date(drone.last_seen_at).toLocaleString()}
        </p>
      </div>

      {operator && (
        <div className="action-row">
          <button onClick={handleRecall}>Recall to Base</button>
          <button className="danger" onClick={handleDelete}>
            Remove Drone
          </button>
        </div>
      )}

      <h2>Mission History</h2>
      {missions.length === 0 ? (
        <p className="page-message">No missions logged for this drone yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((m) => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>
                  ({m.destination_x}, {m.destination_y})
                </td>
                <td>
                  <StatusBadge status={m.status} />
                </td>
                <td>{new Date(m.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Recent Telemetry</h2>
      {telemetry.length === 0 ? (
        <p className="page-message">No telemetry recorded yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Recorded At</th>
              <th>Battery</th>
              <th>Position</th>
            </tr>
          </thead>
          <tbody>
            {telemetry.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.recorded_at).toLocaleString()}</td>
                <td>{t.battery_percent}%</td>
                <td>
                  ({t.pos_x}, {t.pos_y})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
