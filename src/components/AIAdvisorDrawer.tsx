import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Trash2,
  Zap,
} from "lucide-react";
import { Course, UserProfile } from "../types";

interface AIAdvisorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  topCourses: Course[];
  onViewDetails: (course: Course) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export const AIAdvisorDrawer: React.FC<AIAdvisorDrawerProps> = ({
  isOpen,
  onClose,
  userProfile,
  topCourses,
}) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"advisor" | "interview" | "skillgap">("advisor");
  const [modelMode, setModelMode] = useState<"standard" | "fast">("standard");

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "init",
      role: "model",
      content: `Hi ${userProfile.name?.split(" ")[0] || "there"}! Ask me about courses, skills, or interview prep for ${userProfile.career_goal || "your goal"}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  if (!isOpen) return null;

  const getSystemInstruction = () => {
    if (selectedRole === "interview") {
      return `You are a concise Technical Interview Coach for ${userProfile.career_goal}. Keep replies brief, structured, and actionable.`;
    }
    if (selectedRole === "skillgap") {
      return `You are a concise Skill Gap Strategist for ${userProfile.name || "a learner"} (${userProfile.skills || "foundational skills"} -> ${userProfile.career_goal || "Tech Career"}). Keep replies brief and practical.`;
    }
    return `You are CourseAI, a concise AI Academic Advisor for ${userProfile.name || "a learner"} targeting ${userProfile.career_goal || "a tech career"}. Keep answers short, personalized, and scannable.`;
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? input).trim();
    if (!textToSend || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: timeStr,
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    if (!customPrompt) {
      setInput("");
    }
    setLoading(true);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory
            .filter((m) => m.id !== "init" && m.id !== "reset")
            .map((m) => ({ role: m.role, content: m.content })),
          systemInstruction: getSystemInstruction(),
          userProfile,
          topCourses: topCourses.slice(0, 5),
          modelPreference: modelMode,
        }),
      });

      const data = await res.json();
      const botReply =
        data.reply ||
        data.error ||
        "Here is my recommendation based on your profile and learning goals.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: `Start with "${topCourses[0]?.title || "foundational courses"}" to build momentum toward ${userProfile.career_goal || "your career goal"}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "reset",
        role: "model",
        content: `Ready! How can I help with ${userProfile.career_goal || "your learning path"}?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const quickPrompts = ["Next course?", "Top skill gaps?", "3 project ideas", "Interview tips"];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end p-3 md:p-4"
      onClick={onClose}
    >
      <div
        className="clay-panel-xl w-full max-w-md h-full flex flex-col overflow-hidden p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="clay-card surface-brand p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="clay-icon-bubble w-9 h-9 text-[var(--cl-01-ink)]">
              <Bot className="w-4 h-4" strokeWidth={2.25} />
            </div>
            <h3 className="text-sm font-extrabold text-[var(--cl-01-ink)]">AI Advisor</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as "advisor" | "interview" | "skillgap")}
              aria-label="Advisor role"
              className="text-[11px] clay-inset px-2.5 py-1 text-[var(--cl-01-ink)] font-bold"
            >
              <option value="advisor">Advisor</option>
              <option value="interview">Interview</option>
              <option value="skillgap">Skills</option>
            </select>

            <button
              type="button"
              onClick={() => setModelMode(modelMode === "standard" ? "fast" : "standard")}
              className={`clay-btn p-2 rounded-full ${
                modelMode === "standard" ? "clay-btn-soft" : "clay-btn-mint"
              }`}
              title={modelMode === "standard" ? "Gemini 3.8 Flash" : "Gemini 3.1 Flash-Lite"}
            >
              {modelMode === "standard" ? (
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.25} />
              ) : (
                <Zap className="w-3.5 h-3.5" strokeWidth={2.25} />
              )}
            </button>

            <button
              type="button"
              onClick={handleClearChat}
              title="Reset"
              aria-label="Reset"
              className="clay-btn clay-btn-soft w-8 h-8 rounded-full flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="clay-btn clay-btn-soft w-8 h-8 rounded-full flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-2 overflow-y-auto space-y-3">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="clay-icon-bubble w-7 h-7 text-[var(--cl-01-ink)] shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" strokeWidth={2.25} />
                  </div>
                )}

                <div
                  className={`p-3.5 text-xs font-semibold leading-relaxed max-w-[85%] ${
                    isUser
                      ? "clay-card surface-brand text-[var(--cl-01-ink)]"
                      : "clay-card surface-neutral text-[var(--cl-01-ink)] whitespace-pre-line"
                  }`}
                >
                  {m.content}
                </div>

                {isUser && (
                  <div className="clay-icon-bubble w-7 h-7 text-[var(--cl-01-ink)] shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" strokeWidth={2.25} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="clay-tag badge-neutral px-3.5 py-1.5 flex items-center gap-2 text-xs font-bold text-[var(--cl-01-ink)] w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--cl-01-ink)]" strokeWidth={2.25} />
              <span>Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="clay-btn clay-btn-soft px-3 py-1 text-[11px] font-bold whitespace-nowrap shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 text-xs font-bold clay-inset p-3 text-[var(--cl-01-ink)] placeholder:text-[var(--cl-01-mut)]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="clay-btn clay-btn-primary p-3 rounded-full disabled:opacity-50"
          >
            <Send className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </form>
      </div>
    </div>
  );
};
