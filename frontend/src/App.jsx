import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { subscribeToAuth } from "./services/firebase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AnalyzeResume from "./pages/AnalyzeResume";
import AnalysisSummary from "./pages/AnalysisSummary";
import Profile from "./pages/Profile";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Authentication state changes
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Dark loading screen while verifying Firebase session
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-400 flex items-center justify-center p-2.5 shadow-xl shadow-blue-500/20 mb-4 animate-pulse">
          <svg
            className="w-full h-full text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M10 13l2 2 4-4" />
          </svg>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span>Initializing ResumeIQ...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard user={user} onSignOut={() => setUser(null)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected Analyze Resume Route */}
        <Route
          path="/analyze"
          element={
            user ? (
              <AnalyzeResume user={user} onSignOut={() => setUser(null)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected Analysis Summary Route (Not in sidebar) */}
        <Route
          path="/analysis/:analysisId"
          element={
            user ? (
              <AnalysisSummary user={user} onSignOut={() => setUser(null)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected Profile Route */}
        <Route
          path="/profile"
          element={
            user ? (
              <Profile user={user} onSignOut={() => setUser(null)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all redirect */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
