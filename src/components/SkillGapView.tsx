import React, { useState } from "react";
import { Sparkles, CheckCircle, AlertTriangle, Loader2, Check, Plus, ChevronDown } from "lucide-react";
import { Course, UserProfile } from "../types";
import { CourseCard } from "./CourseCard";

interface SkillGapViewProps {
  userProfile: UserProfile;
  allCourses: Course[];
  savedCourseIds: Set<string>;
  enrolledCourseIds: Set<string>;
  onViewDetails: (course: Course) => void;
  onAddToLearning: (course: Course) => void;
  onToggleSave: (courseId: string) => void;
  analysis: {
    careerGoal: string;
    required: string[];
    acquired: string[];
    missing: string[];
    readinessPercent: number;
    gapCourses: { skill: string; course: Course }[];
  };
}

export const SkillGapView: React.FC<SkillGapViewProps> = ({
  savedCourseIds,
  enrolledCourseIds,
  onViewDetails,
  onAddToLearning,
  onToggleSave,
  analysis,
}) => {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);

  const fetchAiAnalysis = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/gemini/skillgap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerGoal: analysis.careerGoal,
          acquiredSkills: analysis.acquired,
          missingSkills: analysis.missing,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiExplanation(data.analysis);
      }
    } catch (e) {
      console.error(e);
      setAiExplanation(
        `Focus on ${analysis.missing.slice(0, 3).join(", ")} first to meet standard ${
          analysis.careerGoal
        } benchmarks.`
      );
    } finally {
      setLoadingAi(false);
    }
  };

  const visibleGapCourses = showAllCourses
    ? analysis.gapCourses
    : analysis.gapCourses.slice(0, 3);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, analysis.readinessPercent) / 100) * circumference;

  return (
    <div className="space-y-7">
      {/* Header + SVG Readiness Ring */}
      <div className="clay-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Skill Gaps</h2>
          <span className="clay-tag badge-brand px-3 py-1 text-xs font-bold">
            {analysis.careerGoal}
          </span>
        </div>

        {/* Visual Readiness Ring */}
        <div
          className="flex items-center gap-3 clay-tag badge-neutral px-4 py-1.5"
          title="Role readiness score"
        >
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 56 56">
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke="var(--surface-inset)"
              strokeWidth="6"
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke="var(--brand-primary)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div>
            <div className="text-base font-bold text-[#0F172A]">
              {analysis.readinessPercent}%
            </div>
            <span className="text-[11px] font-semibold text-[#64748B]">Ready</span>
          </div>
        </div>
      </div>

      {/* Mastered (Semantic Success) vs Missing (Semantic Warning/Error) Tag Clouds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="clay-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#059669]" strokeWidth={2.25} />
              <span>Mastered ({analysis.acquired.length})</span>
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {analysis.acquired.length === 0 ? (
              <span className="text-xs font-semibold text-[#64748B]">None listed</span>
            ) : (
              analysis.acquired.map((s) => (
                <span
                  key={s}
                  className="clay-tag badge-success px-3 py-1 text-xs font-bold inline-flex items-center gap-1"
                >
                  <Check className="w-3 h-3" strokeWidth={2.25} />
                  <span>{s}</span>
                </span>
              ))
            )}
          </div>
        </div>

        <div className="clay-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" strokeWidth={2.25} />
              <span>Missing ({analysis.missing.length})</span>
            </h3>

            <button
              onClick={fetchAiAnalysis}
              disabled={loadingAi}
              className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5"
            >
              {loadingAi ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.25} />
              ) : (
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.25} />
              )}
              <span>AI Advice</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {analysis.missing.length === 0 ? (
              <span className="text-xs text-[#059669] font-bold">All complete</span>
            ) : (
              analysis.missing.map((s) => (
                <span
                  key={s}
                  className="clay-tag badge-error px-3 py-1 text-xs font-bold inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" strokeWidth={2.25} />
                  <span>{s}</span>
                </span>
              ))
            )}
          </div>

          {aiExplanation && (
            <div className="clay-inset p-3.5 text-xs font-semibold text-[#0F172A] leading-relaxed mt-2">
              {aiExplanation}
            </div>
          )}
        </div>
      </div>

      {/* Bridge Courses (Top 3 by default) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">Bridge Courses</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleGapCourses.map((item) => (
            <div key={item.skill} className="flex flex-col space-y-2">
              <span className="clay-tag badge-warning px-3 py-1 text-xs font-bold self-start">
                +{item.skill}
              </span>
              <div className="flex-1">
                <CourseCard
                  course={item.course}
                  onViewDetails={onViewDetails}
                  onAddToLearning={onAddToLearning}
                  onToggleSave={onToggleSave}
                  isSaved={savedCourseIds.has(item.course.course_id)}
                  isEnrolled={enrolledCourseIds.has(item.course.course_id)}
                  showScore={true}
                />
              </div>
            </div>
          ))}
        </div>

        {analysis.gapCourses.length > 3 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowAllCourses(!showAllCourses)}
              className="clay-btn clay-btn-soft px-5 py-2.5 text-xs font-bold flex items-center gap-1.5"
            >
              <span>{showAllCourses ? "Show less" : "Show more"}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showAllCourses ? "rotate-180" : ""}`}
                strokeWidth={2.25}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
