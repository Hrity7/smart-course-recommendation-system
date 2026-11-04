import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DashboardView } from "./components/DashboardView";
import { FindCoursesView } from "./components/FindCoursesView";
import { RecommendationsView } from "./components/RecommendationsView";
import { MyLearningView } from "./components/MyLearningView";
import { SkillGapView } from "./components/SkillGapView";
import { RoadmapView } from "./components/RoadmapView";
import { AnalyticsView } from "./components/AnalyticsView";
import { SettingsView } from "./components/SettingsView";
import { CourseDetailModal } from "./components/CourseDetailModal";
import { ProfileSetupModal } from "./components/ProfileSetupModal";
import { AIAdvisorDrawer } from "./components/AIAdvisorDrawer";
import { DisclaimerView } from "./components/DisclaimerView";
import { DisclaimerBanner } from "./components/DisclaimerBanner";
import { Info } from "lucide-react";

import { Course, UserProfile, RecommendationWeights, LearningCourse, RoadmapStep } from "./types";
import { isLegacyDemoCourse } from "./data/courses";
import {
  DEFAULT_WEIGHTS,
  recommendCourses,
  analyzeSkillGap,
  generateRoadmapSteps,
  extractCompletedCourseSkills,
} from "./utils/recommender";
import { defaultCourseController } from "./services/YouTubeService";

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  age: 20,
  education: "",
  profession: "",
  skills: "",
  interests: "",
  career_goal: "",
  experience_level: "Beginner",
  preferred_difficulty: "Beginner",
  learning_format: "Self-paced online video",
  weekly_hours: 8,
  duration_preference: "1-5 hours",
  platforms: "YouTube",
};

function normalizeDurationPreference(raw?: string): string {
  const val = (raw || "").toLowerCase();
  if (val.includes("less than 1") || val.includes("< 1") || val.includes("short")) {
    return "Less than 1 hour";
  }
  if (val.includes("more than 5") || val.includes("> 5") || val.includes("comprehensive")) {
    return "More than 5 hours";
  }
  return "1-5 hours";
}

