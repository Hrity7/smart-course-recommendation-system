import React, { useState } from "react";
import {
  LayoutDashboard,
  Search,
  Sparkles,
  BookOpen,
  GitMerge,
  MapPin,
  BarChart3,
  Settings,
  Bot,
  Info,
  X,
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAdvisor: () => void;
  geminiAvailable: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAdvisor,
  geminiAvailable,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "recommendations", label: "For You", icon: Sparkles },
    { id: "find_courses", label: "YouTube Courses", icon: Search },
    { id: "my_learning", label: "Learning", icon: BookOpen },
    { id: "roadmap", label: "Roadmap", icon: MapPin },
    { id: "skill_gap", label: "Skill Gaps", icon: GitMerge },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "disclaimer", label: "Disclaimer", icon: Info },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
  };

  if (isCollapsed) {
    return (
      <aside className="shrink-0 p-4 pr-0 flex flex-col items-start select-none transition-all duration-300">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-12 h-12 rounded-2xl clay-btn clay-btn-primary flex items-center justify-center text-white font-extrabold text-base shrink-0 cursor-pointer"
          title="Expand CourseAI Menu"
          aria-label="Expand CourseAI Menu"
        >
          C
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-60 shrink-0 p-4 pr-0 h-screen select-none transition-all duration-300">
      <div className="w-full h-full clay-panel-xl flex flex-col overflow-hidden">
        {/* Brand Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 rounded-2xl clay-btn clay-btn-primary flex items-center justify-center text-white font-extrabold text-base shrink-0 cursor-pointer"
              title="CourseAI Studio"
            >
              C
            </button>
            <span className="font-extrabold text-[var(--cl-01-ink)] tracking-tight text-lg">
              CourseAI
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="clay-btn clay-icon-bubble w-9 h-9 text-[var(--cl-01-ink)] cursor-pointer"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <X className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentTab === item.id || (item.id === "find_courses" && currentTab === "explore");
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[20px] text-sm font-bold transition-all text-left ${
                  isActive
                    ? "clay-btn-primary translate-x-1"
                    : "clay-btn-soft text-[var(--cl-01-mut)] hover:translate-x-0.5 hover:text-[var(--cl-01-ink)]"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[var(--surface-inset)] text-[var(--cl-01-ink)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* AI Advisor Button & Status Dot */}
        <div className="p-4">
          <button
            onClick={onOpenAdvisor}
            title={
              geminiAvailable
                ? "Gemini 3.8 Active · Hybrid ML + TF-IDF"
                : "Local AI Engine Active"
            }
            className="w-full clay-btn clay-btn-primary flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold"
          >
            <Bot className="w-4 h-4" strokeWidth={2.25} />
            <span>AI Advisor</span>
            <span
              className={`w-2 h-2 rounded-full ${
                geminiAvailable ? "bg-[var(--status-success)]" : "bg-[var(--status-warning)]"
              }`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
};
