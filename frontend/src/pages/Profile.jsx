import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User as UserIcon, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Key, 
  Edit3, 
  Check, 
  X, 
  LogOut, 
  Loader2,
  Info,
  Target,
  Building,
  Briefcase
} from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { updateUserProfile, logOut } from "../services/firebase";
import { 
  getUserProfile, 
  updateUserProfileApi, 
  getCareerTargets, 
  createCareerTarget, 
  updateCareerTarget 
} from "../services/api";

export default function Profile({ user, onSignOut }) {
  const navigate = useNavigate();

  // Profile data states
  const [backendProfile, setBackendProfile] = useState(null);
  const [careerTargets, setCareerTargets] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Editing state for display name
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [savingName, setSavingName] = useState(false);

  // Editing state for career target
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);

  const [statusMessage, setStatusMessage] = useState(null);

  const initial = (user?.displayName || user?.email || "U").charAt(0).toUpperCase();

  // Fetch Supabase profile & career targets
  useEffect(() => {
    let isMounted = true;
    async function fetchUserData() {
      if (!user) return;
      try {
        setLoadingProfile(true);
        const [profileRes, targetsRes] = await Promise.all([
          getUserProfile(user).catch((err) => {
            console.warn("Backend profile sync warning:", err);
            return null;
          }),
          getCareerTargets(user).catch((err) => {
            console.warn("Career targets fetch warning:", err);
            return [];
          }),
        ]);

        if (isMounted) {
          if (profileRes) {
            setBackendProfile(profileRes);
            if (profileRes.display_name) {
              setDisplayName(profileRes.display_name);
            }
          }
          if (Array.isArray(targetsRes) && targetsRes.length > 0) {
            setCareerTargets(targetsRes);
            const latest = targetsRes[0];
            setTargetRole(latest.target_role || "");
            setTargetCompany(latest.target_company || "");
          }
        }
      } catch (err) {
        console.error("Profile initialization error:", err);
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    }

    fetchUserData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle Display Name Update (Synchronized to Firebase Auth & Supabase PostgreSQL)
  const handleSaveDisplayName = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setStatusMessage({ type: "error", text: "Display name cannot be empty." });
      return;
    }

    try {
      setSavingName(true);
      setStatusMessage(null);
      
      // 1. Update Firebase Auth identity
      await updateUserProfile({ displayName: displayName.trim() });
      
      // 2. Update Supabase public.user_profiles
      const updated = await updateUserProfileApi(user, { display_name: displayName.trim() });
      setBackendProfile(updated);
      
      setStatusMessage({ type: "success", text: "Display name synchronized across Firebase and Supabase." });
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update display name:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSavingName(false);
    }
  };

  // Handle Career Target Save / Update
  const handleSaveTarget = async (e) => {
    e.preventDefault();
    if (!targetRole.trim()) {
      setStatusMessage({ type: "error", text: "Target job role cannot be empty." });
      return;
    }

    try {
      setSavingTarget(true);
      setStatusMessage(null);

      let savedTarget;
      if (careerTargets.length > 0 && careerTargets[0].id) {
        // Update existing target
        savedTarget = await updateCareerTarget(user, careerTargets[0].id, {
          target_role: targetRole.trim(),
          target_company: targetCompany.trim() || null,
          target_type: "job",
        });
        setCareerTargets([savedTarget, ...careerTargets.slice(1)]);
      } else {
        // Create new target
        savedTarget = await createCareerTarget(user, {
          target_role: targetRole.trim(),
          target_company: targetCompany.trim() || null,
          target_type: "job",
        });
        setCareerTargets([savedTarget]);
      }

      setStatusMessage({ type: "success", text: "Career target saved successfully to Supabase database." });
      setIsEditingTarget(false);
    } catch (err) {
      console.error("Failed to save career target:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to save career target." });
    } finally {
      setSavingTarget(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      if (onSignOut) onSignOut();
      navigate("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header user={user} onSignOut={onSignOut} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Main Profile Canvas */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 max-w-4xl mx-auto w-full">
          {/* Page Heading */}
          <div className="mb-8 border-b border-[#161f30] pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Profile & Career Target
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your verified Firebase identity and Supabase career goals.
            </p>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`mb-6 p-4 rounded-xl text-xs flex items-center justify-between gap-3 ${
                statusMessage.type === "success"
                  ? "bg-emerald-950/40 border border-emerald-800/60 text-emerald-300"
                  : "bg-red-950/40 border border-red-800/60 text-red-300"
              }`}
            >
              <span>{statusMessage.text}</span>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Profile Overview Card */}
          <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Circle */}
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User avatar"}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-500/40 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-blue-400/40 shrink-0">
                  {initial}
                </div>
              )}

              {/* User Identity Details */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {displayName || user?.displayName || "Unnamed Student"}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 self-center sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/40 border border-blue-500/30 text-blue-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Firebase Verified</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">{user?.email}</p>

                {/* Edit Display Name Form */}
                {isEditingName ? (
                  <form onSubmit={handleSaveDisplayName} className="flex items-center gap-2 max-w-sm">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter new display name"
                      className="flex-1 bg-[#080c14] border border-[#1e293b] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={savingName}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      title="Save name"
                    >
                      {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingName(false);
                        setDisplayName(user?.displayName || "");
                      }}
                      className="p-2 rounded-xl bg-[#161f30] hover:bg-[#1e293b] text-slate-300 text-xs cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit display name</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Career Target Card */}
          <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Target Career Role & Company
                </h3>
              </div>
              {!isEditingTarget && (
                <button
                  onClick={() => setIsEditingTarget(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{targetRole ? "Edit Target" : "Configure Target"}</span>
                </button>
              )}
            </div>

            {isEditingTarget ? (
              <form onSubmit={handleSaveTarget} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Target Job Role <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Python Backend Developer, Data Engineer"
                    className="w-full bg-[#080c14] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Target Organization / Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Google, Stripe, or leave blank"
                    className="w-full bg-[#080c14] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingTarget}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {savingTarget && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Save Target</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTarget(false)}
                    className="px-4 py-2 rounded-xl bg-[#161f30] hover:bg-[#1e293b] text-slate-300 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-3.5 rounded-xl bg-[#080c14] border border-[#161f30]">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    Primary Target Role
                  </span>
                  <span className="font-semibold text-slate-200">
                    {targetRole || <span className="text-slate-500 italic">No target role configured</span>}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#080c14] border border-[#161f30]">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    Target Company
                  </span>
                  <span className="font-semibold text-slate-200">
                    {targetCompany || <span className="text-slate-500 italic">No specific company set</span>}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Account Details & Metadata Grid */}
          <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
            <h3 className="text-sm font-semibold text-white tracking-tight mb-5">
              Account & Database Synchronization
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Email */}
              <div className="p-3.5 rounded-xl bg-[#080c14] border border-[#161f30] flex flex-col gap-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email Address
                </span>
                <span className="font-semibold text-slate-200 truncate">{user?.email || "N/A"}</span>
              </div>

              {/* Provider */}
              <div className="p-3.5 rounded-xl bg-[#080c14] border border-[#161f30] flex flex-col gap-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  Authentication Provider
                </span>
                <span className="font-semibold text-slate-200">Google OAuth (Firebase)</span>
              </div>

              {/* Created At */}
              <div className="p-3.5 rounded-xl bg-[#080c14] border border-[#161f30] flex flex-col gap-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Account Created
                </span>
                <span className="font-semibold text-slate-200">
                  {formatDate(backendProfile?.created_at || user?.metadata?.creationTime)}
                </span>
              </div>

              {/* Last Sync / Active */}
              <div className="p-3.5 rounded-xl bg-[#080c14] border border-[#161f30] flex flex-col gap-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Supabase Profile Sync
                </span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Synchronized with Supabase</span>
                </span>
              </div>

              {/* Firebase UID */}
              <div className="p-3.5 rounded-xl bg-[#080c14] border border-[#161f30] sm:col-span-2 flex flex-col gap-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  Firebase Unique Identifier (UID)
                </span>
                <span className="font-mono text-slate-300 select-all break-all">
                  {user?.uid || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-4 rounded-xl bg-[#080c14] border border-[#161f30] text-xs text-slate-400 flex items-start gap-3 mb-6">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white block mb-0.5">Data Privacy & Retention Policy:</strong>
              ResumeIQ does not store uploaded resume PDF files or full AI evaluations in Supabase. Only your career target and numeric scores are persisted in Supabase PostgreSQL to track your improvement history over time.
            </div>
          </div>

          {/* Account Actions / Sign Out */}
          <div className="bg-[#0b0f17] border border-[#161f30] rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Sign Out</h4>
              <p className="text-xs text-slate-400">End your current session on this device.</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl bg-red-950/30 border border-red-800/60 hover:bg-red-950/60 text-xs font-semibold text-red-300 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
