// One place that knows how to talk to the backend.
// Every page imports functions from here instead of calling fetch()
// directly, so the URL prefix and auth header only need to be handled once.

const BASE_URL = "/api";

function getToken() {
  return localStorage.getItem("fleet_token");
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // 204 No Content has no body to parse
  if (response.status === 204) return null;

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export const api = {
  // auth
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  // drones
  getDrones: () => request("/drones"),
  getDrone: (id) => request(`/drones/${id}`),
  createDrone: (body) => request("/drones", { method: "POST", body: JSON.stringify(body) }),
  updateDrone: (id, body) =>
    request(`/drones/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteDrone: (id) => request(`/drones/${id}`, { method: "DELETE" }),
  recallDrone: (id) => request(`/drones/${id}/recall`, { method: "POST" }),

  // missions
  getMissions: () => request("/missions"),
  getMissionsForDrone: (droneId) => request(`/missions/drone/${droneId}`),
  createMission: (body) => request("/missions", { method: "POST", body: JSON.stringify(body) }),
  updateMissionStatus: (id, status) =>
    request(`/missions/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // telemetry
  getTelemetry: (droneId) => request(`/telemetry/drone/${droneId}`),
};
