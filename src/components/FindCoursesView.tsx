import React, { useState } from "react";
import {
  RotateCcw,
  ChevronDown,
  Loader2,
  AlertCircle,
  VideoOff,
} from "lucide-react";
import { Course } from "../types";
import { CourseCard } from "./CourseCard";

interface FindCoursesViewProps {
  allCourses: Course[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteYouTubeSearch: (options: {
    query?: string;
    category?: string;
    skillLevel?: "All" | "Beginner" | "Intermediate" | "Advanced";
    forceRefresh?: boolean;
  }) => void;
  isLoading?: boolean;
  apiError?: string | null;
  savedCourseIds: Set<string>;
  enrolledCourseIds: Set<string>;
  onViewDetails: (course: Course) => void;
  onAddToLearning: (course: Course) => void;
  onToggleSave: (courseId: string) => void;
}

export const FindCoursesView: React.FC<FindCoursesViewProps> = ({
  allCourses,
  searchQuery,
  onSearchChange,
  onExecuteYouTubeSearch,
  isLoading = false,
  apiError = null,
  savedCourseIds,
  enrolledCourseIds,
  onViewDetails,
  onAddToLearning,
  onToggleSave,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "All" | "Beginner" | "Intermediate" | "Advanced"
  >("All");
  const [visibleCount, setVisibleCount] = useState(9);

  const categories = [
    "All",
    "Programming Languages",
    "Python",
    "Java",
    "JavaScript",
    "Artificial Intelligence",
    "Machine Learning",
    "Web Development",
    "Data Science",
    "Computer Science",
    "Cloud & DevOps",
    "Cybersecurity",
  ];

  const skillLevels: ("All" | "Beginner" | "Intermediate" | "Advanced")[] = [
    "All",
    "Beginner",
    "Intermediate",
    "Advanced",
  ];

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(9);
    onExecuteYouTubeSearch({
      query: searchQuery,
      category: cat,
      skillLevel: selectedDifficulty,
    });
  };

  const handleSkillLevelSelect = (level: "All" | "Beginner" | "Intermediate" | "Advanced") => {
    setSelectedDifficulty(level);
    setVisibleCount(9);
    onExecuteYouTubeSearch({
      query: searchQuery,
      category: selectedCategory,
      skillLevel: level,
    });
  };

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedDifficulty("All");
    onSearchChange("");
    setVisibleCount(9);
    onExecuteYouTubeSearch({
      query: "",
      category: "All",
      skillLevel: "All",
    });
  };

  const sortedCourses = [...allCourses]
    .filter((c) => {
      if (selectedDifficulty !== "All" && c.difficulty !== selectedDifficulty) {
        return false;
      }
      return true;
    })
    .sort((a, b) => (b.recommendation_score || 0) - (a.recommendation_score || 0));

  const displayedCourses = sortedCourses.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-[var(--cl-01-ink)] tracking-tight">
            Try something new?
          </h2>
          <span className="clay-tag badge-neutral px-3 py-1 text-xs font-bold">
            {sortedCourses.length} videos
          </span>
        </div>
      </div>

      {/* Skill Levels & Educational Categories */}
      <div className="clay-card p-5 space-y-4">
        {/* Skill Level Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[var(--cl-01-mut)] mr-1">Skill Level:</span>
            {skillLevels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => handleSkillLevelSelect(lvl)}
                className={`clay-btn px-3.5 py-1.5 text-xs font-bold ${
                  selectedDifficulty === lvl ? "clay-btn-primary" : "clay-btn-soft"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="clay-btn clay-btn-soft px-3.5 py-1.5 flex items-center gap-1.5 text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} />
            <span>Reset</span>
          </button>
        </div>

        {/* Subject Categories */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[var(--cl-01-mut)] block">
            Educational Categories:
          </span>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`clay-btn px-3.5 py-1.5 text-xs font-bold ${
                  selectedCategory === cat ? "clay-btn-primary" : "clay-btn-soft"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State Banner */}
      {apiError && (
        <div className="clay-card surface-error p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="w-5 h-5 text-[var(--status-error-ink)] shrink-0 mt-0.5"
              strokeWidth={2.25}
            />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[var(--status-error-ink)]">
                YouTube API Error
              </h3>
              <p className="text-xs font-semibold text-[var(--cl-01-ink)]">{apiError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onExecuteYouTubeSearch({
                query: searchQuery,
                category: selectedCategory,
                skillLevel: selectedDifficulty,
                forceRefresh: true,
              })
            }
            className="clay-btn clay-btn-primary px-4 py-2 text-xs font-bold shrink-0"
          >
            Retry Request
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="clay-card p-12 text-center space-y-3">
          <Loader2
            className="w-8 h-8 animate-spin text-[var(--brand-primary)] mx-auto"
            strokeWidth={2.25}
          />
          <p className="text-sm font-bold text-[var(--cl-01-ink)]">
            Retrieving genuine educational courses from YouTube...
          </p>
        </div>
      ) : sortedCourses.length === 0 ? (
        <div className="clay-card p-10 text-center space-y-3">
          <span className="clay-icon-bubble w-12 h-12 mx-auto">
            <VideoOff className="w-6 h-6 text-[var(--cl-01-mut)]" strokeWidth={2.25} />
          </span>
          <p className="text-base font-bold text-[var(--cl-01-ink)]">
            No relevant courses found. Try a different search.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="clay-btn clay-btn-primary px-5 py-2 text-xs font-bold"
          >
            Reset Search & Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.map((course) => (
              <CourseCard
                key={course.course_id}
                course={course}
                onViewDetails={onViewDetails}
                onAddToLearning={onAddToLearning}
                onToggleSave={onToggleSave}
                isSaved={savedCourseIds.has(course.course_id)}
                isEnrolled={enrolledCourseIds.has(course.course_id)}
                showScore={true}
              />
            ))}
          </div>

          {sortedCourses.length > 9 && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() =>
                  setVisibleCount(
                    visibleCount >= sortedCourses.length ? 9 : visibleCount + 9
                  )
                }
                className="clay-btn clay-btn-soft px-6 py-2.5 text-xs font-bold flex items-center gap-1.5"
              >
                <span>
                  {visibleCount >= sortedCourses.length
                    ? "Show less"
                    : `Show more (${sortedCourses.length - visibleCount})`}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    visibleCount >= sortedCourses.length ? "rotate-180" : ""
                  }`}
                  strokeWidth={2.25}
                />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
