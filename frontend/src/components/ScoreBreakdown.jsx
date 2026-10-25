import React from "react";

export default function ScoreBreakdown({ breakdown = null }) {
  const categories = [
    {
      key: "skillsMatch",
      label: "Skills Match",
      score: breakdown?.skillsMatch ?? null,
      color: "#3b82f6", // Blue
    },
    {
      key: "experienceProjects",
      label: "Experience & Projects",
      score: breakdown?.experienceProjects ?? null,
      color: "#818cf8", // Indigo / Purple
    },
    {
      key: "contentQuality",
      label: "Content Quality",
      score: breakdown?.contentQuality ?? null,
      color: "#06b6d4", // Cyan
    },
    {
      key: "structureReadability",
      label: "Structure & Readability",
      score: breakdown?.structureReadability ?? null,
      color: "#10b981", // Emerald Green
    },
    {
      key: "completeness",
      label: "Completeness",
      score: breakdown?.completeness ?? null,
      color: "#ec4899", // Pink / Magenta
    },
  ];

  const hasData = breakdown !== null && breakdown !== undefined;

  return (
    <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <h3 className="text-base font-semibold text-white tracking-tight mb-5">
        Score Breakdown
      </h3>

      {hasData ? (
        <div className="flex flex-col gap-4">
          {categories.map((cat) => {
            const val = cat.score !== null ? cat.score : 0;
            return (
              <div key={cat.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{cat.label}</span>
                  <span className="text-slate-400 font-semibold">{val}/100</span>
                </div>
                {/* Progress bar container */}
                <div className="w-full h-2 rounded-full bg-[#161f30] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${val}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-slate-400">No score breakdown available</p>
          <p className="text-xs text-slate-500 mt-1">
            Scores for skills, experience, and formatting will appear after analysis.
          </p>
        </div>
      )}
    </div>
  );
}
