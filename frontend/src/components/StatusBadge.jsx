// Small colored pill showing a drone or mission status.
// Kept as one shared component so the color mapping only lives in one place.

const STATUS_COLORS = {
  idle: "#6b7280",
  in_mission: "#2563eb",
  charging: "#f59e0b",
  maintenance: "#dc2626",
  offline: "#111827",
  planned: "#6b7280",
  active: "#2563eb",
  completed: "#16a34a",
  aborted: "#dc2626",
};

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "#6b7280";
  return (
    <span className="status-badge" style={{ backgroundColor: color }}>
      {status.replace("_", " ")}
    </span>
  );
}
