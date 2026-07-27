import { useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Users, Loader2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../api/client";

const riskColors = {
  high: { text: "text-red-700", bg: "bg-red-50", border: "border-red-200", bar: "#dc2626" },
  moderate: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", bar: "#d97706" },
  low: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", bar: "#059669" },
};

const defaultPatient = {
  patient_id: "P001",
  race: "Caucasian",
  gender: "Female",
  age: "[70-80)",
  admission_type_id: 1,
  discharge_disposition_id: 1,
  admission_source_id: 7,
  time_in_hospital: 8,
  num_lab_procedures: 60,
  num_procedures: 2,
  num_medications: 20,
  number_outpatient: 1,
  number_emergency: 2,
  number_inpatient: 3,
  number_diagnoses: 9,
  max_glu_serum: "None",
  A1Cresult: "None",
  insulin: "Up",
  change: "Ch",
  diabetesMed: "Yes",
};

export default function RiskPrediction() {
  const [tab, setTab] = useState("single");
  const [patient, setPatient] = useState(defaultPatient);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [queueLoading, setQueueLoading] = useState(false);
  const [queueResult, setQueueResult] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await api.post("/api/risk/predict", patient);
      setResult(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleField = (field, value) => {
    setPatient((prev) => ({ ...prev, [field]: value }));
  };

  const samplePatients = [
    { ...defaultPatient, patient_id: "P001" },
    { ...defaultPatient, patient_id: "P002", number_inpatient: 0, number_emergency: 0, time_in_hospital: 1, num_medications: 5 },
    { ...defaultPatient, patient_id: "P003", number_inpatient: 1, number_emergency: 1, time_in_hospital: 4, num_medications: 12 },
    { ...defaultPatient, patient_id: "P004", number_inpatient: 2, number_emergency: 3, time_in_hospital: 10, num_medications: 25 },
    { ...defaultPatient, patient_id: "P005", number_inpatient: 0, number_emergency: 0, time_in_hospital: 2, num_medications: 8 },
  ];

  const handleLoadQueue = async () => {
    setQueueLoading(true);
    try {
      const response = await api.post("/api/risk/prioritize", {
        patients: samplePatients,
        available_staff_slots: 3,
      });
      setQueueResult(response.data.prioritized_patients);
    } catch (err) {
      console.error(err);
    } finally {
      setQueueLoading(false);
    }
  };

  const chartData = result?.top_risk_factors.map((f) => ({
    name: f.feature.replace(/_/g, " "),
    impact: f.impact,
  })).reverse();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <LineChart className="w-5 h-5 text-amber-600" />
          <h1 className="text-2xl font-bold text-slate-900">Risk Prediction</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Predict 30-day readmission risk with explainable factors, and prioritize care team follow-ups.
        </p>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("single")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "single" ? "bg-slate-900 text-white" : "bg-white text-slate-500 border border-slate-200"
          }`}
        >
          Patient Risk Lookup
        </button>
        <button
          onClick={() => setTab("queue")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "queue" ? "bg-slate-900 text-white" : "bg-white text-slate-500 border border-slate-200"
          }`}
        >
          Care Team Queue
        </button>
      </div>

      {tab === "single" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div>
              <label className="text-xs text-slate-400 font-medium">Prior Inpatient Visits</label>
              <input type="number" value={patient.number_inpatient} onChange={(e) => handleField("number_inpatient", +e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Prior Emergency Visits</label>
              <input type="number" value={patient.number_emergency} onChange={(e) => handleField("number_emergency", +e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Days in Hospital</label>
              <input type="number" value={patient.time_in_hospital} onChange={(e) => handleField("time_in_hospital", +e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Number of Medications</label>
              <input type="number" value={patient.num_medications} onChange={(e) => handleField("num_medications", +e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 disabled:opacity-40 transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Calculating..." : "Predict Risk"}
          </button>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <div className={`border rounded-xl p-4 mb-5 ${riskColors[result.risk_level].bg} ${riskColors[result.risk_level].border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-5 h-5 ${riskColors[result.risk_level].text}`} />
                    <span className={`font-semibold capitalize ${riskColors[result.risk_level].text}`}>
                      {result.risk_level} Risk
                    </span>
                  </div>
                  <span className={`text-2xl font-bold ${riskColors[result.risk_level].text}`}>
                    {(result.risk_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                Top Factors Driving This Prediction (SHAP)
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.impact >= 0 ? "#dc2626" : "#059669"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-400 mt-2">
                Red bars increase readmission risk; green bars decrease it.
              </p>
            </motion.div>
          )}
        </div>
      )}

      {tab === "queue" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">5 patients · 3 follow-up slots available today</span>
            </div>
            <button
              onClick={handleLoadQueue}
              disabled={queueLoading}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-40 flex items-center gap-2"
            >
              {queueLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {queueLoading ? "Prioritizing..." : "Load & Prioritize Queue"}
            </button>
          </div>

          {queueResult && (
            <div className="space-y-2">
              {queueResult.map((p) => (
                <motion.div
                  key={p.patient_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    p.assigned ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      {p.priority_rank}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{p.patient_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${riskColors[p.risk_level].bg} ${riskColors[p.risk_level].text}`}>
                      {p.risk_level}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">{(p.risk_score * 100).toFixed(1)}%</span>
                    <span className={`text-xs font-medium ${p.assigned ? "text-emerald-600" : "text-slate-300"}`}>
                      {p.assigned ? "Assigned" : "Waitlisted"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}