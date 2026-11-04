import React from "react";
import {
  Sparkles,
  Briefcase,
  ExternalLink,
  Scale,
  Compass,
  ArrowLeft,
} from "lucide-react";

interface DisclaimerViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const DisclaimerView: React.FC<DisclaimerViewProps> = ({ onNavigateTab }) => {
  const keyPoints = [
    {
      title: "Guidance Only",
      statement: "AI course matches are suggestions, not guarantees.",
      icon: Sparkles,
    },
    {
      title: "No Job Guarantee",
      statement: "Completing courses does not ensure employment or promotion.",
      icon: Briefcase,
    },
    {
      title: "Verify Details",
      statement: "Verify course syllabus and channel details on YouTube before starting.",
      icon: ExternalLink,
    },
    {
      title: "Not Formal Advice",
      statement: "This tool is for educational discovery, not formal career counseling.",
      icon: Scale,
    },
  ];

  return (
    <div className="space-y-7 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--cl-01-ink)] tracking-tight">
            Disclaimer
          </h2>
          <p className="text-xs font-semibold text-[var(--cl-01-mut)] mt-0.5">
            A tool to discover courses and plan your skill roadmap.
          </p>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab("dashboard")}
            className="clay-btn clay-btn-soft inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* 4 Short Bullet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {keyPoints.map((point) => {
          const Icon = point.icon;
          return (
            <div
              key={point.title}
              className="clay-card p-5 flex items-center gap-4"
            >
              <div className="clay-icon-bubble w-11 h-11 shrink-0">
                <Icon className="w-5 h-5 text-[var(--cl-01-ink)]" strokeWidth={2.25} />
              </div>

              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-[var(--cl-01-ink)]">{point.title}</h3>
                <p className="text-xs font-semibold text-[var(--cl-01-mut)] leading-snug">
                  {point.statement}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Single Closing Line */}
      <div className="clay-card surface-brand p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="clay-icon-bubble w-9 h-9 shrink-0">
            <Compass className="w-4 h-4 text-[var(--cl-01-ink)]" strokeWidth={2.25} />
          </div>
          <p className="text-xs sm:text-sm font-bold text-[var(--cl-01-ink)]">
            Our goal is to make your learning journey easier, not to promise the destination.
          </p>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab("recommendations")}
            className="clay-btn clay-btn-primary px-4 py-2 text-xs font-bold shrink-0"
          >
            For You
          </button>
        )}
      </div>
    </div>
  );
};
