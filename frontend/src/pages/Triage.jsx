import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, AlertTriangle, CheckCircle2, AlertCircle, Loader2, Stethoscope } from "lucide-react";
import { api } from "../api/client";

const urgencyConfig = {
  routine: {
    label: "Routine",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  urgent: {
    label: "Urgent",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertCircle,
  },
  emergency: {
    label: "Emergency",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertTriangle,
  },
};

export default function Triage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi, I'm here to help assess your symptoms. Please describe what you're experiencing." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setResult(null);

    try {
      const response = await api.post("/api/triage/analyze", {
        conversation: newMessages.map(m => ({ role: m.role, content: m.content })),
      });
      const data = response.data;

      if (data.needs_more_info) {
        setMessages([...newMessages, { role: "assistant", content: data.clarifying_question }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: "Thanks — here's my assessment based on what you've shared." }]);
        setResult(data);
      }
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong connecting to the triage service." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Stethoscope className="w-5 h-5 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-900">Triage Assistant</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Describe your symptoms in your own words. This tool provides urgency guidance — it is not a diagnosis.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-[420px] overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-700 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-slate-100 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-400">Analyzing...</span>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`border rounded-xl p-4 mt-2 ${urgencyConfig[result.urgency_level].bg} ${urgencyConfig[result.urgency_level].border}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const Icon = urgencyConfig[result.urgency_level].icon;
                    return <Icon className={`w-5 h-5 ${urgencyConfig[result.urgency_level].color}`} />;
                  })()}
                  <span className={`font-semibold ${urgencyConfig[result.urgency_level].color}`}>
                    {urgencyConfig[result.urgency_level].label}
                  </span>
                  {result.red_flag_triggered && (
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full ml-1">
                      Safety Override
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mb-2">{result.reasoning}</p>
                {result.extracted_symptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {result.extracted_symptoms.map((s, i) => (
                      <span key={i} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={scrollRef} />
        </div>

        <div className="border-t border-slate-200 p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your symptoms..."
            disabled={loading || result !== null}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || result !== null}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}