import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, AlertCircle } from "lucide-react";
import { askChatbot } from "../../api/client";

const SAMPLE_QUESTIONS = [
  "What are common dengue symptoms?",
  "How to prevent mosquito breeding?",
  "Hospital capacity alert thresholds",
  "Why is Western Province high risk?",
];

export const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "initial-1",
      sender: "bot",
      text: "Hello! I am your Dengue & Surveillance AI Assistant. You can ask me about symptoms, prevention, hospital bed capacity, and Sri Lanka outbreak trends.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await askChatbot(textToSend);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: response.reply,
        isBackend: response.isLiveBackend,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "I am having trouble answering right now. Please check if the Django backend server is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-300 animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400"></span>
          </div>
          <span className="font-semibold text-sm">Ask AI Assistant</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[400px] h-[540px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-emerald-800 dark:bg-emerald-900 text-white px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 dark:bg-emerald-800 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Dengue AI Guide</h3>
                <p className="text-[10px] text-emerald-200">Connected to RAG & Surveillance</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-emerald-700 text-white rounded-br-none"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm rounded-bl-none"
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.isBackend && (
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>RAG Django LLM Output</span>
                    </div>
                  )}
                </div>
                {msg.sender === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-slate-500 dark:text-slate-400 text-xs italic">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  <span className="ml-1">Synthesizing clinical evidence...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about symptoms, beds, weather..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-slate-800 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Disclaimer Footer */}
          <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1 text-center">
            <AlertCircle className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>AI-generated informational guidance. Not medical advice.</span>
          </div>

        </div>
      )}
    </div>
  );
};
