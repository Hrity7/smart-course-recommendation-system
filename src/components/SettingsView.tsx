import React, { useState, useEffect } from "react";
import {
  Sliders,
  KeyRound,
  User,
  RotateCcw,
  ChevronDown,
  Moon,
  Sun,
  Youtube,
  Archive,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { RecommendationWeights, UserProfile } from "../types";
import { UserPreferences } from "../utils/recommender";

interface SettingsViewProps {
  weights: RecommendationWeights;
  onUpdateWeights: (weights: RecommendationWeights) => void;
  onResetWeights: () => void;
  onOpenProfileModal: () => void;
  userProfile?: UserProfile;
  geminiAvailable: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  weights,
  onUpdateWeights,
  onResetWeights,
  onOpenProfileModal,
  userProfile,
  geminiAvailable,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [showAllWeights, setShowAllWeights] = useState(false);
  const [showCliHelp, setShowCliHelp] = useState(false);
  const [ytStatus, setYtStatus] = useState<{
    youtubeApiKeyConfigured: boolean;
    activeMode: string;
    cacheEntries: number;
  } | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    scenario: string;
    status: "ok" | "error";
    detail: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/youtube/status")
      .then((r) => r.json())
      .then((d) => setYtStatus(d))
      .catch(() => {});
  }, []);

  const handleSlider = (key: keyof RecommendationWeights, val: number) => {
    onUpdateWeights({
      ...weights,
      [key]: val / 100,
    });
  };

  const runDiagnosticScenario = async (
    label: string,
    queryParams: Record<string, string>
  ) => {
    setDiagnosticResult({ scenario: label, status: "ok", detail: "Testing..." });
    try {
      const qs = new URLSearchParams(queryParams).toString();
      const res = await fetch(`/api/youtube/search?${qs}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setDiagnosticResult({
          scenario: label,
          status: "error",
          detail: `[${data.errorCode || res.status}] ${data.error}`,
        });
      } else if (data.courses && data.courses.length === 0) {
        setDiagnosticResult({
          scenario: label,
          status: "ok",
          detail: '0 results -> Displays "No relevant courses found. Try a different search."',
        });
      } else {
        const first = data.courses[0];
        setDiagnosticResult({
          scenario: label,
          status: "ok",
          detail: `Retrieved ${data.count} genuine YouTube courses. Top result: "${first.title}" by ${first.channel_title} (${first.course_url})`,
        });
      }
    } catch (e: any) {
      setDiagnosticResult({
        scenario: label,
        status: "error",
        detail: e?.message || "Network failure",
      });
    }
  };

  const factorList: { key: keyof RecommendationWeights; label: string; tip: string }[] = [
    { key: "interest_match", label: "Interests & Topic", tip: "YouTube title & category match" },
    { key: "skill_match", label: "Skills & Tech", tip: "Programming languages and skill overlap" },
    { key: "career_goal_match", label: "Learning Objective", tip: "Target career alignment" },
    { key: "difficulty_match", label: "Skill Level", tip: "Beginner / Intermediate / Advanced match" },
    { key: "rating_match", label: "Engagement", tip: "YouTube view engagement signal" },
    { key: "duration_match", label: "Duration", tip: "Video course length alignment" },
  ];

  const visibleFactors = showAllWeights ? factorList : factorList.slice(0, 4);

  const totalPercentage = Math.round(
    factorList.reduce((sum, item) => sum + (Number(weights[item.key]) || 0), 0) * 100
  );

  const activeProfileQueries = userProfile
    ? new UserPreferences(userProfile).buildProfileSearchQueries()
    : [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[var(--cl-01-ink)] tracking-tight">Settings</h2>
        <div className="flex items-center gap-2.5">
          <a
            href="/api/download-project-zip"
            download="smart_course_recommendation.zip"
            className="clay-btn clay-btn-soft flex items-center gap-2 px-4 py-2.5 text-xs font-bold no-underline"
          >
            <Archive className="w-4 h-4" strokeWidth={2.25} />
            <span>Download Project (.zip)</span>
          </a>
          <button
            onClick={onOpenProfileModal}
            className="clay-btn clay-btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
          >
            <User className="w-4 h-4" strokeWidth={2.25} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* 0. Active Profile Settings Card (Drives YouTube Course Recommendations) */}
      {userProfile && (
        <div className="clay-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="clay-icon-bubble w-9 h-9 badge-brand">
                <User className="w-4 h-4 text-[var(--brand-primary)]" strokeWidth={2.25} />
              </span>
              <div>
                <h3 className="text-base font-bold text-[var(--cl-01-ink)]">
                  Your Learning Profile ({userProfile.name})
                </h3>
                <p className="text-xs font-semibold text-[var(--cl-01-mut)]">
                  YouTube course recommendations are dynamically tailored to these profile settings.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenProfileModal}
              className="clay-btn clay-btn-soft px-4 py-2 text-xs font-bold"
            >
              Customize Profile
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="clay-inset p-3">
              <div className="text-[11px] font-bold text-[var(--cl-01-mut)]">Career Goal</div>
              <div className="text-xs font-extrabold text-[var(--cl-01-ink)] mt-0.5">
                {userProfile.career_goal}
              </div>
            </div>
            <div className="clay-inset p-3">
              <div className="text-[11px] font-bold text-[var(--cl-01-mut)]">Skill Level</div>
              <div className="text-xs font-extrabold text-[var(--cl-01-ink)] mt-0.5">
                {userProfile.preferred_difficulty || userProfile.experience_level}
              </div>
            </div>
            <div className="clay-inset p-3">
              <div className="text-[11px] font-bold text-[var(--cl-01-mut)]">Duration Pref</div>
              <div className="text-xs font-extrabold text-[var(--cl-01-ink)] mt-0.5">
                {userProfile.duration_preference}
              </div>
            </div>
            <div className="clay-inset p-3">
              <div className="text-[11px] font-bold text-[var(--cl-01-mut)]">Weekly Pace</div>
              <div className="text-xs font-extrabold text-[var(--cl-01-ink)] mt-0.5">
                {userProfile.weekly_hours} hrs/week
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[var(--cl-01-mut)]">Skills:</span>
              <span className="font-bold text-[var(--cl-01-ink)]">{userProfile.skills}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[var(--cl-01-mut)]">Interests:</span>
              <span className="font-bold text-[var(--cl-01-ink)]">{userProfile.interests}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="font-bold text-[var(--cl-01-mut)]">Active YouTube Queries:</span>
              {activeProfileQueries.map((q, idx) => (
                <span
                  key={idx}
                  className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-semibold"
                >
                  &ldquo;{q}&rdquo;
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 1. Appearance / Theme Card */}
      <div className="clay-card p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="clay-icon-bubble w-9 h-9 badge-brand">
            {isDarkMode ? (
              <Moon className="w-4 h-4 text-[var(--brand-primary)]" strokeWidth={2.25} />
            ) : (
              <Sun className="w-4 h-4 text-[var(--brand-primary)]" strokeWidth={2.25} />
            )}
          </span>
          <div>
            <h3 className="text-sm font-bold text-[var(--cl-01-ink)]">Appearance</h3>
            <span className="text-[11px] font-semibold text-[var(--cl-01-mut)]">
              {isDarkMode ? "Dark mode active" : "Light mode active"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isDarkMode) onToggleDarkMode();
            }}
            className={`clay-btn px-3.5 py-2 text-xs font-bold ${
              !isDarkMode ? "clay-btn-primary" : "clay-btn-soft"
            }`}
          >
            <Sun className="w-3.5 h-3.5" strokeWidth={2.25} />
            <span>Light</span>
          </button>
          <button
            onClick={() => {
              if (!isDarkMode) onToggleDarkMode();
            }}
            className={`clay-btn px-3.5 py-2 text-xs font-bold ${
              isDarkMode ? "clay-btn-primary" : "clay-btn-soft"
            }`}
          >
            <Moon className="w-3.5 h-3.5" strokeWidth={2.25} />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* 2. Algorithm Weights */}
      <div className="clay-card p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="clay-icon-bubble w-9 h-9 badge-brand">
              <Sliders className="w-4 h-4 text-[var(--brand-primary)]" strokeWidth={2.25} />
            </span>
            <div>
              <h3 className="text-base font-bold text-[var(--cl-01-ink)]">
                Recommendation Engine Weights
              </h3>
              <span className="text-[11px] font-semibold text-[var(--cl-01-mut)]">
                Total: {totalPercentage}%
              </span>
            </div>
          </div>

          <button
            onClick={onResetWeights}
            className="clay-btn clay-btn-soft flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleFactors.map(({ key, label, tip }) => {
            const currentPct = Math.round(weights[key] * 100);
            return (
              <div key={key} className="clay-inset p-3.5 space-y-2" title={tip}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--cl-01-ink)]">{label}</span>
                  <strong className="clay-tag badge-brand px-2.5 py-0.5 text-xs font-bold">
                    {currentPct}%
                  </strong>
                </div>

                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={currentPct}
                  aria-label={label}
                  onChange={(e) => handleSlider(key, parseInt(e.target.value, 10))}
                  className="w-full clay-range cursor-pointer"
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-1">
          <button
            onClick={() => setShowAllWeights(!showAllWeights)}
            className="clay-btn clay-btn-soft px-4 py-1.5 text-xs font-bold flex items-center gap-1"
          >
            <span>{showAllWeights ? "Less" : "More weights"}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showAllWeights ? "rotate-180" : ""}`}
              strokeWidth={2.25}
            />
          </button>
        </div>
      </div>

      {/* 3. YouTube Data API v3 & Error Handling Verification */}
      <div className="clay-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="clay-icon-bubble w-9 h-9 badge-brand">
              <Youtube className="w-4 h-4 text-[var(--brand-primary)]" strokeWidth={2.25} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[var(--cl-01-ink)]">
                YouTube Course Service & Diagnostics
              </h3>
              <span className="text-[11px] font-semibold text-[var(--cl-01-mut)]">
                {ytStatus?.activeMode || "YouTube Live Retrieval Active"} · Cache:{" "}
                {ytStatus?.cacheEntries ?? 0} queries
              </span>
            </div>
          </div>

          <span className="clay-tag badge-success px-3 py-1 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.25} />
            <span>Live YouTube Active</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runDiagnosticScenario("Python Courses", { q: "Python programming" })}
            className="clay-btn clay-btn-soft px-3 py-1.5 text-xs font-bold"
          >
            Test Python Search
          </button>
          <button
            type="button"
            onClick={() => runDiagnosticScenario("Java Tutorials", { q: "Java tutorial" })}
            className="clay-btn clay-btn-soft px-3 py-1.5 text-xs font-bold"
          >
            Test Java Search
          </button>
          <button
            type="button"
            onClick={() =>
              runDiagnosticScenario("Unrelated Topic", { q: "funny cat prank compilation" })
            }
            className="clay-btn clay-btn-soft px-3 py-1.5 text-xs font-bold"
          >
            Test Unrelated Query
          </button>
          <button
            type="button"
            onClick={() =>
              runDiagnosticScenario("Invalid API Key Handling", {
                simulateError: "INVALID_API_KEY",
              })
            }
            className="clay-btn clay-btn-soft px-3 py-1.5 text-xs font-bold"
          >
            Test Invalid Key Error
          </button>
          <button
            type="button"
            onClick={() =>
              runDiagnosticScenario("Quota Limit Handling", {
                simulateError: "QUOTA_EXCEEDED",
              })
            }
            className="clay-btn clay-btn-soft px-3 py-1.5 text-xs font-bold"
          >
            Test Quota Limit Error
          </button>
        </div>

        {diagnosticResult && (
          <div className="clay-inset p-3.5 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[var(--cl-01-ink)]">
              {diagnosticResult.status === "ok" ? (
                <CheckCircle2
                  className="w-4 h-4 text-[var(--status-success-ink)] shrink-0"
                  strokeWidth={2.25}
                />
              ) : (
                <AlertTriangle
                  className="w-4 h-4 text-[var(--status-warning-ink)] shrink-0"
                  strokeWidth={2.25}
                />
              )}
              <span>Scenario: {diagnosticResult.scenario}</span>
            </div>
            <p className="text-[var(--cl-01-mut)] font-semibold break-all">
              {diagnosticResult.detail}
            </p>
          </div>
        )}
      </div>

      {/* 4. Compact AI Status Card */}
      <div className="clay-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="clay-icon-bubble w-9 h-9">
              <KeyRound className="w-4 h-4 text-[var(--cl-01-ink)]" strokeWidth={2.25} />
            </span>
            <span className="text-sm font-bold text-[var(--cl-01-ink)]">
              Environment Configuration
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`clay-tag px-3 py-1 text-xs font-bold flex items-center gap-1.5 ${
                geminiAvailable ? "badge-success" : "badge-warning"
              }`}
            >
              <span>{geminiAvailable ? "Gemini Connected" : "Local AI Engine"}</span>
            </span>

            <button
              onClick={() => setShowCliHelp(!showCliHelp)}
              className="clay-btn clay-btn-soft px-3 py-1 text-xs font-bold"
            >
              .env Setup
            </button>
          </div>
        </div>

        {showCliHelp && (
          <div className="clay-inset p-3.5 text-xs text-[var(--cl-01-ink)] space-y-1 font-mono">
            <p>export YOUTUBE_API_KEY=&quot;your_youtube_data_api_v3_key&quot;</p>
            <p>export GEMINI_API_KEY=&quot;your_gemini_api_key&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
};
