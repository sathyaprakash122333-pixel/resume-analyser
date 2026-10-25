import React from "react";

export default function RecentAnalysesTable({ analyses = [] }) {
  const hasData = analyses && analyses.length > 0;

  const getScoreBadgeClass = (score) => {
    if (score >= 75) {
      return "border-emerald-500/40 text-emerald-400 bg-emerald-950/30";
    }
    if (score >= 70) {
      return "border-lime-500/40 text-lime-400 bg-lime-950/30";
    }
    if (score >= 60) {
      return "border-amber-500/40 text-amber-400 bg-amber-950/30";
    }
    return "border-rose-500/40 text-rose-400 bg-rose-950/30";
  };

  return (
    <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <h3 className="text-base font-semibold text-white tracking-tight mb-4">
        Recent Analyses
      </h3>

      {hasData ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-[#161f30] pb-2">
                <th className="py-2.5 font-medium">Date</th>
                <th className="py-2.5 font-medium">Target Role</th>
                <th className="py-2.5 font-medium">Type</th>
                <th className="py-2.5 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141b2a]">
              {analyses.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#0f1624] transition-colors">
                  <td className="py-3 text-slate-400 whitespace-nowrap">{row.date}</td>
                  <td className="py-3 text-slate-200 font-medium whitespace-nowrap">
                    {row.targetRole}
                  </td>
                  <td className="py-3 text-slate-400 whitespace-nowrap">{row.type}</td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold ${getScoreBadgeClass(
                        row.score
                      )}`}
                    >
                      {row.score}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-slate-400">No recent analyses found</p>
          <p className="text-xs text-slate-500 mt-1">
            Uploaded resumes and their evaluation records will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
