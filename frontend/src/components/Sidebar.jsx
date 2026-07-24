import { NavLink } from "react-router-dom";
import { Activity, ScanLine, LineChart, MessageSquareHeart, LayoutDashboard, HeartPulse } from "lucide-react";

const navItems = [
  { to: "/", label: "Overview", icon: HeartPulse, end: true },
  { to: "/triage", label: "Triage Assistant", icon: Activity },
  { to: "/imaging", label: "Imaging Diagnosis", icon: ScanLine },
  { to: "/risk", label: "Risk Prediction", icon: LineChart },
  { to: "/chatbot", label: "Care Companion", icon: MessageSquareHeart },
  { to: "/dashboard", label: "Ops Dashboard", icon: LayoutDashboard },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0">
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">MedIntel</h1>
            <p className="text-xs text-slate-500">Clinical AI Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-500">v0.1.0 — Portfolio Build</p>
      </div>
    </aside>
  );
}