import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  RotateCcw, 
  Download, 
  Sparkles,
  Quote,
  ShieldCheck,
  Building,
  Target
} from "lucide-react";
import Header from "../components/Header";
import ScoreGauge from "../components/ScoreGauge";

export default function AnalysisSummary({ user, onSignOut }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve validated report passed from AnalyzeResume state
  const report = location.state?.report;

  const categories = [
    { label: "Skills Match (30%)", key: "skillsMatch", apiKey: "skills_score", color: "#3b82f6" },
    { label: "Experience & Projects (25%)", key: "experienceProjects", apiKey: "experience_score", color: "#818cf8" },
    { label: "Content Quality (20%)", key: "contentQuality", apiKey: "content_score", color: "#06b6d4" },
    { label: "Structure & Readability (15%)", key: "structureReadability", apiKey: "structure_score", color: "#10b981" },
    { label: "Completeness (10%)", key: "completeness", apiKey: "completeness_score", color: "#ec4899" },
  ];

  const overallScore = report?.overall_score ?? report?.overallScore ?? 0;
  const statusLabel = report?.status_label ?? report?.statusLabel ?? "Evaluated";
  const targetRole = report?.target_role ?? report?.targetRole ?? "Target Role";
  const targetCompany = report?.target_company ?? report?.targetCompany ?? null;
  const analysisType = report?.analysis_type ?? report?.analysisType ?? "general";
  const isJobMatch = analysisType === "job_match";

  const strengths = report?.strengths || [];
  const areasToImprove = report?.areas_to_improve || report?.areasToImprove || [];
  const missingSkills = report?.missing_skills || report?.missingSkills || [];
  const recommendations = report?.recommendations || [];
  const evidenceExcerpts = report?.evidence_excerpts || [];
  const jobMatch = report?.job_match || null;

  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header user={user} onSignOut={onSignOut} />

      <main className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 max-w-6xl mx-auto w-full">
        {/* Navigation Bar: Back to Dashboard */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <span className="text-xs text-slate-500">
            {formatDate(report?.analyzed_at || report?.date)}
          </span>
        </div>

        {report ? (
          /* Report Layout with Real AI Data */
          <div className="flex flex-col gap-6">
            {/* Title & Metadata Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#161f30] pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Analysis Summary
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                    {targetRole}
                  </span>
                  {targetCompany && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {targetCompany}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/40 border border-blue-500/30 text-blue-400">
                    {isJobMatch ? "Job Match Analysis" : "General Review"}
                  </span>
                </div>
              </div>
              <div className="text-xs text-emerald-400 font-semibold self-start sm:self-auto bg-emerald-950/30 border border-emerald-800/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Recorded to Supabase History</span>
              </div>
            </div>

            {/* Top Row: Overall Score & Category Scores */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Overall Score Card */}
              <div className="lg:col-span-4 bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
                <ScoreGauge score={overallScore} size={140} strokeWidth={10} />
                <span className="text-sm font-semibold text-white mt-4">Overall Advisory Score</span>
                <span className="mt-2 inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                  {statusLabel}
                </span>
                <p className="text-[11px] text-slate-500 mt-3 max-w-[200px] leading-relaxed">
                  Advisory feedback based on resume evidence. Does not predict hiring outcomes.
                </p>
              </div>

              {/* Category Scores Breakdown */}
              <div className="lg:col-span-8 bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <h3 className="text-sm font-semibold text-white tracking-tight mb-4">
                  Category Scores Breakdown
                </h3>
                <div className="flex flex-col gap-3.5">
                  {categories.map((cat) => {
                    const score = 
                      report.category_scores?.[cat.key] ?? 
                      report.categoryScores?.[cat.key] ?? 
                      report[cat.apiKey] ?? 
                      0;
                    return (
                      <div key={cat.key} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{cat.label}</span>
                          <span className="text-slate-400 font-semibold">{score}/100</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#161f30] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${score}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Middle Row: Strengths, Areas to Improve, Missing Skills & Job Match */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Strengths & Missing Skills */}
              <div className="flex flex-col gap-6">
                {/* Strengths Card */}
                <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Identified Strengths</span>
                  </div>
                  {strengths.length > 0 ? (
                    <ul className="flex flex-col gap-3 text-xs text-slate-300">
                      {strengths.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No specific strengths listed.</p>
                  )}
                </div>

                {/* Missing Skills Card */}
                <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex flex-col gap-3.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Missing or Insufficiently Evidenced Skills</span>
                  </div>
                  {missingSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {missingSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-[#141c2b] border border-slate-700/60 text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No missing skills noted.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Areas to Improve & Optional Job Match */}
              <div className="flex flex-col gap-6">
                {/* Areas to Improve Card */}
                <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Areas to Improve</span>
                  </div>
                  {areasToImprove.length > 0 ? (
                    <ul className="flex flex-col gap-3 text-xs text-slate-300">
                      {areasToImprove.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            !
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No critical improvement areas highlighted.</p>
                  )}
                </div>

                {/* Job Match Widget (if job_match analysis) */}
                {isJobMatch && jobMatch && (
                  <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full border-4 border-cyan-500 flex items-center justify-center text-sm font-extrabold text-white shrink-0">
                      {jobMatch.percentage}%
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {jobMatch.title || "Job Requirement Match"}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {jobMatch.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Actionable Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Actionable Recommendations</span>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                  {recommendations.map((rec, idx) => (
                    <li key={idx} className="p-3.5 rounded-xl bg-[#080c14] border border-[#161f30] flex items-start gap-2.5 leading-relaxed">
                      <span className="w-5 h-5 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Row 4: Evidence Excerpts */}
            {evidenceExcerpts.length > 0 && (
              <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Quote className="w-4 h-4 text-slate-400" />
                  <span>Verified Resume Evidence Excerpts</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {evidenceExcerpts.map((excerpt, idx) => (
                    <blockquote
                      key={idx}
                      className="p-3 rounded-xl bg-[#080c14] border-l-2 border-blue-500 border-r border-t border-b border-r-[#161f30] border-t-[#161f30] border-b-[#161f30] text-xs text-slate-300 font-mono italic"
                    >
                      "{excerpt}"
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#161f30]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/analyze")}
                  className="px-4 py-2.5 rounded-xl bg-[#161f30] hover:bg-[#1e293b] text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-blue-400" />
                  <span>Analyze Another Resume</span>
                </button>
                <Link
                  to="/dashboard"
                  className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-[#161f30] text-xs font-semibold text-slate-300 transition-colors"
                >
                  Return to Dashboard
                </Link>
              </div>

              <span className="text-[11px] text-slate-500">
                Advisory AI evaluation by Gemini • Powered by ResumeIQ
              </span>
            </div>
          </div>
        ) : (
          /* Ephemeral Notice when accessing route directly without active evaluation state */
          <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-10 sm:p-14 text-center max-w-xl mx-auto my-12 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#161f30] flex items-center justify-center text-slate-400 mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Active Evaluation Report in Session</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mb-6">
              Full AI evaluation reports are held temporarily in session state during evaluation and are not permanently retained in the database to safeguard your document privacy. Your overall scores have been saved to your dashboard score history.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/analyze")}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Analyze a Resume
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2.5 rounded-xl bg-[#161f30] hover:bg-[#1e293b] text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                View Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
