import React, { useState, useEffect, useMemo } from "react";
import { X, Sparkles, Plus, Check } from "lucide-react";
import { UserProfile } from "../types";
import { CAREER_SKILLS_MAP } from "../utils/recommender";

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  currentProfile: UserProfile;
  isInitialSetup?: boolean;
}

const CAREER_PRESETS: Record<string, { skills: string; interests: string }> = {
  "Data Scientist": {
    skills: "Python, SQL, Pandas, Statistics",
    interests: "Data Science, Machine Learning, Data Analysis, Python",
  },
  "AI / Machine Learning Engineer": {
    skills: "Python, PyTorch, Scikit-learn, Linear Algebra",
    interests: "Machine Learning, Deep Learning, Artificial Intelligence, LLMs",
  },
  "Full Stack Web Developer": {
    skills: "JavaScript, TypeScript, React, Node.js",
    interests: "Web Development, React, Full Stack, System Design",
  },
  "Cloud & DevOps Engineer": {
    skills: "Linux, Docker, Git, AWS",
    interests: "Cloud & DevOps, Kubernetes, Terraform, CI/CD",
  },
  "Cybersecurity Analyst": {
    skills: "Linux, Networking, Python, Bash",
    interests: "Cybersecurity, Ethical Hacking, Network Security, Cryptography",
  },
  "Product Manager": {
    skills: "SQL, Data Analysis, Agile, Roadmapping",
    interests: "Product Management, AI Strategy, Data Analytics, UX Design",
  },
  "UI/UX Designer": {
    skills: "Figma, Wireframing, Prototyping, CSS",
    interests: "UI/UX Design, Design Systems, Frontend Development, Web Design",
  },
  "Business Intelligence Analyst": {
    skills: "SQL, Excel, Power BI, Tableau",
    interests: "Data Analytics, Business Intelligence, SQL, Data Visualization",
  },
};

const SKILL_LEVEL_PROFILES: Record<
  "Beginner" | "Intermediate" | "Advanced",
  {
    label: string;
    summary: string;
    learning_format: string;
    profession: string;
    education: string;
  }
> = {
  Beginner: {
    label: "Beginner — Foundational (Student · Self-Paced)",
    summary: "Self-paced foundations · Student / Explorer · Entry level",
    learning_format: "Self-paced online video",
    profession: "Student",
    education: "Self-Taught / Bootcamp",
  },
  Intermediate: {
    label: "Intermediate — Applied (Practitioner · Project-Based)",
    summary: "Hands-on projects · Junior Engineer / Analyst · Undergraduate level",
    learning_format: "Hands-on project-based",
    profession: "Junior Software Engineer",
    education: "Bachelor's Degree (Ongoing/Completed)",
  },
  Advanced: {
    label: "Advanced — Specialist (Architect · Deep Lectures)",
    summary: "Deep architecture & research · Specialist · Graduate level",
    learning_format: "Structured academic lectures",
    profession: "Senior Specialist",
    education: "Master's Degree",
  },
};

const COURSE_LENGTH_OPTIONS = [
  "Less than 1 hour",
  "1-5 hours",
  "More than 5 hours",
] as const;