export default function App() {
  // 0. Persistent Theme State (Light / Dark)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("course_app_theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("course_app_theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      localStorage.setItem("course_app_theme", "light");
    }
  }, [isDarkMode]);

  // 1. Persistent User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("course_app_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          duration_preference: normalizeDurationPreference(parsed.duration_preference),
        };
      }
      return DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [hasCompletedInitialSetup, setHasCompletedInitialSetup] = useState<boolean>(() => {
    return localStorage.getItem("course_app_initial_done") === "true";
  });

  // 2. Active Tab State
  const [currentTab, setCurrentTab] = useState<string>("dashboard");

  // 3. Algorithm Weights State
  const [weights, setWeights] = useState<RecommendationWeights>(() => {
    try {
      const saved = localStorage.getItem("course_app_weights");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          interest_match: Number(parsed.interest_match ?? DEFAULT_WEIGHTS.interest_match),
          skill_match: Number(parsed.skill_match ?? DEFAULT_WEIGHTS.skill_match),
          career_goal_match: Number(parsed.career_goal_match ?? DEFAULT_WEIGHTS.career_goal_match),
          difficulty_match: Number(parsed.difficulty_match ?? DEFAULT_WEIGHTS.difficulty_match),
          rating_match: Number(parsed.rating_match ?? DEFAULT_WEIGHTS.rating_match),
          duration_match: Number(parsed.duration_match ?? DEFAULT_WEIGHTS.duration_match),
        };
      }
      return DEFAULT_WEIGHTS;
    } catch {
      return DEFAULT_WEIGHTS;
    }
  });

  useEffect(() => {
    defaultCourseController.updateWeights(weights);
  }, [weights]);

  // 4. Genuine YouTube Courses State (Catalog & Active Search Results)
  const [catalogCourses, setCatalogCourses] = useState<Course[]>([]);
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [knownCoursesMap, setKnownCoursesMap] = useState<Record<string, Course>>({});
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const registerKnownCourses = useCallback((courses: Course[]) => {
    if (!courses || courses.length === 0) return;
    setKnownCoursesMap((prev) => {
      const next = { ...prev };
      for (const c of courses) {
        if (!isLegacyDemoCourse(c)) {
          next[c.course_id] = c;
        }
      }
      return next;
    });
  }, []);

  // 5. Enrolled Courses & Progress (Purge any legacy demo courses)
  const [enrolledCourses, setEnrolledCourses] = useState<LearningCourse[]>(() => {
    try {
      const saved = localStorage.getItem("course_app_enrolled");
      if (saved) {
        const parsed: LearningCourse[] = JSON.parse(saved);
        return parsed.filter((item) => item?.course && !isLegacyDemoCourse(item.course));
      }
    } catch {
      // ignore parse errors
    }
    return [];
  });

  // 6. Bookmarked Saved Courses (Purge any legacy demo course IDs)
  const [savedCourseIds, setSavedCourseIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("course_app_saved_ids");
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        return new Set(ids.filter((id) => !isLegacyDemoCourse(id)));
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  });

  // 7. Roadmap Steps
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>(() => {
    try {
      const saved = localStorage.getItem("course_app_roadmap");
      if (saved) {
        const parsed: RoadmapStep[] = JSON.parse(saved);
        // Clean any legacy demo course references
        return parsed.map((step) => ({
          ...step,
          recommended_course:
            step.recommended_course && !isLegacyDemoCourse(step.recommended_course)
              ? step.recommended_course
              : undefined,
          recommended_course_id:
            step.recommended_course_id && !isLegacyDemoCourse(step.recommended_course_id)
              ? step.recommended_course_id
              : undefined,
        }));
      }
    } catch {
      // ignore
    }
    return generateRoadmapSteps(DEFAULT_PROFILE.career_goal, []);
  });

  // 8. Search & Modals State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<Course | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdvisorDrawerOpen, setIsAdvisorDrawerOpen] = useState(false);
  const [geminiAvailable, setGeminiAvailable] = useState(true);
  const [hasAcknowledgedDisclaimer, setHasAcknowledgedDisclaimer] = useState<boolean>(() => {
    return localStorage.getItem("course_app_disclaimer_ack") === "true";
  });

  useEffect(() => {
    fetch("/api/gemini/status")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.configured === "boolean") {
          setGeminiAvailable(data.configured);
        }
      })
      .catch(() => {});
  }, [isAdvisorDrawerOpen]);

  const handleAcknowledgeDisclaimer = () => {
    setHasAcknowledgedDisclaimer(true);
    localStorage.setItem("course_app_disclaimer_ack", "true");
  };

  // Load Personalized YouTube Courses when profile changes
  const loadPersonalizedYouTubeCourses = useCallback(
    async (profile: UserProfile, forceRefresh: boolean = false) => {
      setIsLoadingCourses(true);
      setApiError(null);
      const res = await defaultCourseController.fetchPersonalizedCatalog(profile, forceRefresh);
      if (res.error) {
        setApiError(res.error);
      } else {
        setCatalogCourses(res.courses);
        setSearchResults(res.courses);
        registerKnownCourses(res.courses);
      }
      setIsLoadingCourses(false);
    },
    [registerKnownCourses]
  );

  useEffect(() => {
    loadPersonalizedYouTubeCourses(userProfile, false);
  }, [
    userProfile.career_goal,
    userProfile.interests,
    userProfile.skills,
    userProfile.preferred_difficulty,
    userProfile.experience_level,
    userProfile.duration_preference,
    userProfile.learning_format,
    userProfile.weekly_hours,
    userProfile.profession,
    loadPersonalizedYouTubeCourses,
  ]);

  // Execute dynamic YouTube search by topic, category, or skill level
  const handleExecuteYouTubeSearch = useCallback(
    async (options: {
      query?: string;
      category?: string;
      skillLevel?: "All" | "Beginner" | "Intermediate" | "Advanced";
      forceRefresh?: boolean;
    }) => {
      setIsLoadingCourses(true);
      setApiError(null);
      const res = await defaultCourseController.searchByTopicAndFilters(userProfile, options);
      if (res.error) {
        setApiError(res.error);
        setSearchResults([]);
      } else {
        setSearchResults(res.courses);
        registerKnownCourses(res.courses);
      }
      setIsLoadingCourses(false);
    },
    [userProfile, registerKnownCourses]
  );

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("course_app_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("course_app_weights", JSON.stringify(weights));
  }, [weights]);

  useEffect(() => {
    localStorage.setItem("course_app_enrolled", JSON.stringify(enrolledCourses));
  }, [enrolledCourses]);

  useEffect(() => {
    localStorage.setItem("course_app_saved_ids", JSON.stringify(Array.from(savedCourseIds)));
  }, [savedCourseIds]);

  useEffect(() => {
    localStorage.setItem("course_app_roadmap", JSON.stringify(roadmapSteps));
  }, [roadmapSteps]);

  // Compute Hybrid Recommendations dynamically from real YouTube catalog
  const recommendedCourses = useMemo(() => {
    return recommendCourses(userProfile, catalogCourses, weights, 15);
  }, [userProfile, catalogCourses, weights]);

  // Compute Skill Gap using real YouTube courses and completed courses
  const skillGapAnalysis = useMemo(() => {
    const userSkills = (userProfile.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const completedCourses = enrolledCourses
      .filter((c) => c.status === "completed" || c.progress_percent >= 100)
      .map((c) => c.course);
    return analyzeSkillGap(userProfile.career_goal, userSkills, catalogCourses, completedCourses);
  }, [userProfile, catalogCourses, enrolledCourses]);

  const [baselineAcquiredSkills, setBaselineAcquiredSkills] = useState<string[]>([]);

  const newlyAcquiredForCurrentLevel = useMemo(() => {
    const baselineSet = new Set(baselineAcquiredSkills.map((s) => s.toLowerCase()));
    return skillGapAnalysis.acquired.filter((s) => !baselineSet.has(s.toLowerCase()));
  }, [skillGapAnalysis.acquired, baselineAcquiredSkills]);

  // Automatically sync roadmap step completion whenever acquired skills from completed courses update
  useEffect(() => {
    if (catalogCourses.length > 0) {
      setRoadmapSteps((prev) => {
        const fresh = generateRoadmapSteps(
          userProfile.career_goal,
          catalogCourses,
          userProfile.experience_level,
          newlyAcquiredForCurrentLevel
        );
        return fresh.map((step) => {
          const existing = prev.find((p) => p.id === step.id && p.title === step.title);
          return {
            ...step,
            completed: step.completed || (existing ? existing.completed : false),
          };
        });
      });
    }
  }, [
    userProfile.career_goal,
    userProfile.experience_level,
    catalogCourses,
    newlyAcquiredForCurrentLevel,
  ]);

  // Handlers
  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    setHasCompletedInitialSetup(true);
    localStorage.setItem("course_app_initial_done", "true");
    loadPersonalizedYouTubeCourses(newProfile, true);
  };

  const handleChangeSkillLevel = (level: "Beginner" | "Intermediate" | "Advanced") => {
    setUserProfile((prev) => ({
      ...prev,
      experience_level: level,
      preferred_difficulty: level,
    }));
  };

  const handleAdvanceRoadmapLevel = (nextLevel: "Beginner" | "Intermediate" | "Advanced") => {
    setBaselineAcquiredSkills(skillGapAnalysis.acquired);
    setUserProfile((prev) => ({
      ...prev,
      experience_level: nextLevel,
      preferred_difficulty: nextLevel,
    }));
    const freshSteps = generateRoadmapSteps(
      userProfile.career_goal,
      catalogCourses,
      nextLevel,
      []
    ).map((s) => ({ ...s, completed: false }));
    setRoadmapSteps(freshSteps);
  };

  const handleToggleSaveCourse = (courseId: string) => {
    setSavedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const handleAddToLearning = (course: Course) => {
    registerKnownCourses([course]);
    setEnrolledCourses((prev) => {
      if (prev.some((e) => e.course.course_id === course.course_id)) {
        return prev;
      }
      return [
        {
          course,
          status: "in_progress",
          progress_percent: 10,
          hours_spent: Number(Math.max(0.5, course.duration_hours * 0.1).toFixed(1)),
          started_at: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  };

  const handleUpdateProgress = (courseId: string, progress: number) => {
    const isDone = progress >= 100;
    const targetItem = enrolledCourses.find((item) => item.course.course_id === courseId);
    const completedCourse =
      targetItem?.course ||
      catalogCourses.find((c) => c.course_id === courseId) ||
      knownCoursesMap[courseId];

    setEnrolledCourses((prev) =>
      prev.map((item) => {
        if (item.course.course_id === courseId) {
          return {
            ...item,
            progress_percent: progress,
            hours_spent: Number(((item.course.duration_hours * progress) / 100).toFixed(1)),
            status: isDone ? "completed" : "in_progress",
            completed_at: isDone ? new Date().toISOString() : undefined,
          };
        }
        return item;
      })
    );

    if (isDone && completedCourse) {
      const bridgedSkills = skillGapAnalysis.gapCourses
        .filter((g) => g.course.course_id === courseId)
        .map((g) => g.skill);
      const gainedSkills = [
        ...extractCompletedCourseSkills(completedCourse, userProfile.career_goal),
        ...bridgedSkills,
      ];

      if (gainedSkills.length > 0) {
        setUserProfile((prev) => {
          const existing = (prev.skills || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          const existingLower = new Set(existing.map((s) => s.toLowerCase()));
          const merged = [...existing];
          for (const skill of gainedSkills) {
            const trimmed = skill.trim();
            if (trimmed && !existingLower.has(trimmed.toLowerCase())) {
              existingLower.add(trimmed.toLowerCase());
              merged.push(trimmed);
            }
          }
          return {
            ...prev,
            skills: merged.join(", "),
          };
        });
      }
    }
  };

  const handleMarkComplete = (courseId: string) => {
    handleUpdateProgress(courseId, 100);
  };

  const handleRemoveFromLearning = (courseId: string) => {
    setEnrolledCourses((prev) => prev.filter((item) => item.course.course_id !== courseId));
  };

  const handleToggleRoadmapStep = (stepId: number) => {
    setRoadmapSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId) {
          return { ...step, completed: !step.completed };
        }
        return step;
      })
    );
  };

  const handleGlobalSearchSubmit = () => {
    setCurrentTab("find_courses");
    handleExecuteYouTubeSearch({ query: searchQuery });
  };

  const enrolledCourseIds = useMemo(() => {
    return new Set(enrolledCourses.map((c) => c.course.course_id));
  }, [enrolledCourses]);

  const savedCourses = useMemo(() => {
    const list: Course[] = [];
    savedCourseIds.forEach((id) => {
      const fromMap = knownCoursesMap[id];
      const fromCatalog = catalogCourses.find((c) => c.course_id === id);
      const fromEnrolled = enrolledCourses.find((e) => e.course.course_id === id)?.course;
      const found = fromMap || fromCatalog || fromEnrolled;
      if (found && !isLegacyDemoCourse(found)) {
        list.push(found);
      }
    });
    return list;
  }, [savedCourseIds, knownCoursesMap, catalogCourses, enrolledCourses]);

  return (
    <div className="flex h-screen text-[var(--cl-01-ink)] font-sans overflow-hidden antialiased">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAdvisor={() => setIsAdvisorDrawerOpen(true)}
        geminiAvailable={geminiAvailable}
      />

      {/* 2. Main Right Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleGlobalSearchSubmit}
          userProfile={userProfile}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        />

        {/* One-time Dismissible Disclaimer Banner */}
        <DisclaimerBanner
          isVisible={!hasAcknowledgedDisclaimer}
          onAcknowledge={handleAcknowledgeDisclaimer}
          onOpenDisclaimerPage={() => setCurrentTab("disclaimer")}
        />

        {/* Dynamic Scrollable Content Canvas */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col justify-between">
          <div className="flex-1 max-w-6xl mx-auto w-full">
            {currentTab === "dashboard" && (
              <DashboardView
                userProfile={userProfile}
                recommendedCourses={recommendedCourses}
                enrolledCourses={enrolledCourses}
                savedCourseIds={savedCourseIds}
                onRefreshRecommendations={() => loadPersonalizedYouTubeCourses(userProfile, true)}
                onViewDetails={setSelectedCourseForModal}
                onAddToLearning={handleAddToLearning}
                onToggleSave={handleToggleSaveCourse}
                onNavigateTab={setCurrentTab}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
                isLoading={isLoadingCourses}
                skillAnalysis={skillGapAnalysis}
              />
            )}

            {(currentTab === "find_courses" || currentTab === "explore") && (
              <FindCoursesView
                allCourses={searchResults}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onExecuteYouTubeSearch={handleExecuteYouTubeSearch}
                isLoading={isLoadingCourses}
                apiError={apiError}
                savedCourseIds={savedCourseIds}
                enrolledCourseIds={enrolledCourseIds}
                onViewDetails={setSelectedCourseForModal}
                onAddToLearning={handleAddToLearning}
                onToggleSave={handleToggleSaveCourse}
              />
            )}

            {currentTab === "recommendations" && (
              <RecommendationsView
                recommendedCourses={recommendedCourses}
                userProfile={userProfile}
                savedCourseIds={savedCourseIds}
                enrolledCourseIds={enrolledCourseIds}
                onRefreshRecommendations={() => loadPersonalizedYouTubeCourses(userProfile, true)}
                onViewDetails={setSelectedCourseForModal}
                onAddToLearning={handleAddToLearning}
                onToggleSave={handleToggleSaveCourse}
                onNavigateTab={setCurrentTab}
                onChangeSkillLevel={handleChangeSkillLevel}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
                isLoading={isLoadingCourses}
              />
            )}

            {currentTab === "my_learning" && (
              <MyLearningView
                enrolledCourses={enrolledCourses}
                savedCourses={savedCourses}
                onUpdateProgress={handleUpdateProgress}
                onMarkComplete={handleMarkComplete}
                onRemoveFromLearning={handleRemoveFromLearning}
                onAddToLearning={handleAddToLearning}
                onViewDetails={setSelectedCourseForModal}
                onToggleSave={handleToggleSaveCourse}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === "skill_gap" && (
              <SkillGapView
                userProfile={userProfile}
                allCourses={catalogCourses}
                savedCourseIds={savedCourseIds}
                enrolledCourseIds={enrolledCourseIds}
                onViewDetails={setSelectedCourseForModal}
                onAddToLearning={handleAddToLearning}
                onToggleSave={handleToggleSaveCourse}
                analysis={skillGapAnalysis}
              />
            )}

            {currentTab === "roadmap" && (
              <RoadmapView
                roadmapSteps={roadmapSteps}
                onToggleStep={handleToggleRoadmapStep}
                onViewDetails={setSelectedCourseForModal}
                userProfile={userProfile}
                onAdvanceLevel={handleAdvanceRoadmapLevel}
              />
            )}

            {currentTab === "analytics" && (
              <AnalyticsView
                enrolledCourses={enrolledCourses}
                savedCourses={savedCourses}
                userProfile={userProfile}
                skillAnalysis={skillGapAnalysis}
              />
            )}

            {currentTab === "settings" && (
              <SettingsView
                weights={weights}
                onUpdateWeights={setWeights}
                onResetWeights={() => setWeights(DEFAULT_WEIGHTS)}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
                userProfile={userProfile}
                geminiAvailable={geminiAvailable}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
              />
            )}

            {currentTab === "disclaimer" && <DisclaimerView onNavigateTab={setCurrentTab} />}
          </div>

          {/* Minimal Footer */}
          <footer className="mt-14 mb-2 px-4 py-3 flex items-center justify-between gap-4 text-xs font-semibold text-[var(--cl-01-mut)] max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[var(--cl-01-mut)] shrink-0" strokeWidth={2.25} />
              <span>Powered by genuine YouTube educational courses & AI guidance.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTab("disclaimer")}
                className={`clay-btn px-3.5 py-1 text-xs font-bold ${
                  currentTab === "disclaimer" ? "surface-brand text-[var(--brand-ink)]" : "clay-btn-soft"
                }`}
              >
                Disclaimer
              </button>
              <button
                onClick={() => setCurrentTab("settings")}
                className={`clay-btn px-3.5 py-1 text-xs font-bold ${
                  currentTab === "settings" ? "surface-brand text-[var(--brand-ink)]" : "clay-btn-soft"
                }`}
              >
                Settings
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* 3. Course Details Modal */}
      <CourseDetailModal
        course={selectedCourseForModal}
        onClose={() => setSelectedCourseForModal(null)}
        userProfile={userProfile}
        onAddToLearning={handleAddToLearning}
        onToggleSave={handleToggleSaveCourse}
        isSaved={
          selectedCourseForModal ? savedCourseIds.has(selectedCourseForModal.course_id) : false
        }
        isEnrolled={
          selectedCourseForModal ? enrolledCourseIds.has(selectedCourseForModal.course_id) : false
        }
      />

      {/* 4. Profile Setup / Edit Modal */}
      <ProfileSetupModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleSaveProfile}
        currentProfile={userProfile}
        isInitialSetup={false}
      />

      {/* 5. Gemini AI Advisor Drawer */}
      <AIAdvisorDrawer
        isOpen={isAdvisorDrawerOpen}
        onClose={() => setIsAdvisorDrawerOpen(false)}
        userProfile={userProfile}
        topCourses={recommendedCourses}
        onViewDetails={setSelectedCourseForModal}
      />
    </div>
  );
}
