import { Activity, ScanLine, LineChart, MessageSquareHeart, LayoutDashboard, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const modules = [
  {
    to: "/triage",
    icon: Activity,
    title: "Triage Assistant",
    desc: "NLP-powered symptom analysis and urgency classification.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    to: "/imaging",
    icon: ScanLine,
    title: "Imaging Diagnosis",
    desc: "Computer vision-assisted detection with explainable heatmaps.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    to: "/risk",
    icon: LineChart,
    title: "Risk Prediction",
    desc: "Readmission and deterioration risk scoring with SHAP explainability.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    to: "/chatbot",
    icon: MessageSquareHeart,
    title: "Care Companion",
    desc: "RAG-based patient chatbot grounded in discharge summaries.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    to: "/dashboard",
    icon: LayoutDashboard,
    title: "Ops Dashboard",
    desc: "Live view of triage queue, risk patients, and imaging backlog.",
    color: "bg-violet-50 text-violet-600",
  },
];

export default function Home() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to MedIntel</h1>
        <p className="text-slate-500 max-w-2xl">
          An AI-powered clinical decision and care management platform spanning triage,
          diagnostic imaging, risk prediction, patient communication, and operational oversight.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map(({ to, icon: Icon, title, desc, color }) => (
          <Link
            key={to}
            to={to}
            className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">{desc}</p>
            <div className="flex items-center text-sm font-medium text-slate-400 group-hover:text-emerald-600 transition-colors">
              Open module <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}