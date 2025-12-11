import React from 'react';
import { PlayerStats } from '../types';

interface RadarChartProps {
  stats: PlayerStats;
  size?: number;
  color?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({ stats, size = 200, color = '#00f3ff' }) => {
  const center = size / 2;
  const radius = size / 2 - 40; // Padding for labels
  const angleSlice = (Math.PI * 2) / 6;

  // Order matches the visual clock-wise starting from top
  const keys: (keyof PlayerStats)[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
  const labels = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

  const getPoint = (value: number, index: number, scale = 1) => {
    const angle = index * angleSlice - Math.PI / 2; // Start at top
    const r = (value / 100) * radius * scale;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const points = keys.map((key, i) => {
    const { x, y } = getPoint(stats[key], i);
    return `${x},${y}`;
  }).join(' ');

  // Grid levels
  const levels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid */}
        {levels.map((level, lvlIdx) => {
           const levelPoints = keys.map((_, i) => {
               const {x, y} = getPoint(100, i, level);
               return `${x},${y}`;
           }).join(' ');
           
           return (
             <polygon
               key={lvlIdx}
               points={levelPoints}
               fill="none"
               stroke="rgba(255,255,255,0.1)"
               strokeWidth="1"
               strokeDasharray={lvlIdx === 3 ? "0" : "4 2"}
             />
           );
        })}

        {/* Axes */}
        {keys.map((_, i) => {
            const { x, y } = getPoint(100, i);
            return (
                <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                />
            );
        })}

        {/* Labels */}
        {labels.map((label, i) => {
            const { x, y } = getPoint(115, i); // Push labels out slightly
            return (
                <text
                    key={i}
                    x={x}
                    y={y}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontWeight="bold"
                >
                    {label}
                </text>
            );
        })}

        {/* Data Shape */}
        <polygon
          points={points}
          fill={color}
          fillOpacity="0.2"
          stroke={color}
          strokeWidth="2"
          className="drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]"
        />

        {/* Data Points */}
        {keys.map((key, i) => {
            const { x, y } = getPoint(stats[key], i);
            return (
                <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#fff"
                    stroke={color}
                    strokeWidth="1"
                />
            );
        })}
      </svg>
      
      {/* Central Rating (optional, calculating average) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <span className="text-xs font-mono text-white opacity-50">OVR</span>
          <div className="text-lg font-bold text-white font-display">
             {Math.round(keys.reduce((acc, k) => acc + stats[k], 0) / 6)}
          </div>
      </div>
    </div>
  );
};

export default RadarChart;