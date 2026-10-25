import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { logOut } from "../services/firebase";

export default function Header({ user, onSignOut }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = async () => {
    try {
      await logOut();
      if (onSignOut) onSignOut();
      navigate("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Derive first name from display name or email
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Sathya";
  const firstName = displayName.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <header className="h-16 w-full bg-black border-b border-[#161f30] px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: ResumeIQ Brand (Clicking returns to Dashboard) */}
      <div 
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-400 flex items-center justify-center p-1 shadow-md shadow-blue-500/20">
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
        <span className="text-lg font-bold tracking-tight text-white">ResumeIQ</span>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#101622] transition-colors relative cursor-pointer"
          aria-label="Notifications"
          onClick={() => alert("No new notifications at this time.")}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full hover:bg-[#101622] transition-all cursor-pointer border border-transparent hover:border-[#1e293b]"
          >
            {/* Avatar Circle */}
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-blue-400/40">
                {initial}
              </div>
            )}

            {/* User Name */}
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
              {firstName}
            </span>

            {/* Down Chevron */}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0c1017] border border-[#1e293b] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2 border-b border-[#161f30] mb-1">
                <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || "Signed in with Google"}</p>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-[#161f30] transition-colors cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>My Profile</span>
              </button>

              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
