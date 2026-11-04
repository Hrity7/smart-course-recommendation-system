import React, { useState } from "react";
import {
  Sliders,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Clock,
  Eye,
  User,
  Loader2,
  VideoOff,
} from "lucide-react";
import { Course, UserProfile } from "../types";

interface RecommendationsViewProps {
  recommendedCourses: Course[];
  userProfile: UserProfile;
  savedCourseIds: Set<string>;
  enrolledCourseIds: Set<string>;
  onRefreshRecommendations: () => void;
  onViewDetails: (course: Course) => void;
  onAddToLearning: (course: Course) => void;
  onToggleSave: (courseId: string) => void;
  onNavigateTab: (tab: string) => void;
  onChangeSkillLevel?: (level: "Beginner" | "Intermediate" | "Advanced") => void;
  onOpenProfileModal?: () => void;
  isLoading?: boolean;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  recommendedCourses,
  userProfile,
  enrolledCourseIds,
  onViewDetails,
  onAddToLearning,
  onNavigateTab,
  onOpenProfileModal,
  isLoading = false,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [loadingWhyIds, setLoadingWhyIds] = useState<Record<string, boolean>>({});

  const visibleCourses = showAll ? recommendedCourses : recommendedCourses.slice(0, 5);

  const handleToggleWhy = async (course: Course) => {
    const isCurrentlyExpanded = expandedId === course.course_id;
    if (isCurrentlyExpanded) {
      setExpandedId(null);
      return;
    }

    setExpandedId(course.course_id);

    if (aiExplanations[course.course_id] || loadingWhyIds[course.course_id]) {
      return;
    }

    setLoadingWhyIds((prev) => ({ ...prev, [course.course_id]: true }));
    try {
      const response = await fetch("/api/gemini/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, userProfile }),
      });
      const data = await response.json();
      if (data.explanation) {
        setAiExplanations((prev) => ({
          ...prev,
          [course.course_id]: data.explanation,
        }));
      } else {
        setAiExplanations((prev) => ({
          ...prev,
          [course.course_id]:
            course.why_recommended ||
            `This course is necessary to build core ${course.category} skills aligned with your ${userProfile.career_goal || "career"} path.`,
        }));
      }
    } catch {
      setAiExplanations((prev) => ({
        ...prev,
        [course.course_id]:
          course.why_recommended ||
          `This course is necessary to build core ${course.category} skills aligned with your ${userProfile.career_goal || "career"} path.`,
      }));
    } finally {
      setLoadingWhyIds((prev) => ({ ...prev, [course.course_id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with only Edit Profile and Weights options */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-extrabold text-[var(--cl-01-ink)] tracking-tight">
            For You
          </h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              title="Customize your profile settings to update YouTube recommendations"
              className="clay-btn clay-btn-soft flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
            >
              <User className="w-3.5 h-3.5" strokeWidth={2.25} />
              <span>Edit Profile</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab("settings")}
            title="Adjust algorithm weights"
            className="clay-btn clay-btn-soft flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
          >
            <Sliders className="w-3.5 h-3.5" strokeWidth={2.25} />
            <span>Weights</span>
          </button>
        </div>
      </div>

      {/* Top Ranked YouTube Courses */}
      {isLoading ? (
        <div className="clay-card p-12 text-center space-y-3">
          <Loader2
            className="w-8 h-8 animate-spin text-[var(--brand-primary)] mx-auto"
            strokeWidth={2.25}
          />
          <p className="text-sm font-bold text-[var(--cl-01-ink)]">
            Ranking genuine YouTube courses for your profile...
          </p>
        </div>
      ) : visibleCourses.length === 0 ? (
        <div className="clay-card p-10 text-center space-y-3">
          <span className="clay-icon-bubble w-12 h-12 mx-auto">
            <VideoOff className="w-6 h-6 text-[var(--cl-01-mut)]" strokeWidth={2.25} />
          </span>
          <p className="text-base font-bold text-[var(--cl-01-ink)]">
            No relevant courses found. Try a different search.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleCourses.map((course, index) => {
            const isExpanded = expandedId === course.course_id;
            const isEnrolled = enrolledCourseIds.has(course.course_id);
            const isTopPick = index === 0;
            const isLoadingWhy = !!loadingWhyIds[course.course_id];
            const aiWhyText = aiExplanations[course.course_id];
            const channelName =
              course.channel_title || course.instructor || "YouTube Educator";
            const viewsLabel =
              course.formatted_views ||
              (course.view_count && course.view_count > 0
                ? `${course.view_count.toLocaleString()} views`
                : "Views unavailable");
            const thumbUrl =
              course.thumbnail_url ||
              (course.video_id
                ? `https://i.ytimg.com/vi/${course.video_id}/hqdefault.jpg`
                : "");

            return (
              <div
                key={course.course_id}
                className={`clay-card clay-card-interactive ${
                  isTopPick ? "surface-brand" : ""
                } p-5 md:p-6 space-y-3`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Essentials: Rank, Thumbnail, Title, Channel, Tags */}
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    <span className="clay-icon-bubble w-9 h-9 text-xs font-bold shrink-0 text-[var(--cl-01-ink)]">
                      #{index + 1}
                    </span>

                    {thumbUrl && (
                      <div
                        onClick={() => onViewDetails(course)}
                        className="relative w-32 sm:w-40 aspect-video rounded-xl overflow-hidden bg-[var(--surface-inset)] shrink-0 cursor-pointer group"
                      >
                        <img
                          src={thumbUrl}
                          alt={course.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-950/85 text-white text-[10px] font-bold">
                          {course.duration}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-bold">
                          {course.category}
                        </span>
                        <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-semibold">
                          {course.difficulty}
                        </span>
                        <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-bold text-[var(--cl-01-ink)] inline-flex items-center gap-1">
                          <Eye
                            className="w-3 h-3 text-[var(--cl-01-mut)]"
                            strokeWidth={2.25}
                          />
                          <span>{viewsLabel}</span>
                        </span>
                        {course.recommendation_score && (
                          <span className="clay-tag badge-brand px-2.5 py-0.5 text-[11px] font-bold">
                            {course.recommendation_score}% Match
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => onViewDetails(course)}
                        className="text-base font-bold text-[var(--cl-01-ink)] hover:opacity-80 cursor-pointer transition-opacity line-clamp-1"
                      >
                        {course.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs font-semibold text-[var(--cl-01-mut)]">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5" strokeWidth={2.25} />
                          <span>{channelName}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" strokeWidth={2.25} />
                          <span>{course.duration}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                    <button
                      onClick={() => handleToggleWhy(course)}
                      title="Ask AI why this course is necessary for you"
                      className="clay-btn clay-btn-soft px-3.5 py-2 text-xs font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={2.25} />
                      <span>Why</span>
                    </button>

                    <button
                      onClick={() => onViewDetails(course)}
                      title="View course description and details"
                      className="clay-btn clay-btn-soft px-3.5 py-2 text-xs font-bold flex items-center gap-1"
                    >
                      <span>Description</span>
                    </button>

                    <a
                      href={course.course_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="clay-btn clay-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 no-underline"
                    >
                      <span>Watch on YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.25} />
                    </a>

                    <button
                      onClick={() => onAddToLearning(course)}
                      disabled={isEnrolled}
                      className={`clay-btn px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 ${
                        isEnrolled ? "clay-btn-mint cursor-default" : "clay-btn-soft"
                      }`}
                    >
                      {isEnrolled ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.25} />
                          <span>Tracking</span>
                        </>
                      ) : (
                        <span>+ Track</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Explanation: Why this course is necessary */}
                {isExpanded && (
                  <div className="clay-inset p-4 text-xs text-[var(--cl-01-ink)] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[var(--brand-primary)]">
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={2.25} />
                      <span>Why this course is necessary for you</span>
                    </div>
                    {isLoadingWhy ? (
                      <div className="flex items-center gap-2 text-[var(--cl-01-mut)] py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--brand-primary)]" />
                        <span>AI is analyzing why this course is necessary for your goals...</span>
                      </div>
                    ) : (
                      <p className="font-medium text-[var(--cl-01-ink)] leading-relaxed">
                        {aiWhyText || course.why_recommended}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Show More Toggle */}
      {!isLoading && recommendedCourses.length > 5 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="clay-btn clay-btn-soft px-6 py-2.5 text-xs font-bold flex items-center gap-1.5"
          >
            <span>
              {showAll ? "Show top 5" : `Show all (${recommendedCourses.length})`}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`}
              strokeWidth={2.25}
            />
          </button>
        </div>
      )}
    </div>
  );
};
