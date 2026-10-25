import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Target, 
  ArrowUp, 
  Upload,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ScoreGauge from "../components/ScoreGauge";
import ScoreHistoryChart from "../components/ScoreHistoryChart";
import ScoreBreakdown from "../components/ScoreBreakdown";
import RecentAnalysesTable from "../components/RecentAnalysesTable";
import { getDashboardData } from "../services/api";

export default function Dashboard({ user, onSignOut }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardData(user);
      setDashboardData(data);
    } catch (err) {
      console.error("[Dashboard] Error fetching real metrics:", err);
      setError(err.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Student";
  const firstName = displayName.split(" ")[0];

  const handleAnalyzeClick = () => {
    navigate("/analyze");
  };

  // Safe accessor defaults
  const latestScore = dashboardData?.latest_score ?? null;
  const scoreDelta = dashboardData?.score_delta ?? null;
  const totalAnalyses = dashboardData?.total_analyses ?? 0;
  const targetRole = dashboardData?.current_target?.target_role || "Not configured";
  const targetCompany = dashboardData?.current_target?.target_company || "Set target in profile";
  const scoreHistory = dashboardData?.score_history || [];
  const recentAnalyses = dashboardData?.recent_analyses || [];
  const scoreBreakdown = dashboardData?.score_breakdown || null;

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header user={user} onSignOut={onSignOut} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Main Dashboard Canvas */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 max-w-[1440px] mx-auto w-full">
          {/* Greeting Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Good morning, {firstName}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Here's your real resume progress and longitudinal career insights.
              </p>
            </div>

            {/* Quick Action / Refresh Indicator */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchMetrics}
                disabled={loading}
                title="Refresh dashboard metrics"
                className="p-2 rounded-xl bg-[#0b0f17] border border-[#161f30] text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
              </button>
              <button
                onClick={handleAnalyzeClick}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Resume</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchMetrics}
                className="underline hover:text-white cursor-pointer font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State Skeleton Overlay */}
          {loading && !dashboardData && (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-300">Loading your career dashboard...</p>
              <p className="text-xs text-slate-500 mt-1">Connecting to Supabase PostgreSQL metrics</p>
            </div>
          )}

          {/* Dashboard Metrics Content */}
          {(!loading || dashboardData) && (
            <>
              {/* Row 1: Top 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                {/* 1. Latest Score Card */}
                <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Latest Score
                  </span>
                  <div className="flex items-center justify-center my-3">
                    <ScoreGauge score={latestScore} size={115} strokeWidth={9} />
                  </div>
                  <div className="text-center pt-2">
                    {latestScore !== null ? (
                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        {scoreDelta ? (
                          <>
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span>{scoreDelta}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">First analysis completed</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No evaluations completed yet</span>
                    )}
                  </div>
                </div>

                {/* 2. Total Analyses Card */}
                <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Total Analyses</span>
                  </div>
                  <div className="my-auto py-4">
                    <span className="text-5xl font-extrabold text-white tracking-tight">
                      {totalAnalyses}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">
                      {totalAnalyses === 1 ? "1 completed review" : `${totalAnalyses} completed reviews`}
                    </span>
                  </div>
                </div>

                {/* 3. Current Target Card */}
                <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Target className="w-4 h-4 text-slate-400" />
                    <span>Current Target</span>
                  </div>
                  <div className="my-auto py-4">
                    <p className="text-lg font-bold text-white tracking-tight leading-snug">
                      {targetRole}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">{targetCompany}</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Middle Section (2 Columns matching reference layout) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (7 of 12 columns): Score History & Recent Analyses */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <ScoreHistoryChart history={scoreHistory} />
                  <RecentAnalysesTable analyses={recentAnalyses} />
                </div>

                {/* Right Column (5 of 12 columns): Score Breakdown & Analyze Call to Action */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <ScoreBreakdown breakdown={scoreBreakdown} />

                  {/* Ready to analyze a new resume? Card */}
                  <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white tracking-tight mb-1">
                          Ready to analyze a new resume?
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Upload your resume and get AI-powered feedback against your target career.
                        </p>
                      </div>
                    </div>

                    <button
                      id="dashboard-analyze-cta"
                      onClick={handleAnalyzeClick}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg shadow-blue-600/25 cursor-pointer active:scale-[0.99]"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-semibold tracking-tight">Analyze Resume</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
