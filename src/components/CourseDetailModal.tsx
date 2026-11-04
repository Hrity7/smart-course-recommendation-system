import React, { useState } from "react";
import {
  X,
  Clock,
  Bookmark,
  CheckCircle2,
  Sparkles,
  Loader2,
  ExternalLink,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import { Course, UserProfile } from "../types";

interface CourseDetailModalProps {
  course: Course | null;
  onClose: () => void;
  userProfile: UserProfile;
  onAddToLearning: (course: Course) => void;
  onToggleSave: (courseId: string) => void;
  isSaved?: boolean;
  isEnrolled?: boolean;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  onClose,
  userProfile,
  onAddToLearning,
  onToggleSave,
  isSaved = false,
  isEnrolled = false,
}) => {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  React.useEffect(() => {
    setAiExplanation(null);
  }, [course?.course_id]);

  if (!course) return null;

  const fetchLiveExplanation = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/gemini/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, userProfile }),
      });
      const data = await res.json();
      if (data.explanation) {
        setAiExplanation(data.explanation);
      }
    } catch (e) {
      console.error(e);
      setAiExplanation(
        `Matches your ${userProfile.career_goal} goal by covering ${course.skills}.`
      );
    } finally {
      setLoadingAi(false);
    }
  };

  const videoId = course.video_id || course.course_id;
  const embedUrl =
    course.embed_url || `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`;
  const channelName = course.channel_title || course.instructor || "YouTube Educator";
  const viewsLabel =
    course.formatted_views ||
    (course.view_count && course.view_count > 0
      ? `${course.view_count.toLocaleString()} views`
      : "Views unavailable");

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="clay-panel-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto flex flex-col p-6 md:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="clay-tag badge-neutral px-2.5 py-0.5 text-xs font-bold">
                YouTube
              </span>
              <span className="clay-tag badge-neutral px-2.5 py-0.5 text-xs font-semibold">
                {course.category}
              </span>
              <span className="clay-tag badge-brand px-2.5 py-0.5 text-xs font-bold">
                {course.difficulty}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[var(--cl-01-ink)] leading-snug">
              {course.title}
            </h2>
            <p className="text-xs font-semibold text-[var(--cl-01-mut)] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" strokeWidth={2.25} />
              <span>{channelName}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="clay-btn clay-btn-soft w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </div>

        {/* Embedded YouTube Player */}
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
          <iframe
            src={embedUrl}
            title={course.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-3 text-xs text-center">
          <div className="clay-card surface-neutral p-3">
            <span className="text-[var(--cl-01-mut)] font-semibold block">Views</span>
            <strong className="text-[var(--cl-01-ink)] font-bold inline-flex items-center gap-1 mt-0.5">
              <Eye className="w-3.5 h-3.5 text-[var(--brand-primary)]" strokeWidth={2.25} />
              <span>{viewsLabel}</span>
            </strong>
          </div>
          <div className="clay-card surface-neutral p-3">
            <span className="text-[var(--cl-01-mut)] font-semibold block">Duration</span>
            <strong className="text-[var(--cl-01-ink)] font-bold inline-flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[var(--cl-01-ink)]" strokeWidth={2.25} />
              <span>{course.duration || "Unavailable"}</span>
            </strong>
          </div>
          <div className="clay-card surface-neutral p-3">
            <span className="text-[var(--cl-01-mut)] font-semibold block">Published</span>
            <strong className="text-[var(--cl-01-ink)] font-bold inline-flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--cl-01-ink)]" strokeWidth={2.25} />
              <span>{course.published_at || "Unavailable"}</span>
            </strong>
          </div>
        </div>

        {/* Overview & Skills */}
        <div className="clay-inset p-4 space-y-2.5">
          <p className="text-xs font-semibold text-[var(--cl-01-ink)] leading-relaxed whitespace-pre-line">
            {course.description || "No description provided by the YouTube channel."}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {course.skills.split(",").map((skill) => (
              <span
                key={skill}
                className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-semibold text-[var(--cl-01-ink)]"
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>

        {/* AI Fit */}
        <div className="clay-card surface-brand p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--cl-01-ink)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--cl-01-ink)]" strokeWidth={2.25} />
              <span>Why Recommended</span>
            </div>
            <button
              onClick={fetchLiveExplanation}
              disabled={loadingAi}
              className="clay-btn clay-btn-soft px-3 py-1 text-[11px] font-bold flex items-center gap-1"
            >
              {loadingAi ? (
                <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.25} />
              ) : (
                <Sparkles className="w-3 h-3" strokeWidth={2.25} />
              )}
              <span>AI Insight</span>
            </button>
          </div>

          <p className="text-xs font-semibold text-[var(--cl-01-ink)] leading-relaxed">
            {aiExplanation ||
              course.why_recommended ||
              `Recommended for your ${userProfile.career_goal} learning path at the ${course.difficulty} level.`}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(course.course_id)}
              className={`clay-btn flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold ${
                isSaved ? "clay-btn-primary" : "clay-btn-soft"
              }`}
            >
              <Bookmark
                className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
                strokeWidth={2.25}
              />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>

            <button
              onClick={() => {
                onAddToLearning(course);
              }}
              disabled={isEnrolled}
              className={`clay-btn flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold ${
                isEnrolled ? "clay-btn-mint cursor-default" : "clay-btn-soft"
              }`}
            >
              {isEnrolled ? (
                <>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.25} />
                  <span>Tracking in Learning</span>
                </>
              ) : (
                <span>+ Track Progress</span>
              )}
            </button>
          </div>

          <a
            href={course.course_url}
            target="_blank"
            rel="noopener noreferrer"
            className="clay-btn clay-btn-primary flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold no-underline"
          >
            <span>Watch on YouTube</span>
            <ExternalLink className="w-4 h-4" strokeWidth={2.25} />
          </a>
        </div>
      </div>
    </div>
  );
};
