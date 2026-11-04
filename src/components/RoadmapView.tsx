import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  ChevronDown,
  Trophy,
  ArrowUpRight,
  Briefcase,
  Sparkles,
  Building2,
} from "lucide-react";
import { RoadmapStep, Course, UserProfile } from "../types";

interface RoadmapViewProps {
  roadmapSteps: RoadmapStep[];
  onToggleStep: (stepId: number) => void;
  onViewDetails: (course: Course) => void;
  userProfile: UserProfile;
  onAdvanceLevel: (nextLevel: "Beginner" | "Intermediate" | "Advanced") => void;
}

interface ApplicableJob {
  id: string;
  title: string;
  seniority: string;
  workType: string;
  matchPercent: number;
  summary: string;
  skills: string[];
}

function getApplicableJobs(
  careerGoal: string,
  level: "Beginner" | "Intermediate" | "Advanced",
  roadmapSteps: RoadmapStep[]
): ApplicableJob[] {
  const goal = (careerGoal || "AI Engineer").trim();
  const extractedSkills = Array.from(
    new Set(
      roadmapSteps
        .flatMap((s) => s.skills.split(","))
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
  const topSkills =
    extractedSkills.length > 0
      ? extractedSkills.slice(0, 6)
      : ["Problem Solving", "System Design", "Core Frameworks", "Git"];

  if (level === "Beginner") {
    return [
      {
        id: "beg-1",
        title: `Junior ${goal}`,
        seniority: "Entry-Level · Full-Time",
        workType: "Remote / Hybrid",
        matchPercent: 96,
        summary: `Build, test, and maintain foundational ${goal.toLowerCase()} modules alongside senior engineers while applying core workflows from your completed roadmap.`,
        skills: topSkills.slice(0, 4),
      },
      {
        id: "beg-2",
        title: `Associate ${goal}`,
        seniority: "Entry-Level · Associate",
        workType: "Hybrid / On-site",
        matchPercent: 94,
        summary: `Collaborate on feature implementation, data preparation, and automated quality checks within an agile ${goal.toLowerCase()} product team.`,
        skills: topSkills.slice(1, 5),
      },
      {
        id: "beg-3",
        title: `${goal} Solutions Analyst`,
        seniority: "Junior Specialist",
        workType: "Remote",
        matchPercent: 91,
        summary: `Translate technical requirements into practical prototypes, documentation, and client-ready ${goal.toLowerCase()} deliverables.`,
        skills: topSkills.slice(0, 3),
      },
      {
        id: "beg-4",
        title: `Graduate / Apprenticeship ${goal}`,
        seniority: "Early Career Rotational",
        workType: "Remote / Hybrid",
        matchPercent: 89,
        summary: `Fast-track rotational role designed for candidates who have mastered core ${goal.toLowerCase()} fundamentals and hands-on project milestones.`,
        skills: topSkills.slice(2, 6),
      },
    ];
  }

  if (level === "Intermediate") {
    return [
      {
        id: "int-1",
        title: `Mid-Level ${goal}`,
        seniority: "Mid-Level · IC2/IC3",
        workType: "Remote / Hybrid",
        matchPercent: 97,
        summary: `Own end-to-end architecture, implementation, and performance optimization of production ${goal.toLowerCase()} systems and services.`,
        skills: topSkills.slice(0, 4),
      },
      {
        id: "int-2",
        title: `Applied ${goal} Specialist`,
        seniority: "Mid-Level Specialist",
        workType: "Remote",
        matchPercent: 94,
        summary: `Design scalable pipelines, integrate domain frameworks, and deliver high-impact product capabilities across cross-functional squads.`,
        skills: topSkills.slice(1, 5),
      },
      {
        id: "int-3",
        title: `Product Systems ${goal}`,
        seniority: "Mid-Level · Full-Time",
        workType: "Hybrid",
        matchPercent: 92,
        summary: `Bridge core engineering and product delivery by scaling reliable ${goal.toLowerCase()} workflows, observability, and automated testing.`,
        skills: topSkills.slice(0, 4),
      },
      {
        id: "int-4",
        title: `Technical Consultant – ${goal}`,
        seniority: "Mid-Level Advisory",
        workType: "Remote / Client-Facing",
        matchPercent: 89,
        summary: `Lead technical discovery and deploy production-grade ${goal.toLowerCase()} architectures tailored to enterprise teams.`,
        skills: topSkills.slice(2, 6),
      },
    ];
  }

  return [
    {
      id: "adv-1",
      title: `Senior ${goal}`,
      seniority: "Senior · IC4+",
      workType: "Remote / Hybrid",
      matchPercent: 98,
      summary: `Spearhead high-scale system architecture, mentor engineering teams, and drive mission-critical ${goal.toLowerCase()} initiatives in production.`,
      skills: topSkills.slice(0, 5),
    },
    {
      id: "adv-2",
      title: `Lead ${goal} Architect`,
      seniority: "Lead / Principal Track",
      workType: "Remote",
      matchPercent: 95,
      summary: `Define long-term technical strategy, distributed systems reliability, and next-generation platform standards for ${goal.toLowerCase()}.`,
      skills: topSkills.slice(1, 6),
    },
    {
      id: "adv-3",
      title: `Staff ${goal}`,
      seniority: "Staff Engineer",
      workType: "Remote / Hybrid",
      matchPercent: 93,
      summary: `Solve the most complex cross-organization scalability, security, and performance challenges across the ${goal.toLowerCase()} ecosystem.`,
      skills: topSkills.slice(0, 4),
    },
    {
      id: "adv-4",
      title: `Engineering Manager – ${goal}`,
      seniority: "Technical Leadership",
      workType: "Hybrid / Remote",
      matchPercent: 90,
      summary: `Lead and grow a high-performing team of ${goal.toLowerCase()} specialists while overseeing architectural execution and delivery.`,
      skills: topSkills.slice(2, 6),
    },
  ];
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  roadmapSteps,
  onToggleStep,
  onViewDetails,
  userProfile,
  onAdvanceLevel,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [expandedStepId, setExpandedStepId] = useState<number | null>(null);
  const [showApplicableJobs, setShowApplicableJobs] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);

  const currentLevel: "Beginner" | "Intermediate" | "Advanced" =
    userProfile.experience_level === "Intermediate" || userProfile.experience_level === "Advanced"
      ? userProfile.experience_level
      : "Beginner";

  const nextLevel: "Beginner" | "Intermediate" | "Advanced" =
    currentLevel === "Beginner"
      ? "Intermediate"
      : currentLevel === "Intermediate"
      ? "Advanced"
      : "Advanced";

  const completedSteps = roadmapSteps.filter((s) => s.completed).length;
  const isRoadmapCompleted = roadmapSteps.length > 0 && completedSteps === roadmapSteps.length;
  const progressPercent = Math.round((completedSteps / Math.max(1, roadmapSteps.length)) * 100);
  const visibleSteps = showAll ? roadmapSteps : roadmapSteps.slice(0, 4);

  const applicableJobs = getApplicableJobs(
    userProfile.career_goal || "AI Engineer",
    currentLevel,
    roadmapSteps
  );

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, progressPercent) / 100) * circumference;

  const handleAdvanceClick = () => {
    const previousLevel = currentLevel;
    const targetLevel = nextLevel;
    onAdvanceLevel(targetLevel);
    setShowApplicableJobs(false);
    if (previousLevel === "Advanced") {
      setLevelUpMessage(
        `Advanced Mastery track refreshed! Your ${
          userProfile.career_goal || "AI Engineer"
        } roadmap has been reset for a new cycle.`
      );
    } else {
      setLevelUpMessage(
        `Congratulations! You advanced from ${previousLevel} to ${targetLevel} level. Here is your new ${targetLevel} roadmap.`
      );
    }
  };

  return (
    <div className="space-y-7">
      {/* Compact Header + Progress Ring */}
      <div className="clay-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-extrabold text-[var(--cl-01-ink)] tracking-tight">Roadmap</h2>
          <span className="clay-tag badge-brand px-3 py-1 text-xs font-bold">
            {userProfile.career_goal || "AI Engineer"}
          </span>
          <span className="clay-tag badge-neutral px-3 py-1 text-xs font-bold">
            {currentLevel} Level
          </span>
        </div>

        <div
          className="flex items-center gap-3 clay-tag badge-neutral px-4 py-1.5"
          title={`${completedSteps} of ${roadmapSteps.length} steps completed`}
        >
          <svg className="w-11 h-11 -rotate-90" viewBox="0 0 52 52">
            <circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              stroke="var(--surface-inset)"
              strokeWidth="6"
            />
            <circle
              cx="26"
              cy="26"
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
            <div className="text-sm font-extrabold text-[var(--cl-01-ink)]">
              {completedSteps}/{roadmapSteps.length}
            </div>
            <span className="text-[11px] font-semibold text-[var(--cl-01-mut)]">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Level Up Confirmation Banner */}
      {levelUpMessage && (
        <div className="clay-card surface-success p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="clay-icon-bubble w-9 h-9 shrink-0">
              <Sparkles className="w-4 h-4 text-[var(--cl-01-ink)]" strokeWidth={2.25} />
            </span>
            <p className="text-xs sm:text-sm font-bold text-[var(--cl-01-ink)]">{levelUpMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setLevelUpMessage(null)}
            className="clay-btn clay-btn-soft px-3 py-1 text-xs font-bold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Roadmap Completed Prompt: Advance Level or View Applicable Jobs */}
      {isRoadmapCompleted && (
        <div className="clay-card p-6 space-y-5 border-2 border-[var(--brand-primary)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="clay-icon-bubble w-12 h-12 shrink-0">
                <Trophy className="w-6 h-6 text-[var(--status-warning)]" strokeWidth={2.25} />
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="clay-tag badge-success px-2.5 py-0.5 text-[11px] font-bold">
                    100% Completed
                  </span>
                  <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-bold">
                    Current: {currentLevel}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[var(--cl-01-ink)]">
                  You completed your {currentLevel} {userProfile.career_goal || "AI Engineer"} roadmap!
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-[var(--cl-01-mut)] leading-relaxed">
                  Would you like to advance to the next level from {currentLevel}, or see the jobs you are applicable for right now?
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleAdvanceClick}
                className="clay-btn clay-btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.25} />
                <span>
                  {currentLevel === "Beginner"
                    ? "Advance to Intermediate"
                    : currentLevel === "Intermediate"
                    ? "Advance to Advanced"
                    : "Advance to Next Mastery Track"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowApplicableJobs((prev) => !prev)}
                className={`clay-btn px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 ${
                  showApplicableJobs ? "clay-btn-mint" : "clay-btn-soft"
                }`}
              >
                <Briefcase className="w-4 h-4" strokeWidth={2.25} />
                <span>
                  {showApplicableJobs ? "Hide Applicable Jobs" : "Jobs You Are Applicable In"}
                </span>
              </button>
            </div>
          </div>

          {/* Applicable Jobs Panel */}
          {showApplicableJobs && (
            <div className="pt-4 border-t border-[var(--surface-inset)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-[var(--cl-01-ink)]">
                    Applicable Roles for {currentLevel} {userProfile.career_goal || "AI Engineer"}
                  </h4>
                  <p className="text-xs font-semibold text-[var(--cl-01-mut)]">
                    Matched to the skills and milestones you completed in this roadmap
                  </p>
                </div>
                <span className="clay-tag badge-brand px-3 py-1 text-xs font-bold">
                  {applicableJobs.length} Matching Roles
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applicableJobs.map((job) => {
                  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
                    job.title
                  )}`;
                  const indeedUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(job.title)}`;

                  return (
                    <div key={job.id} className="clay-inset p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="text-sm font-extrabold text-[var(--cl-01-ink)]">
                              {job.title}
                            </h5>
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--cl-01-mut)] mt-0.5">
                              <Building2 className="w-3.5 h-3.5" strokeWidth={2.25} />
                              <span>{job.seniority}</span>
                              <span>·</span>
                              <span>{job.workType}</span>
                            </div>
                          </div>
                          <span className="clay-tag badge-success px-2.5 py-0.5 text-[11px] font-bold shrink-0">
                            {job.matchPercent}% Match
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-[var(--cl-01-mut)] leading-relaxed">
                          {job.summary}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.skills.map((skill) => (
                            <span
                              key={skill}
                              className="clay-tag badge-neutral px-2 py-0.5 text-[10px] font-bold"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--surface-inset)]">
                        <a
                          href={linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="clay-btn clay-btn-primary px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <span>LinkedIn Jobs</span>
                          <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                        </a>
                        <a
                          href={indeedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="clay-btn clay-btn-soft px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <span>Indeed</span>
                          <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sequential Milestone Steps */}
      <div className="relative pl-8 space-y-4 before:absolute before:left-[18px] before:top-6 before:bottom-6 before:w-1.5 before:rounded-full before:bg-[var(--surface-inset)]">
        {visibleSteps.map((step) => {
          const isExpanded = expandedStepId === step.id;
          const cleanDescription = (step.description || "").replace(
            /^\[(?:A\*|BFS|DFS)[^\]]*\]\s*/i,
            ""
          );

          return (
            <div
              key={step.id}
              className={`relative clay-card clay-card-interactive ${
                step.completed ? "surface-success" : ""
              } p-5 space-y-3`}
            >
              {/* Timeline marker icon */}
              <button
                onClick={() => onToggleStep(step.id)}
                className={`absolute -left-[38px] top-5 w-9 h-9 rounded-full clay-btn flex items-center justify-center ${
                  step.completed ? "clay-btn-mint" : "clay-btn-soft"
                }`}
                title={step.completed ? "Mark incomplete" : "Mark completed"}
                aria-label={step.completed ? "Mark incomplete" : "Mark completed"}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5" strokeWidth={2.25} />
                ) : (
                  <Circle className="w-4 h-4" strokeWidth={2.25} />
                )}
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div
                  onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                  className="space-y-1.5 flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`clay-tag px-2.5 py-0.5 text-[11px] font-bold ${
                        step.completed ? "badge-success" : "badge-brand"
                      }`}
                    >
                      Step {step.step_number}
                    </span>
                    <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-semibold">
                      {step.skills}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--cl-01-ink)]">{step.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {step.recommended_course && (
                    <button
                      onClick={() => onViewDetails(step.recommended_course!)}
                      title={step.recommended_course.title}
                      className="clay-btn clay-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                    >
                      <span>Course</span>
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.25} />
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                    aria-label="Toggle step details"
                    className="clay-btn clay-btn-soft w-8 h-8 rounded-full flex items-center justify-center text-[var(--cl-01-ink)]"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      strokeWidth={2.25}
                    />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="clay-inset p-3.5 text-xs font-semibold text-[var(--cl-01-ink)] leading-relaxed">
                  {cleanDescription}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {roadmapSteps.length > 4 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="clay-btn clay-btn-soft px-6 py-2.5 text-xs font-bold flex items-center gap-1.5"
          >
            <span>{showAll ? "Show less" : `Show all (${roadmapSteps.length})`}</span>
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
