import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FileUp, User } from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/dashboard" || location.pathname === "/",
    },
    {
      id: "analyze",
      label: "Analyze Resume",
      path: "/analyze",
      icon: FileUp,
      active: location.pathname === "/analyze",
    },
    {
      id: "profile",
      label: "Profile",
      path: "/profile",
      icon: User,
      active: location.pathname === "/profile",
    },
  ];

  return (
    <aside className="w-60 shrink-0 bg-black border-r border-[#161f30] min-h-[calc(100vh-65px)] p-4 flex flex-col justify-between select-none">
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                item.active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0c1017]"
              }`}
            >
              <Icon className={`w-4 h-4 ${item.active ? "text-white" : "text-slate-400"}`} />
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Version badge */}
      <div className="px-3 py-2 text-[11px] text-slate-600 border-t border-[#161f30]">
        ResumeIQ v1.0 • Verified
      </div>
    </aside>
  );
}
