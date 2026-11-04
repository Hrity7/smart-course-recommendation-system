import React, { useState } from "react";
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Clock,
  Calendar,
  User,
} from "lucide-react";
import { Course } from "../types";

interface CourseCardProps {
  course: Course;
  onViewDetails: (course: Course) => void;
  onAddToLearning: (course: Course) => void;
  onToggleSave: (courseId: string) => void;
  isSaved?: boolean;
  isEnrolled?: boolean;
  showScore?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onViewDetails,
  onAddToLearning,
  onToggleSave,
  isSaved = false,
  isEnrolled = false,
  showScore = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  const channelName = course.channel_title || course.instructor || "YouTube Educator";
  const viewsLabel =
    course.formatted_views ||
    (course.view_count && course.view_count > 0
      ? `${course.view_count.toLocaleString()} views`
      : "Views unavailable");
  const thumbnailUrl =
    course.thumbnail_url ||
    (course.video_id ? `https://i.ytimg.com/vi/${course.video_id}/hqdefault.jpg` : "");

  return (
    <div className="clay-card clay-card-interactive p-5 flex flex-col justify-between gap-4">
      <div className="space-y-3">
        {/* YouTube Video Thumbnail + Duration Overlay + Description Trigger */}
        <div
          onClick={() => onViewDetails(course)}
          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[var(--surface-inset)] cursor-pointer group"
          title="Click to view course description and details"
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={course.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--cl-01-mut)]">
              Thumbnail unavailable
            </div>
          )}

          {/* Duration Badge */}
          <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-950/85 text-white text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={2.25} />
            <span>{course.duration || "Duration unavailable"}</span>
          </span>

          {/* Match Score Badge */}
          {showScore && course.recommendation_score && (
            <span className="absolute top-2.5 left-2.5 clay-tag badge-brand px-2.5 py-0.5 text-[11px] font-extrabold shadow-md">
              {course.recommendation_score}% Match
            </span>
          )}
        </div>

        {/* Tags Row: Category, Skill Level, Views */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-bold">
              {course.category}
            </span>
            <span className="clay-tag badge-brand px-2.5 py-0.5 text-[11px] font-semibold">
              {course.difficulty}
            </span>
          </div>

          <span
            className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-bold text-[var(--cl-01-ink)] inline-flex items-center gap-1"
            title={`${viewsLabel} · ${course.published_at || "Published on YouTube"}`}
          >
            <Eye className="w-3 h-3 text-[var(--cl-01-mut)]" strokeWidth={2.25} />
            <span>{viewsLabel}</span>
          </span>
        </div>

        {/* Video Title */}
        <h3
          onClick={() => onViewDetails(course)}
          title={course.title}
          className="text-base font-bold text-[var(--cl-01-ink)] hover:opacity-80 transition-opacity cursor-pointer line-clamp-2 leading-snug"
        >
          {course.title}
        </h3>

        {/* Channel Name & Publication Date */}
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--cl-01-mut)]">
          <span className="inline-flex items-center gap-1.5 truncate" title={channelName}>
            <User className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} />
            <span className="truncate">{channelName}</span>
          </span>
          {course.published_at && (
            <span className="inline-flex items-center gap-1 shrink-0 text-[11px]">
              <Calendar className="w-3 h-3" strokeWidth={2.25} />
              <span>{course.published_at}</span>
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-[var(--cl-01-mut)] line-clamp-2 leading-relaxed">
          {course.description || "Description unavailable for this video."}
        </p>
      </div>

      {/* Expandable Extra Details & Save */}
      {expanded && (
        <div className="clay-inset p-3.5 space-y-2 text-xs text-[var(--cl-01-ink)]">
          {course.why_recommended && (
            <p className="font-semibold leading-relaxed">{course.why_recommended}</p>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            {course.skills
              .split(",")
              .slice(0, 4)
              .map((skill) => (
                <span
                  key={skill}
                  className="clay-tag badge-neutral px-2 py-0.5 text-[10px] font-bold"
                >
                  {skill.trim()}
                </span>
              ))}
          </div>
          <div className="flex items-center justify-between pt-1.5">
            <button
              type="button"
              onClick={() => onAddToLearning(course)}
              disabled={isEnrolled}
              className={`clay-btn px-3 py-1 text-[11px] font-bold ${
                isEnrolled ? "clay-btn-mint cursor-default" : "clay-btn-soft"
              }`}
            >
              {isEnrolled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.25} />
                  <span>In Learning</span>
                </>
              ) : (
                <span>+ Track Progress</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onToggleSave(course.course_id)}
              className="text-[11px] font-bold text-[var(--cl-01-mut)] hover:text-[var(--cl-01-ink)] flex items-center gap-1"
              title={isSaved ? "Saved" : "Save course"}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  isSaved ? "fill-[var(--cl-01-ink)] text-[var(--cl-01-ink)]" : ""
                }`}
                strokeWidth={2.25}
              />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Row: Watch on YouTube + Expand */}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={course.course_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 clay-btn clay-btn-primary flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold no-underline"
          title={`Open "${course.title}" on YouTube`}
        >
          <span>Watch on YouTube</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} />
        </a>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Hide options" : "More options"}
          aria-label={expanded ? "Hide options" : "More options"}
          className="clay-btn clay-btn-soft w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[var(--cl-01-ink)]"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" strokeWidth={2.25} />
          ) : (
            <ChevronDown className="w-4 h-4" strokeWidth={2.25} />
          )}
        </button>
      </div>
    </div>
  );
};
