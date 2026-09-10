// Lists every mission across the whole fleet, and lets a logged-in
// operator dispatch a new one by picking a drone and a destination.

import { useEffect, useState } from "react";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

export default function Missions() {
  const { operator } = useAuth();
  const [missions, setMissions] = useState([]);
  const [drones, setDrones] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [droneId, setDroneId] = useState("");
  const [title, setTitle] = useState("");
  const [destX, setDestX] = useState("");
  const [destY, setDestY] = useState("");

  async function loadData() {
    try {
      const [missionData, droneData] = await Promise.all([api.getMissions(), api.getDrones()]);
      setMissions(missionData);
      setDrones(droneData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.createMission({
        drone_id: Number(droneId),
        title,
        destination_x: Number(destX),
        destination_y: Number(destY),
      });
      setTitle("");
      setDestX("");
      setDestY("");
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await api.updateMissionStatus(id, status);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const availableDrones = drones.filter(
    (d) => d.status !== "maintenance" && d.status !== "offline"
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Missions</h1>
        {operator && (
          <button onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? "Cancel" : "+ Dispatch Mission"}
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="inline-form">
          <select value={droneId} onChange={(e) => setDroneId(e.target.value)} required>
            <option value="">Select a drone</option>
            {availableDrones.map((d) => (
              <option key={d.id} value={d.id}>
                {d.call_sign}
              </option>
            ))}
          </select>
          <input
            placeholder="Mission title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            placeholder="Destination X"
            type="number"
            value={destX}
            onChange={(e) => setDestX(e.target.value)}
            required
          />
          <input
            placeholder="Destination Y"
            type="number"
            value={destY}
            onChange={(e) => setDestY(e.target.value)}
            required
          />
          <button type="submit">Dispatch</button>
        </form>
      )}

      {missions.length === 0 ? (
        <p className="page-message">No missions have been dispatched yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Drone</th>
              <th>Title</th>
              <th>Destination</th>
              <th>Status</th>
              {operator && <th>Update</th>}
            </tr>
          </thead>
          <tbody>
            {missions.map((m) => (
              <tr key={m.id}>
                <td>{m.call_sign}</td>
                <td>{m.title}</td>
                <td>
                  ({m.destination_x}, {m.destination_y})
                </td>
                <td>
                  <StatusBadge status={m.status} />
                </td>
                {operator && (
                  <td>
                    <select
                      value={m.status}
                      onChange={(e) => handleStatusChange(m.id, e.target.value)}
                    >
                      <option value="planned">planned</option>
                      <option value="active">active</option>
                      <option value="completed">completed</option>
                      <option value="aborted">aborted</option>
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
