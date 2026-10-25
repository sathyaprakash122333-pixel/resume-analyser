import React, { useState } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";

export default function ScoreHistoryChart({ history = [] }) {
  const [filter, setFilter] = useState("Last 5 analyses");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const hasData = history && history.length > 0;

  // Chart configuration
  const width = 640;
  const height = 190;
  const paddingLeft = 40;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Y-axis grid marks
  const yTicks = [100, 80, 60, 40, 20, 0];

  // Map history data to chart coordinates
  const points = hasData
    ? history.map((item, index) => {
        const x =
          history.length === 1
            ? paddingLeft + chartWidth / 2
            : paddingLeft + (index / (history.length - 1)) * chartWidth;
        const y = paddingTop + chartHeight - (item.score / 100) * chartHeight;
        return { ...item, x, y };
      })
    : [];

  // Generate SVG path for line and area fill
  const linePath =
    points.length > 0
      ? points.reduce(
          (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
          ""
        )
      : "";

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${
          paddingTop + chartHeight
        } Z`
      : "";

  return (
    <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      {/* Header with Title and Filter Dropdown */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white tracking-tight">Score History</h3>
        <div className="relative">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-[#080c14] border border-[#1a2333] px-2.5 py-1.5 rounded-lg cursor-pointer hover:border-slate-700 transition-colors">
            <span>{filter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      {hasData ? (
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Horizontal Gridlines and Y-axis Labels */}
            {yTicks.map((tick) => {
              const y = paddingTop + chartHeight - (tick / 100) * chartHeight;
              return (
                <g key={tick}>
                  <text
                    x={paddingLeft - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#475569"
                    fontSize="11"
                    fontFamily="inherit"
                  >
                    {tick}
                  </text>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#141c2b"
                    strokeWidth="1"
                    strokeDasharray={tick === 0 ? "" : "3 3"}
                  />
                </g>
              );
            })}

            {/* Gradient definition for area fill */}
            <defs>
              <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#chartAreaGradient)" />}

            {/* Line Path */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Point Dots & X-axis Labels */}
            {points.map((pt, idx) => (
              <g key={idx} className="cursor-pointer">
                {/* Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint === idx ? 6 : 4}
                  fill="#06b6d4"
                  stroke="#0b0f17"
                  strokeWidth="2"
                  className="transition-all duration-200"
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* X-axis Date label */}
                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11"
                  fontFamily="inherit"
                >
                  {pt.date}
                </text>
              </g>
            ))}
          </svg>

          {/* Interactive Tooltip */}
          {hoveredPoint !== null && points[hoveredPoint] && (
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-md bg-[#161f30] border border-cyan-500/40 text-white text-xs font-semibold shadow-lg pointer-events-none transition-all"
              style={{
                left: `${(points[hoveredPoint].x / width) * 100}%`,
                top: `${(points[hoveredPoint].y / height) * 100 - 8}%`,
              }}
            >
              <span>{points[hoveredPoint].score}/100</span>
              <span className="text-[10px] text-slate-400 block font-normal">
                {points[hoveredPoint].date}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="py-14 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-[#161f30] flex items-center justify-center text-slate-500 mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-300">No score history recorded yet</p>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Complete your first resume analysis to begin visualizing your career improvement trajectory.
          </p>
        </div>
      )}
    </div>
  );
}
