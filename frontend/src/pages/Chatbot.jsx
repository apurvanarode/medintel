import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquareHeart, Send, Loader2, ShieldAlert, FileText, ChevronDown } from "lucide-react";
import { api } from "../api/client";

export default function Chatbot() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.get("/api/chatbot/cases").then((res) => {
      setCases(res.data);
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSelectCase = (c) => {
    setSelectedCase(c);
    setMessages([
      { role: "assistant", content: `Hi! I can help answer questions about your discharge instructions for ${c.condition.toLowerCase()}. What would you like to know?` },
    ]);
    setShowSummary(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !selectedCase) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/api/chatbot/chat", {
        case_id: selectedCase.case_id,
        conversation: newMessages.map((m) => ({ role: m.role, content: m.content })),
      });
      const data = response.data;
      setMessages([...newMessages, { role: "assistant", content: data.answer, deferred: data.deferred_to_clinician }]);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
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
          <MessageSquareHeart className="w-5 h-5 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-900">Care Companion</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Ask questions about your discharge instructions, grounded in your actual care plan.
        </p>
      </div>

      {!selectedCase ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <p className="text-sm font-medium text-slate-500 mb-4">Select a sample patient case to begin:</p>
          <div className="space-y-3">
            {cases.map((c) => (
              <button
                key={c.case_id}
                onClick={() => handleSelectCase(c)}
                className="w-full text-left p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors"
              >
                <p className="font-semibold text-slate-900 text-sm">{c.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.condition}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{selectedCase.title}</p>
              <p className="text-xs text-slate-400">{selectedCase.condition}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg"
              >
                <FileText className="w-3.5 h-3.5" />
                Discharge Summary
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSummary ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Switch case
              </button>
            </div>
          </div>

          {showSummary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-slate-50 border-b border-slate-100 overflow-hidden"
            >
              <pre className="p-4 text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
                {selectedCase.summary}
              </pre>
            </motion.div>
          )}

          <div className="h-[380px] overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
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
                {msg.deferred && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <ShieldAlert className="w-3 h-3" />
                    Please confirm with your care team
                  </div>
                )}
              </motion.div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="border-t border-slate-200 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your discharge instructions..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}