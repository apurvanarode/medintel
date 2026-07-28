import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Activity, ScanLine, LineChart as LineChartIcon, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { api } from "../api/client";

const RISK_COLORS = { low: "#059669", moderate: "#d97706", high: "#dc2626" };

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${tint} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/api/dashboard/summary").then((res) => setData(res.data));
  }, []);

  if (!data) {
    return <p className="text-slate-400 text-sm">Loading dashboard...</p>;
  }

  const { summary, triage_trend, imaging_trend, risk_distribution } = data;

  const formattedTriageTrend = triage_trend.map((d) => ({
    ...d,
    date: d.date.slice(5),
  }));
  const formattedImagingTrend = imaging_trend.map((d) => ({
    ...d,
    date: d.date.slice(5),
  }));

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard className="w-5 h-5 text-violet-600" />
          <h1 className="text-2xl font-bold text-slate-900">Operations Dashboard</h1>
        </div>
        <p className="text-slate-500 text-sm">Live view across triage, imaging, and risk prediction activity.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Activity} label="Total Triage Assessments" value={summary.total_triage_events} tint="bg-rose-50 text-rose-600" />
        <StatCard icon={ScanLine} label="Total Imaging Scans" value={summary.total_imaging_events} tint="bg-blue-50 text-blue-600" />
        <StatCard icon={LineChartIcon} label="Total Risk Assessments" value={summary.total_risk_events} tint="bg-amber-50 text-amber-600" />
        <StatCard icon={AlertTriangle} label="Emergencies (7d)" value={summary.emergency_count_7d} tint="bg-red-50 text-red-600" />
        <StatCard icon={ScanLine} label="Pneumonia Flags (7d)" value={summary.pneumonia_count_7d} tint="bg-blue-50 text-blue-600" />
        <StatCard icon={AlertTriangle} label="High-Risk Patients (7d)" value={summary.high_risk_count_7d} tint="bg-red-50 text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Triage Volume by Urgency (7d)</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={formattedTriageTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="routine" stroke="#059669" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="urgent" stroke="#d97706" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="emergency" stroke="#dc2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Imaging Results (7d)</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={formattedImagingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="normal" stackId="1" stroke="#059669" fill="#a7f3d0" />
              <Area type="monotone" dataKey="pneumonia" stackId="1" stroke="#dc2626" fill="#fecaca" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md">
        <p className="text-sm font-semibold text-slate-700 mb-4">Risk Level Distribution (7d)</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={risk_distribution}
              dataKey="count"
              nameKey="level"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
            >
              {risk_distribution.map((entry, i) => (
                <Cell key={i} fill={RISK_COLORS[entry.level] || "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}