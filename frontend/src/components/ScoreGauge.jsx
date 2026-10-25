import React from "react";

export default function ScoreGauge({ score = null, size = 110, strokeWidth = 9 }) {
  const isAvailable = score !== null && score !== undefined;
  const displayScore = isAvailable ? score : "--";
  const percentage = isAvailable ? Math.min(100, Math.max(0, score)) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#161f30"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Dynamic Score Ring */}
        {isAvailable && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#scoreGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Score Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold tracking-tight text-white leading-none">
          {displayScore}
        </span>
        <span className="text-xs text-slate-400 font-medium mt-1">/100</span>
      </div>
    </div>
  );
}
