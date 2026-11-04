import React, { useState } from "react";
import { CheckCircle2, Circle, PlayCircle, Trash2, Trophy, ChevronDown } from "lucide-react";
import { Course, LearningCourse } from "../types";

interface MyLearningViewProps {
  enrolledCourses: LearningCourse[];
  savedCourses?: Course[];
  onUpdateProgress: (courseId: string, progress: number) => void;
  onMarkComplete: (courseId: string) => void;
  onRemoveFromLearning: (courseId: string) => void;
  onAddToLearning: (course: Course) => void;
  onViewDetails: (course: Course) => void;
  onToggleSave: (courseId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const MyLearningView: React.FC<MyLearningViewProps> = ({
  enrolledCourses,
  onUpdateProgress,
  onMarkComplete,
  onRemoveFromLearning,
  onViewDetails,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<"in_progress" | "completed">("in_progress");
  const [showAll, setShowAll] = useState(false);

  const inProgressList = enrolledCourses.filter((c) => c.status !== "completed");
  const completedList = enrolledCourses.filter((c) => c.status === "completed");

  const visibleInProgress = showAll ? inProgressList : inProgressList.slice(0, 4);
  const visibleCompleted = showAll ? completedList : completedList.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Minimal Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-[var(--cl-01-ink)] tracking-tight">Learning</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("in_progress");
              setShowAll(false);
            }}
            className={`clay-btn px-4 py-2 text-xs font-bold ${
              activeTab === "in_progress" ? "clay-btn-primary" : "clay-btn-soft"
            }`}
          >
            Active ({inProgressList.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("completed");
              setShowAll(false);
            }}
            className={`clay-btn px-4 py-2 text-xs font-bold ${
              activeTab === "completed" ? "clay-btn-primary" : "clay-btn-soft"
            }`}
          >
            Done ({completedList.length})
          </button>
        </div>
      </div>

      {/* 1. Active Section */}
      {activeTab === "in_progress" && (
        <div className="space-y-4">
          {inProgressList.length === 0 ? (
            <div className="clay-card p-10 text-center space-y-3">
              <span className="clay-icon-bubble w-12 h-12 mx-auto">
                <PlayCircle className="w-6 h-6 text-[var(--cl-01-ink)]" strokeWidth={2.25} />
              </span>
              <h3 className="text-base font-bold text-[var(--cl-01-ink)]">No active courses</h3>
              <button
                onClick={() => onNavigateTab("recommendations")}
                className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-bold"
              >
                Explore Matches
              </button>
            </div>
          ) : (
            <>
              {visibleInProgress.map((item) => (
                <div
                  key={item.course.course_id}
                  className="clay-card p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-bold inline-flex items-center gap-1">
                        <Circle className="w-3 h-3 text-[var(--cl-01-mut)]" strokeWidth={2.25} />
                        Not Completed
                      </span>
                      <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-bold">
                        {item.course.platform}
                      </span>
                      <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-semibold">
                        {item.course.duration}
                      </span>
                    </div>

                    <h3
                      onClick={() => onViewDetails(item.course)}
                      className="text-base font-bold text-[var(--cl-01-ink)] hover:opacity-80 cursor-pointer transition-opacity"
                    >
                      {item.course.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => onMarkComplete(item.course.course_id)}
                      className="clay-btn clay-btn-mint flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4" strokeWidth={2.25} />
                      <span>Mark Completed</span>
                    </button>

                    <button
                      onClick={() => onRemoveFromLearning(item.course.course_id)}
                      className="clay-btn clay-btn-soft p-2.5 text-[var(--cl-01-mut)] hover:text-[var(--status-error)]"
                      title="Remove"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2.25} />
                    </button>
                  </div>
                </div>
              ))}

              {inProgressList.length > 4 && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="clay-btn clay-btn-soft px-5 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>{showAll ? "Show less" : "Show more"}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`}
                      strokeWidth={2.25}
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 2. Completed Section */}
      {activeTab === "completed" && (
        <div className="space-y-4">
          {completedList.length === 0 ? (
            <div className="clay-card p-10 text-center space-y-3">
              <span className="clay-icon-bubble w-12 h-12 mx-auto">
                <Trophy className="w-6 h-6 text-[var(--status-warning)]" strokeWidth={2.25} />
              </span>
              <h3 className="text-base font-bold text-[var(--cl-01-ink)]">None completed yet</h3>
            </div>
          ) : (
            <>
              {visibleCompleted.map((item) => (
                <div
                  key={item.course.course_id}
                  className="clay-card p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="clay-tag badge-success px-2.5 py-0.5 text-[11px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" strokeWidth={2.25} />
                        Completed
                      </span>
                      <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-bold">
                        {item.course.platform}
                      </span>
                      <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-semibold">
                        {item.course.duration}
                      </span>
                    </div>

                    <h3
                      onClick={() => onViewDetails(item.course)}
                      className="text-base font-bold text-[var(--cl-01-ink)] hover:opacity-80 cursor-pointer truncate"
                    >
                      {item.course.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => onUpdateProgress(item.course.course_id, 0)}
                      className="clay-btn clay-btn-soft flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
                    >
                      <Circle className="w-3.5 h-3.5" strokeWidth={2.25} />
                      <span>Mark Incomplete</span>
                    </button>
                    <button
                      onClick={() => onRemoveFromLearning(item.course.course_id)}
                      className="clay-btn clay-btn-soft p-2 text-[var(--cl-01-mut)] hover:text-[var(--status-error)]"
                      title="Remove"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2.25} />
                    </button>
                  </div>
                </div>
              ))}

              {completedList.length > 4 && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="clay-btn clay-btn-soft px-5 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>{showAll ? "Show less" : "Show more"}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`}
                      strokeWidth={2.25}
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

