import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import BatteryBadge from "./BatteryBadge";

export default function DroneCard({ drone }) {
  return (
    <Link to={`/drones/${drone.id}`} className="drone-card">
      <div className="drone-card-header">
        <h3>{drone.call_sign}</h3>
        <StatusBadge status={drone.status} />
      </div>
      <p className="drone-model">{drone.model}</p>
      <BatteryBadge percent={drone.battery_percent} />
      <p className="drone-position">
        Position: ({drone.pos_x}, {drone.pos_y})
      </p>
      <p className="drone-base">Base: {drone.home_base}</p>
    </Link>
  );
}
