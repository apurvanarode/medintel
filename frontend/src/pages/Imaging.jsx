import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ScanLine, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";

export default function Imaging() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/api/imaging/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (err) {
      setError("Something went wrong analyzing this image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isPneumonia = result?.prediction === "PNEUMONIA";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ScanLine className="w-5 h-5 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Imaging Diagnosis</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Upload a chest X-ray for AI-assisted pneumonia screening with visual explainability.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        {!preview ? (
          <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
            <Upload className="w-8 h-8 text-slate-300 mb-3" />
            <span className="text-sm text-slate-500 font-medium">Click to upload a chest X-ray</span>
            <span className="text-xs text-slate-400 mt-1">JPG or PNG</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Original</p>
                <img src={preview} alt="Uploaded X-ray" className="w-full rounded-xl border border-slate-200" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                  {result ? "Model Attention Heatmap" : "Heatmap will appear here"}
                </p>
                <div className="w-full aspect-square rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {result ? (
                    <img
                      src={`data:image/png;base64,${result.heatmap_base64}`}
                      alt="Grad-CAM heatmap"
                      className="w-full h-full object-cover"
                    />
                  ) : loading ? (
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  ) : (
                    <span className="text-xs text-slate-300">Awaiting analysis</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleAnalyze}
                disabled={loading || result !== null}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Analyzing..." : result ? "Analyzed" : "Analyze X-ray"}
              </button>
              <button
                onClick={() => { setFile(null); setPreview(null); setResult(null); setError(null); }}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Upload different image
              </button>
            </div>

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-5 border rounded-xl p-5 ${
                    isPneumonia ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isPneumonia ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    <span className={`font-semibold ${isPneumonia ? "text-red-700" : "text-emerald-700"}`}>
                      {result.prediction} — {(result.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{result.interpretation}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}