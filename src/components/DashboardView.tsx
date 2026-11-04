import React from "react";
import {
  Sparkles,
  BookCheck,
  Clock,
  RefreshCw,
  ExternalLink,
  User,
  Award,
  TrendingUp,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { Course, UserProfile, LearningCourse } from "../types";
import { AnalyticsView } from "./AnalyticsView";

interface DashboardViewProps {
  userProfile: UserProfile;
  recommendedCourses: Course[];
  enrolledCourses: LearningCourse[];
  savedCourseIds: Set<string>;
  onRefreshRecommendations: () => void;
  onViewDetails: (course: Course) => void;
  onAddToLearning: (course: Course) => void;
  onToggleSave: (courseId: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenProfileModal?: () => void;
  isLoading?: boolean;
  skillAnalysis?: {
    careerGoal: string;
    required: string[];
    acquired: string[];
    missing: string[];
    readinessPercent: number;
  };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  recommendedCourses,
  enrolledCourses,
  onRefreshRecommendations,
  onViewDetails,
  onAddToLearning,
  onNavigateTab,
  isLoading = false,
  skillAnalysis,
}) => {
  const firstName = userProfile.name?.split(" ")[0] || "Learner";
  const careerGoal = userProfile.career_goal || "your career goal";

  const completedCourses = enrolledCourses.filter((c) => c.status === "completed");
  const inProgressCourses = enrolledCourses.filter((c) => c.status === "in_progress");
  const completedCount = completedCourses.length;
  const inProgressCount = inProgressCourses.length;

  const totalHoursSpent = enrolledCourses.reduce(
    (sum, c) => sum + c.course.duration_hours * (c.progress_percent / 100),
    0
  );

  const overallCompletionPct =
    enrolledCourses.length > 0
      ? Math.round(
          enrolledCourses.reduce((sum, c) => sum + c.progress_percent, 0) /
            enrolledCourses.length
        )
      : 0;

  const weeklyProgressPct = Math.min(
    100,
    Math.round((totalHoursSpent / Math.max(1, userProfile.weekly_hours || 10)) * 100)
  );

  const activeCourse = inProgressCourses[0]?.course || completedCourses[0]?.course || recommendedCourses[0];

  // Positive, encouraging message tailored to their course and accomplishments
  const getPositiveAccomplishmentLine = () => {
    if (completedCount > 0 && inProgressCount > 0) {
      return `You've already completed ${completedCount} ${
        completedCount === 1 ? "course" : "courses"
      } (${totalHoursSpent.toFixed(1)} hours of learning) and are making great strides in "${
        inProgressCourses[0].course.title
      }" on your journey to becoming a ${careerGoal}!`;
    }
    if (completedCount > 0) {
      return `Amazing dedication! You have completed ${completedCount} ${
        completedCount === 1 ? "course" : "courses"
      } and invested ${totalHoursSpent.toFixed(
        1
      )} hours building real-world skills toward your goal as a ${careerGoal}.`;
    }
    if (inProgressCount > 0) {
      const current = inProgressCourses[0];
      return `You're doing great work on "${current.course.title}" — you've already accomplished ${
        current.progress_percent
      }% of this course (${totalHoursSpent.toFixed(
        1
      )} hours logged) toward mastering ${careerGoal}. Keep the momentum going!`;
    }
    if (activeCourse) {
      return `Every expert ${careerGoal} started with a single step. Your personalized learning path is ready with "${activeCourse.title}" — every hour you invest brings you closer to mastery!`;
    }
    return `Welcome to your learning space! Every step you take builds lasting skills toward becoming a confident ${careerGoal}.`;
  };

  return (
    <div className="space-y-8">
      {/* Header Row: Short Greeting + Refresh Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-2xl font-extrabold text-[var(--cl-01-ink)] tracking-tight">
            Hi, {firstName}
          </h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onRefreshRecommendations}
            disabled={isLoading}
            title="Refresh overview"
            aria-label="Refresh overview"
            className="clay-btn clay-btn-soft p-2.5 rounded-full text-[var(--cl-01-ink)]"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              strokeWidth={2.25}
            />
          </button>
        </div>
      </div>

      {/* Hero Greeting & Positive Accomplishment Card */}
      <div className="clay-panel-xl surface-brand p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 clay-tag badge-brand px-3 py-1 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.25} />
              <span>Your Learning Accomplishment</span>
            </div>

            <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-[var(--cl-01-ink)] leading-snug">
              {completedCount > 0
                ? `Proud of your progress, ${firstName}! You're turning consistency into mastery.`
                : inProgressCount > 0
                ? `Keep going strong, ${firstName}! Every lesson moves you forward.`
                : `Welcome back, ${firstName}! Today is a great day to build new skills.`}
            </h3>

            <p className="text-sm md:text-base font-medium text-[var(--cl-01-ink)] opacity-90 leading-relaxed">
              {getPositiveAccomplishmentLine()}
            </p>
          </div>

          <div className="clay-card p-5 shrink-0 flex flex-col items-center justify-center min-w-[170px] text-center">
            <span className="clay-icon-bubble w-11 h-11 badge-success mb-2">
              <Award className="w-5 h-5 text-[var(--status-success-ink)]" strokeWidth={2.25} />
            </span>
            <div className="text-2xl font-extrabold text-[var(--cl-01-ink)]">
              {overallCompletionPct}%
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--cl-01-mut)] mt-0.5">
              Overall Accomplished
            </span>
          </div>
        </div>

        {/* Overall Course Accomplishment Bar */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--cl-01-ink)]">
            <span>
              {enrolledCourses.length > 0
                ? `${completedCount} of ${enrolledCourses.length} tracked ${
                    enrolledCourses.length === 1 ? "course" : "courses"
                  } completed`
                : "Start tracking a course in 'For You' to measure your milestones"}
            </span>
            <span>{totalHoursSpent.toFixed(1)} hrs accomplished</span>
          </div>
          <div className="clay-progress-track h-3">
            <div
              className="clay-progress-fill transition-all duration-500"
              style={{ width: `${Math.max(6, overallCompletionPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Accomplishment KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigateTab("my_learning")}
          className="clay-card clay-card-interactive p-5 flex items-center justify-between cursor-pointer"
          title="View completed and active courses"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--cl-01-mut)]">
              Courses Completed
            </span>
            <div className="text-2xl font-extrabold text-[var(--status-success-ink)] mt-0.5">
              {completedCount}
              <span className="text-xs font-semibold text-[var(--cl-01-mut)] ml-1.5">
                / {enrolledCourses.length} tracked
              </span>
            </div>
          </div>
          <span className="clay-icon-bubble w-11 h-11 badge-success">
            <BookCheck className="w-5 h-5 text-[var(--status-success-ink)]" strokeWidth={2.25} />
          </span>
        </div>

        <div
          onClick={() => onNavigateTab("my_learning")}
          className="clay-card clay-card-interactive p-5 flex items-center justify-between cursor-pointer"
          title="Courses currently in progress"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--cl-01-mut)]">
              In Progress
            </span>
            <div className="text-2xl font-extrabold text-[var(--cl-01-ink)] mt-0.5">
              {inProgressCount}
              <span className="text-xs font-semibold text-[var(--cl-01-mut)] ml-1.5">
                active {inProgressCount === 1 ? "course" : "courses"}
              </span>
            </div>
          </div>
          <span className="clay-icon-bubble w-11 h-11">
            <TrendingUp className="w-5 h-5 text-[var(--brand-primary)]" strokeWidth={2.25} />
          </span>
        </div>

        <div
          onClick={() => onNavigateTab("analytics")}
          className="clay-card clay-card-interactive p-5 flex items-center justify-between cursor-pointer"
          title={`Weekly goal: ${userProfile.weekly_hours || 10} hrs`}
        >
          <div className="flex-1 pr-4">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--cl-01-mut)]">
              <span className="uppercase tracking-wider">Hours Accomplished</span>
              <span className="font-extrabold text-[var(--cl-01-ink)]">
                {totalHoursSpent.toFixed(1)}h
              </span>
            </div>
            <div className="clay-progress-track mt-2 h-2.5">
              <div
                className="clay-progress-fill"
                style={{ width: `${Math.max(8, weeklyProgressPct)}%` }}
              />
            </div>
          </div>
          <span className="clay-icon-bubble w-11 h-11 shrink-0">
            <Clock className="w-5 h-5 text-[var(--cl-01-ink)]" strokeWidth={2.25} />
          </span>
        </div>
      </div>

      {/* AnalyticsView: Learning Progress & Skill Acquisition Over Time (Recharts) */}
      <AnalyticsView
        enrolledCourses={enrolledCourses}
        userProfile={userProfile}
        skillAnalysis={skillAnalysis}
        embedded={true}
      />

      {/* Active & Completed Course Accomplishments */}
      {enrolledCourses.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-[var(--cl-01-ink)] tracking-tight">
              Your Course Progress &amp; Milestones
            </h3>
            <button
              onClick={() => onNavigateTab("my_learning")}
              className="clay-btn clay-btn-soft px-3.5 py-1.5 text-xs font-bold"
            >
              Update Progress
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrolledCourses.slice(0, 4).map(({ course, progress_percent, status }) => {
              const isDone = status === "completed" || progress_percent >= 100;
              return (
                <div
                  key={course.course_id}
                  className="clay-card p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`clay-tag px-2.5 py-0.5 text-[11px] font-bold inline-flex items-center gap-1 ${
                          isDone ? "badge-success" : "badge-brand"
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" strokeWidth={2.25} />
                            <span>Completed</span>
                          </>
                        ) : (
                          <span>{progress_percent}% Accomplished</span>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-[var(--cl-01-mut)]">
                        {course.duration}
                      </span>
                    </div>

                    <h4
                      onClick={() => onViewDetails(course)}
                      className="text-base font-bold text-[var(--cl-01-ink)] hover:opacity-80 cursor-pointer line-clamp-1"
                    >
                      {course.title}
                    </h4>

                    <p className="text-xs font-semibold text-[var(--cl-01-mut)] inline-flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" strokeWidth={2.25} />
                      <span>{course.channel_title || course.instructor}</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="clay-progress-track h-2.5">
                      <div
                        className="clay-progress-fill transition-all duration-300"
                        style={{ width: `${Math.max(6, progress_percent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => onViewDetails(course)}
                        className="clay-btn clay-btn-soft px-3.5 py-1.5 text-xs font-bold"
                      >
                        Description
                      </button>
                      <a
                        href={course.course_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="clay-btn clay-btn-primary px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 no-underline"
                      >
                        <span>Continue Course</span>
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.25} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        activeCourse && (
          <div className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 clay-tag badge-neutral px-2.5 py-0.5 text-xs font-bold">
                <BookOpen className="w-3.5 h-3.5 text-[var(--brand-primary)]" strokeWidth={2.25} />
                <span>Recommended First Milestone</span>
              </div>
              <h3 className="text-lg font-extrabold text-[var(--cl-01-ink)]">
                {activeCourse.title}
              </h3>
              <p className="text-xs font-semibold text-[var(--cl-01-mut)]">
                Begin tracking this course to record your study hours and unlock milestones for{" "}
                {careerGoal}.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={() => onViewDetails(activeCourse)}
                className="clay-btn clay-btn-soft px-4 py-2.5 text-xs font-bold"
              >
                Description
              </button>
              <button
                onClick={() => onAddToLearning(activeCourse)}
                className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-bold"
              >
                + Start Tracking
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};
