import React, { useState } from "react";
import { ChevronDown, Loader2, VideoOff } from "lucide-react";
import { Course } from "../types";
import { CourseCard } from "./CourseCard";

interface ExploreCoursesViewProps {
  allCourses: Course[];
  savedCourseIds: Set<string>;
  enrolledCourseIds: Set<string>;
  onViewDetails: (course: Course) => void;
  onAddToLearning: (course: Course) => void;
  onToggleSave: (courseId: string) => void;
  onSelectCategory?: (category: string) => void;
  isLoading?: boolean;
}

export const ExploreCoursesView: React.FC<ExploreCoursesViewProps> = ({
  allCourses,
  savedCourseIds,
  enrolledCourseIds,
  onViewDetails,
  onAddToLearning,
  onToggleSave,
  onSelectCategory,
  isLoading = false,
}) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);

  const categories = [
    "All",
    "Python",
    "Java",
    "Artificial Intelligence",
    "Machine Learning",
    "Web Development",
    "Data Science",
    "Computer Science",
    "Programming Languages",
    "Cloud & DevOps",
    "Cybersecurity",
  ];

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setVisibleCount(6);
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
  };

  const displayedCourses = allCourses.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-[var(--cl-01-ink)] tracking-tight">
          YouTube Course Catalog
        </h2>
        <span className="clay-tag badge-neutral px-3 py-1 text-xs font-bold">
          {allCourses.length} courses
        </span>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`clay-btn px-4 py-2 text-xs font-bold whitespace-nowrap ${
                isActive ? "clay-btn-primary" : "clay-btn-soft"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Course Cards Grid */}
      {isLoading ? (
        <div className="clay-card p-12 text-center space-y-3">
          <Loader2
            className="w-8 h-8 animate-spin text-[var(--brand-primary)] mx-auto"
            strokeWidth={2.25}
          />
          <p className="text-sm font-bold text-[var(--cl-01-ink)]">
            Loading {activeCategory === "All" ? "YouTube" : activeCategory} courses...
          </p>
        </div>
      ) : displayedCourses.length === 0 ? (
        <div className="clay-card p-10 text-center space-y-3">
          <span className="clay-icon-bubble w-12 h-12 mx-auto">
            <VideoOff className="w-6 h-6 text-[var(--cl-01-mut)]" strokeWidth={2.25} />
          </span>
          <p className="text-base font-bold text-[var(--cl-01-ink)]">
            No relevant courses found. Try a different search.
          </p>
        </div>
      ) : (
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
              showScore={false}
            />
          ))}
        </div>
      )}

      {!isLoading && allCourses.length > 6 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() =>
              setVisibleCount(
                visibleCount >= allCourses.length ? 6 : visibleCount + 6
              )
            }
            className="clay-btn clay-btn-soft px-6 py-2.5 text-xs font-bold flex items-center gap-1.5"
          >
            <span>
              {visibleCount >= allCourses.length
                ? "Show less"
                : `Show more (${allCourses.length - visibleCount})`}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                visibleCount >= allCourses.length ? "rotate-180" : ""
              }`}
              strokeWidth={2.25}
            />
          </button>
        </div>
      )}
    </div>
  );
};
