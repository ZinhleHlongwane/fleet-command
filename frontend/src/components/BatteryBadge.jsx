// Shows battery percent with a color that shifts from green to red
// as it drops, so low-battery drones are easy to spot at a glance.

export default function BatteryBadge({ percent }) {
  let color = "#16a34a";
  if (percent < 50) color = "#f59e0b";
  if (percent < 20) color = "#dc2626";

  return (
    <span className="battery-badge">
      <span className="battery-bar-track">
        <span
          className="battery-bar-fill"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </span>
      {percent}%
    </span>
  );
}
