import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Bot, Clock, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { signInWithGoogle } from "../services/firebase";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      console.error("Sign in failed:", err);
      setError(err.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Logo */}
      <header className="w-full px-8 py-6 flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-400 flex items-center justify-center p-1.5 shadow-lg shadow-blue-500/20">
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
          <span className="text-xl font-bold tracking-tight text-white">ResumeIQ</span>
        </div>
      </header>

      {/* Main Content: Split Hero & Login Card */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 my-auto py-8">
        {/* Left Column: Brand & Features */}
        <div className="w-full lg:w-1/2 flex flex-col items-start max-w-lg">
          {/* Large Gradient Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-8 ring-1 ring-white/10">
            <svg
              className="w-9 h-9 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            ResumeIQ
          </h1>
          <h2 className="text-xl font-semibold text-blue-400 mb-4 tracking-wide">
            AI-Powered Resume Analysis
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Get personalized insights, improve your resume and take the next step in your career.
          </p>

          {/* Feature Highlights matching reference design */}
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-3.5 text-slate-300">
              <div className="w-9 h-9 rounded-full border border-slate-800 bg-[#0c1017] flex items-center justify-center text-blue-400 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">AI-powered feedback</span>
            </div>

            <div className="flex items-center gap-3.5 text-slate-300">
              <div className="w-9 h-9 rounded-full border border-slate-800 bg-[#0c1017] flex items-center justify-center text-blue-400 shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Find skill gaps</span>
            </div>

            <div className="flex items-center gap-3.5 text-slate-300">
              <div className="w-9 h-9 rounded-full border border-slate-800 bg-[#0c1017] flex items-center justify-center text-blue-400 shadow-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Track your progress</span>
            </div>
          </div>
        </div>

        {/* Right Column: Google Sign-in Card */}
        <div className="w-full lg:w-[420px]">
          <div className="bg-[#0b0f17] border border-[#1a2333] rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/80 flex flex-col items-center text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
            <p className="text-sm text-slate-400 mb-8">
              Sign in with your Google account to continue.
            </p>

            {/* Error Notification */}
            {error && (
              <div className="w-full mb-6 p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            {/* Google Authentication Button */}
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Official Google G Logo */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 18 18">
                    <path
                      fill="#4285F4"
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
                    />
                    <path
                      fill="#34A853"
                      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.039l3.007-2.332z"
                    />
                    <path
                      fill="#EA4335"
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
                    />
                  </svg>
                  <span className="text-sm font-semibold tracking-tight">Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="w-full flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-[#1e293b]" />
              <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-[#1e293b]" />
            </div>

            {/* Terms and Privacy Policy Footer */}
            <p className="text-xs text-slate-500 leading-relaxed">
              By continuing, you agree to our{" "}
              <a href="#terms" className="text-blue-400 hover:text-blue-300 transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      {/* Subtle bottom padding */}
      <footer className="w-full py-4 text-center text-xs text-slate-600">
        ResumeIQ © {new Date().getFullYear()} • AI-Powered Resume Analysis
      </footer>
    </div>
  );
}
