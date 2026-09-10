// The main landing page: a grid of every drone in the fleet, plus a
// quick summary bar of how many are in each status.

import { useEffect, useState } from "react";
import { api } from "../api/client";
import DroneCard from "../components/DroneCard";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { operator } = useAuth();
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [callSign, setCallSign] = useState("");
  const [model, setModel] = useState("");

  async function loadDrones() {
    try {
      const data = await api.getDrones();
      setDrones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDrones();
  }, []);

  async function handleAddDrone(e) {
    e.preventDefault();
    try {
      await api.createDrone({ call_sign: callSign, model });
      setCallSign("");
      setModel("");
      setShowForm(false);
      loadDrones();
    } catch (err) {
      setError(err.message);
    }
  }

  const counts = drones.reduce((acc, drone) => {
    acc[drone.status] = (acc[drone.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <p className="page-message">Loading fleet...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Fleet Dashboard</h1>
        {operator && (
          <button onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? "Cancel" : "+ Add Drone"}
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="summary-bar">
        {Object.entries(counts).map(([status, count]) => (
          <span key={status} className="summary-pill">
            {status.replace("_", " ")}: {count}
          </span>
        ))}
        {drones.length === 0 && <span>No drones yet</span>}
      </div>

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
          <button type="submit">Save</button>
        </form>
      )}

      <div className="drone-grid">
        {drones.map((drone) => (
          <DroneCard key={drone.id} drone={drone} />
        ))}
      </div>
    </div>
  );
}