function normalizeCourseLength(raw?: string): string {
  const val = (raw || "").toLowerCase();
  if (val.includes("less than 1") || val.includes("< 1") || val.includes("short")) {
    return "Less than 1 hour";
  }
  if (val.includes("more than 5") || val.includes("> 5") || val.includes("comprehensive")) {
    return "More than 5 hours";
  }
  return "1-5 hours";
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  onClose,
  onSaveProfile,
  currentProfile,
  isInitialSetup = false,
}) => {
  const [formData, setFormData] = useState<UserProfile>({
    ...currentProfile,
    duration_preference: normalizeCourseLength(currentProfile.duration_preference),
  });
  const [activeTagBlock, setActiveTagBlock] = useState<"skills" | "interests" | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...currentProfile,
        duration_preference: normalizeCourseLength(currentProfile.duration_preference),
      });
      setActiveTagBlock(null);
    }
  }, [currentProfile, isOpen]);

  const careers = [
    "Data Scientist",
    "AI / Machine Learning Engineer",
    "Full Stack Web Developer",
    "Cloud & DevOps Engineer",
    "Cybersecurity Analyst",
    "Product Manager",
    "UI/UX Designer",
    "Business Intelligence Analyst",
  ];

  const suggestedCareerSkills = useMemo(() => {
    const matchedKey =
      Object.keys(CAREER_SKILLS_MAP).find(
        (k) =>
          k.toLowerCase().includes((formData.career_goal || "").toLowerCase()) ||
          (formData.career_goal || "").toLowerCase().includes(k.toLowerCase())
      ) || "Data Scientist";
    return CAREER_SKILLS_MAP[matchedKey] || CAREER_SKILLS_MAP["Data Scientist"];
  }, [formData.career_goal]);

  const suggestedInterests = [
    "Python",
    "Machine Learning",
    "Artificial Intelligence",
    "Data Science",
    "Web Development",
    "Java",
    "Cloud & DevOps",
    "Cybersecurity",
    "Computer Science",
  ];

  if (!isOpen) return null;

  const parseCommaList = (raw: string): string[] =>
    (raw || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const toggleCommaItem = (field: "skills" | "interests", item: string) => {
    const list = parseCommaList(formData[field]);
    const exists = list.some((x) => x.toLowerCase() === item.toLowerCase());
    const nextList = exists
      ? list.filter((x) => x.toLowerCase() !== item.toLowerCase())
      : [...list, item];
    setFormData({ ...formData, [field]: nextList.join(", ") });
  };

  const handleApplyCareerPreset = (career: string) => {
    const targetCareer = career || careers[0];
    const preset = CAREER_PRESETS[targetCareer];
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        career_goal: targetCareer,
        skills: preset.skills,
        interests: preset.interests,
      }));
    } else {
      setFormData((prev) => ({ ...prev, career_goal: targetCareer }));
    }
  };

  const handleSkillLevelChange = (level: "Beginner" | "Intermediate" | "Advanced") => {
    const consolidated = SKILL_LEVEL_PROFILES[level];
    setFormData((prev) => ({
      ...prev,
      preferred_difficulty: level,
      experience_level: level,
      learning_format: consolidated.learning_format,
      profession: consolidated.profession,
      education: consolidated.education,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const level = (formData.preferred_difficulty || "Beginner") as
      | "Beginner"
      | "Intermediate"
      | "Advanced";
    const consolidated = SKILL_LEVEL_PROFILES[level] || SKILL_LEVEL_PROFILES.Beginner;
    onSaveProfile({
      ...formData,
      career_goal: formData.career_goal || careers[0],
      preferred_difficulty: level,
      experience_level: level,
      duration_preference: normalizeCourseLength(formData.duration_preference),
      learning_format: formData.learning_format || consolidated.learning_format,
      profession: formData.profession || consolidated.profession,
      education: formData.education || consolidated.education,
    });
    onClose();
  };

  const currentSkillsList = parseCommaList(formData.skills);
  const currentInterestsList = parseCommaList(formData.interests);
  const activeLevel = (formData.preferred_difficulty || "Beginner") as
    | "Beginner"
    | "Intermediate"
    | "Advanced";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={() => {
        if (!isInitialSetup) onClose();
      }}
    >
      <div
        className="clay-panel-xl clay-scrollbar max-w-xl w-full max-h-[88vh] overflow-y-auto flex flex-col p-7 md:p-9 space-y-7"
        onClick={(e) => {
          e.stopPropagation();
          setActiveTagBlock(null);
        }}
      >
        {/* Minimal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-[var(--cl-01-ink)] tracking-tight">
              {isInitialSetup ? "Build Your Learning Profile" : "Profile Settings"}
            </h2>
            <p className="text-xs font-medium text-[var(--cl-01-mut)]">
              Personalize your skill level, topics, and preferred course length.
            </p>
          </div>

          {!isInitialSetup && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="clay-btn clay-btn-soft w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" strokeWidth={2.25} />
            </button>
          )}
        </div>

        {/* Minimal Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Name & Career Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--cl-01-mut)] pl-1 block">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Alex Hunter"
                className="w-full text-xs font-bold p-3.5 clay-inset text-[var(--cl-01-ink)]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between pl-1">
                <label className="text-xs font-bold text-[var(--cl-01-mut)]">
                  Career Goal *
                </label>
                <button
                  type="button"
                  onClick={() => handleApplyCareerPreset(formData.career_goal || careers[0])}
                  className="text-[11px] font-bold text-[var(--brand-primary)] hover:underline cursor-pointer"
                  title="Auto-fill recommended skills and interests for this career goal"
                >
                  Apply Preset
                </button>
              </div>
              <select
                value={formData.career_goal || careers[0]}
                onChange={(e) => setFormData({ ...formData, career_goal: e.target.value })}
                className="w-full text-xs font-bold p-3.5 clay-inset text-[var(--cl-01-ink)]"
              >
                {careers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Your Skills (Tags appear only when clicking this block) */}
          <div
            className="space-y-2.5"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTagBlock("skills");
            }}
          >
            <div className="flex items-center justify-between pl-1">
              <label className="text-xs font-bold text-[var(--cl-01-mut)]">
                Your Skills
              </label>
              <span className="text-[11px] font-medium text-[var(--cl-01-mut)]">
                {activeTagBlock === "skills" ? "Select tags below" : "Click to view skill tags"}
              </span>
            </div>
            <input
              type="text"
              value={formData.skills}
              onFocus={() => setActiveTagBlock("skills")}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="Python, SQL, Git"
              className="w-full text-xs font-bold p-3.5 clay-inset text-[var(--cl-01-ink)]"
            />
            {activeTagBlock === "skills" && (
              <div className="flex items-center gap-2 flex-wrap pt-1.5">
                {suggestedCareerSkills.slice(0, 8).map((skill) => {
                  const active = currentSkillsList.some(
                    (s) => s.toLowerCase() === skill.toLowerCase()
                  );
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleCommaItem("skills", skill)}
                      className={`clay-btn px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 ${
                        active ? "clay-btn-primary" : "clay-btn-soft"
                      }`}
                    >
                      {active ? (
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      ) : (
                        <Plus className="w-3 h-3" strokeWidth={2.5} />
                      )}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 3: Learning Interests & Topics (Tags appear only when clicking this block) */}
          <div
            className="space-y-2.5"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTagBlock("interests");
            }}
          >
            <div className="flex items-center justify-between pl-1">
              <label className="text-xs font-bold text-[var(--cl-01-mut)]">
                Learning Interests &amp; Topics
              </label>
              <span className="text-[11px] font-medium text-[var(--cl-01-mut)]">
                {activeTagBlock === "interests" ? "Select tags below" : "Click to view topic tags"}
              </span>
            </div>
            <input
              type="text"
              value={formData.interests}
              onFocus={() => setActiveTagBlock("interests")}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              placeholder="AI, Data Science, Web Development"
              className="w-full text-xs font-bold p-3.5 clay-inset text-[var(--cl-01-ink)]"
            />
            {activeTagBlock === "interests" && (
              <div className="flex items-center gap-2 flex-wrap pt-1.5">
                {suggestedInterests.map((topic) => {
                  const active = currentInterestsList.some(
                    (i) => i.toLowerCase() === topic.toLowerCase()
                  );
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleCommaItem("interests", topic)}
                      className={`clay-btn px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 ${
                        active ? "clay-btn-primary" : "clay-btn-soft"
                      }`}
                    >
                      {active ? (
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      ) : (
                        <Plus className="w-3 h-3" strokeWidth={2.5} />
                      )}
                      <span>{topic}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 4: Consolidated Skill Level & 3-Type Course Length */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            {/* Consolidated Skill Level (absorbs Learning Format, Role, and Education) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--cl-01-mut)] pl-1 block">
                Skill Level (Format, Role &amp; Education)
              </label>
              <select
                value={activeLevel}
                onChange={(e) =>
                  handleSkillLevelChange(
                    e.target.value as "Beginner" | "Intermediate" | "Advanced"
                  )
                }
                className="w-full text-xs font-bold p-3.5 clay-inset text-[var(--cl-01-ink)]"
              >
                {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {SKILL_LEVEL_PROFILES[lvl].label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-medium text-[var(--cl-01-mut)] pl-1">
                {SKILL_LEVEL_PROFILES[activeLevel]?.summary}
              </p>
            </div>

            {/* 3-Type Course Length */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--cl-01-mut)] pl-1 block">
                Course Length
              </label>
              <select
                value={normalizeCourseLength(formData.duration_preference)}
                onChange={(e) =>
                  setFormData({ ...formData, duration_preference: e.target.value })
                }
                className="w-full text-xs font-bold p-3.5 clay-inset text-[var(--cl-01-ink)]"
              >
                {COURSE_LENGTH_OPTIONS.map((dp) => (
                  <option key={dp} value={dp}>
                    {dp}
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-medium text-[var(--cl-01-mut)] pl-1">
                Recommendations prioritize videos in this duration range.
              </p>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex items-center justify-end gap-3">
            {!isInitialSetup && (
              <button
                type="button"
                onClick={onClose}
                className="clay-btn clay-btn-soft px-5 py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="clay-btn clay-btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.25} />
              <span>Save &amp; Recommend Courses</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
