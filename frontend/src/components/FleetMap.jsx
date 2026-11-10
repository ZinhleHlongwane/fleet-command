
import { Link } from "react-router-dom";

export default function FleetMap({ drones = [] }) {
  const width = 900;
  const height = 440;
  const padding = 55;

  const positions = drones.map((drone) => ({
    ...drone,
    x: Number(drone.pos_x) || 0,
    y: Number(drone.pos_y) || 0,
  }));

  const xValues = positions.map((drone) => drone.x);
  const yValues = positions.map((drone) => drone.y);

  const minX = Math.min(0, ...xValues);
  const maxX = Math.max(0, ...xValues);
  const minY = Math.min(0, ...yValues);
  const maxY = Math.max(0, ...yValues);

  const rangeX = Math.max(maxX - minX, 20);
  const rangeY = Math.max(maxY - minY, 20);

  const scale = Math.min(
    (width - padding * 2) / rangeX,
    (height - padding * 2) / rangeY
  );

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  function getPosition(x, y) {
    return {
      x: width / 2 + (x - centerX) * scale,
      y: height / 2 - (y - centerY) * scale,
    };
  }

  const gridLines = Array.from({ length: 11 }, (_, index) => index);

  return (
    <section className="dashboard-panel fleet-map-panel">
      <div className="section-heading">
        <div>
          <h2>Live Fleet Map</h2>
          <p>Drone positions across the operational grid.</p>
        </div>

        <span className="map-live-indicator">
          <span />
          LIVE
        </span>
      </div>

      <div className="fleet-map">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Tactical map showing current drone positions"
        >
          <defs>
            <pattern
              id="map-grid"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 30 0 L 0 0 0 30"
                fill="none"
                stroke="#29436b"
                strokeWidth="0.8"
                opacity="0.55"
              />
            </pattern>

            <radialGradient id="map-glow">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect
            width={width}
            height={height}
            fill="#0b1730"
            rx="8"
          />

          <rect
            width={width}
            height={height}
            fill="url(#map-grid)"
            rx="8"
          />

          <circle
            cx={width / 2}
            cy={height / 2}
            r="190"
            fill="url(#map-glow)"
          />

          {gridLines.map((line) => {
            const x = padding + (line / 10) * (width - padding * 2);
            const y = padding + (line / 10) * (height - padding * 2);

            return (
              <g key={line}>
                <line
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={height - padding}
                  stroke="#29436b"
                  strokeWidth="1"
                  opacity="0.35"
                />
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#29436b"
                  strokeWidth="1"
                  opacity="0.35"
                />
              </g>
            );
          })}

          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="#3b82f6"
            strokeWidth="1"
            opacity="0.35"
            strokeDasharray="5 7"
          />

          <line
            x1={width / 2}
            y1={padding}
            x2={width / 2}
            y2={height - padding}
            stroke="#3b82f6"
            strokeWidth="1"
            opacity="0.35"
            strokeDasharray="5 7"
          />

          <text x="18" y="28" fill="#7793bd" fontSize="11">
            OPERATIONAL GRID
          </text>

          <text
            x={width - 18}
            y={28}
            textAnchor="end"
            fill="#7793bd"
            fontSize="11"
          >
            X / Y COORDINATES
          </text>

          {positions.map((drone) => {
            const point = getPosition(drone.x, drone.y);
            const isActive = drone.status === "active";

            return (
              <Link
                key={drone.id}
                to={`/drones/${drone.id}`}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="19"
                  fill="#2563eb"
                  opacity="0.13"
                />

                <circle
                  cx={point.x}
                  cy={point.y}
                  r="8"
                  fill={isActive ? "#22c55e" : "#60a5fa"}
                  stroke="#dbeafe"
                  strokeWidth="2"
                />

                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="#ffffff"
                />

                <text
                  x={point.x + 15}
                  y={point.y - 14}
                  fill="#e5efff"
                  fontSize="13"
                  fontWeight="600"
                >
                  {drone.call_sign}
                </text>

                <text
                  x={point.x + 15}
                  y={point.y + 5}
                  fill="#91a9ce"
                  fontSize="11"
                >
                  ({drone.x.toFixed(2)}, {drone.y.toFixed(2)})
                </text>
              </Link>
            );
          })}

          {positions.length === 0 && (
            <text
              x={width / 2}
              y={height / 2}
              fill="#91a9ce"
              fontSize="15"
              textAnchor="middle"
            >
              No drone positions available
            </text>
          )}
        </svg>
      </div>

      <div className="fleet-map-legend">
        <span>
          <i className="legend-dot active" />
          Active
        </span>
        <span>
          <i className="legend-dot idle" />
          Idle
        </span>
        <span>
          <i className="legend-dot other" />
          Other statuses
        </span>
      </div>
    </section>
  );
}
