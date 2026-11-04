import { Course, UserProfile, RecommendationWeights, RoadmapStep } from "../types";

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  interest_match: 0.28,
  skill_match: 0.20,
  career_goal_match: 0.18,
  difficulty_match: 0.14,
  rating_match: 0.08,
  duration_match: 0.12,
};

export const CAREER_SKILLS_MAP: Record<string, string[]> = {
  "Data Scientist": [
    "Python", "SQL", "Pandas", "NumPy", "Statistics", "Machine Learning",
    "Scikit-learn", "Data Visualization", "Exploratory Data Analysis", "Deep Learning"
  ],
  "Machine Learning Engineer": [
    "Python", "Scikit-learn", "PyTorch", "TensorFlow", "Deep Learning",
    "Docker", "MLOps", "Git", "Linear Algebra", "Model Deployment"
  ],
  "AI Engineer": [
    "Python", "PyTorch", "Artificial Intelligence", "LLMs", "Transformers",
    "Prompt Engineering", "LangChain", "Deep Learning", "REST APIs"
  ],
  "Full Stack Developer": [
    "HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Node.js",
    "Express.js", "SQL", "MongoDB", "Git", "Tailwind CSS", "REST APIs"
  ],
  "Frontend Developer": [
    "HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Next.js",
    "Tailwind CSS", "Redux", "UI/UX", "Responsive Design", "Web Development"
  ],
  "Backend Engineer": [
    "Python", "Java", "Node.js", "SQL", "PostgreSQL", "REST APIs",
    "Docker", "Microservices", "Spring Boot", "FastAPI", "Computer Science"
  ],
  "DevOps Engineer": [
    "Linux", "Docker", "Kubernetes", "CI/CD", "GitHub Actions",
    "AWS", "Terraform", "Cloud Computing", "Bash Scripting", "Monitoring"
  ],
  "Cloud Architect": [
    "AWS", "GCP", "Azure", "Cloud Security", "Networking",
    "Microservices", "Kubernetes", "IAM", "High Availability", "Terraform"
  ],
  "Cybersecurity Analyst": [
    "Network Security", "Ethical Hacking", "Cryptography", "Wireshark",
    "Cybersecurity", "SIEM", "Incident Response", "Linux", "Threat Modeling"
  ],
  "UI/UX Designer": [
    "Figma", "User Research", "Wireframing", "Design Systems",
    "Usability Testing", "UX Prototyping", "Design Tokens", "Accessibility"
  ],
  "Business Analyst": [
    "SQL", "Tableau", "Power BI", "Excel", "Data Storytelling",
    "Business Intelligence", "KPI Dashboards", "Data Modeling"
  ]
};

export const EDUCATIONAL_CATEGORIES: Record<string, string[]> = {
  "Python": ["python", "django", "fastapi", "flask", "pandas", "numpy", "pytest"],
  "Java": ["java", "spring boot", "jvm", "maven", "hibernate", "jakarta"],
  "Artificial Intelligence": ["artificial intelligence", "generative ai", "llm", "langchain", "openai", "gemini", "neural network", "nlp", "computer vision", "transformers", "ai course", "ai tutorial"],
  "Machine Learning": ["machine learning", "scikit-learn", "tensorflow", "pytorch", "deep learning", "regression", "classification", "mlops", "xgboost"],
  "Web Development": ["web development", "html", "css", "javascript", "typescript", "react", "next.js", "node.js", "frontend", "backend", "full stack", "tailwind"],
  "Data Science": ["data science", "data analysis", "data analytics", "pandas", "numpy", "matplotlib", "tableau", "power bi", "statistics", "sql"],
  "Computer Science": ["computer science", "algorithms", "data structures", "operating systems", "system design", "c++", "c programming", "compilers", "networking", "cs50"],
  "Programming Languages": ["python", "java", "javascript", "typescript", "c++", "c#", "golang", "rust", "kotlin", "swift", "programming"],
  "Cloud & DevOps": ["aws", "azure", "gcp", "cloud", "docker", "kubernetes", "devops", "terraform", "ci/cd", "linux"],
  "Cybersecurity": ["cybersecurity", "ethical hacking", "network security", "penetration testing", "cryptography", "infosec"]
};

const KNOWN_SKILLS = [
  "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "SQL",
  "HTML", "CSS", "React", "Next.js", "Node.js", "Express", "Django", "FastAPI",
  "Spring Boot", "Machine Learning", "Deep Learning", "Artificial Intelligence",
  "PyTorch", "TensorFlow", "Scikit-learn", "Pandas", "NumPy", "Data Science",
  "Data Analysis", "Data Structures", "Algorithms", "Computer Science", "Git",
  "Docker", "Kubernetes", "AWS", "Cloud Computing", "Linux", "Cybersecurity",
  "NLP", "LLMs", "Generative AI", "PostgreSQL", "MongoDB", "System Design"
];

/**
 * OOP Class: UserPreferences
 * Stores and normalizes user-selected learning preferences, skill level,
 * preferred programming languages/technologies, learning format, duration preference,
 * and career objectives to construct targeted YouTube course queries.
 */
export class UserPreferences {
  public readonly name: string;
  public readonly interests: string[];
  public readonly skills: string[];
  public readonly careerGoal: string;
  public readonly skillLevel: "Beginner" | "Intermediate" | "Advanced";
  public readonly preferredDifficulty: "Beginner" | "Intermediate" | "Advanced";
  public readonly weeklyHours: number;
  public readonly durationPreference: string;
  public readonly learningFormat: string;
  public readonly profession: string;
  public readonly education: string;

  constructor(profile: UserProfile) {
    this.name = profile.name || "Learner";
    this.interests = (profile.interests || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    this.skills = (profile.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    this.careerGoal = (profile.career_goal || "Software Engineer").trim();
    this.skillLevel = profile.experience_level || "Beginner";
    this.preferredDifficulty =
      profile.preferred_difficulty || profile.experience_level || "Beginner";
    this.weeklyHours = Math.max(1, Number(profile.weekly_hours) || 10);
    this.durationPreference = profile.duration_preference || "1-5 hours";
    this.learningFormat = profile.learning_format || "Self-paced online video";
    this.profession = (profile.profession || "").trim();
    this.education = (profile.education || "").trim();
  }

  /**
   * Identifies target skills required for the user's career goal that are not yet in their current skills list.
   */
  public getMissingCareerSkills(): string[] {
    const matchedCareer =
      Object.keys(CAREER_SKILLS_MAP).find(
        (k) =>
          k.toLowerCase().includes(this.careerGoal.toLowerCase()) ||
          this.careerGoal.toLowerCase().includes(k.toLowerCase())
      ) || "Data Scientist";

    const targetSkills = CAREER_SKILLS_MAP[matchedCareer] || [];
    const ownedLower = new Set(this.skills.map((s) => s.toLowerCase()));
    return targetSkills.filter((skill) => !ownedLower.has(skill.toLowerCase()));
  }

  /**
   * Maps the user's duration_preference (Less than 1 hour, 1-5 hours, More than 5 hours)
   * and learning_format into YouTube course search keywords.
   */
  public getFormatSearchModifier(): string {
    const dur = this.durationPreference.toLowerCase();

    if (dur.includes("less than 1") || dur.includes("< 1") || dur.includes("short")) {
      return "crash course tutorial";
    }
    if (dur.includes("more than 5") || dur.includes("> 5") || dur.includes("comprehensive")) {
      return "complete masterclass full course";
    }
    if (dur.includes("1-5") || dur.includes("1–5")) {
      return "full course tutorial";
    }

    const fmt = this.learningFormat.toLowerCase();
    if (fmt.includes("project") || fmt.includes("hands-on")) {
      return "hands-on project full course tutorial";
    }
    if (fmt.includes("bootcamp")) {
      return "complete bootcamp full course";
    }
    if (fmt.includes("academic") || fmt.includes("lecture")) {
      return "university lecture full course";
    }
    return "full course tutorial";
  }

  private deduplicateTerms(terms: string[]): string {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of terms) {
      const cleaned = raw.trim();
      if (!cleaned) continue;
      const lower = cleaned.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        out.push(cleaned);
      }
    }
    return out.join(" ").replace(/\s+/g, " ").trim();
  }

  public buildSearchQuery(customTopic?: string, categoryFilter?: string): string {
    if (customTopic && customTopic.trim().length > 0) {
      const clean = customTopic.trim();
      const lower = clean.toLowerCase();
      if (lower.includes("course") || lower.includes("tutorial") || lower.includes("lecture")) {
        return clean;
      }
      return `${clean} ${this.preferredDifficulty.toLowerCase()} ${this.getFormatSearchModifier()}`;
    }
    if (categoryFilter && categoryFilter !== "All") {
      return `${categoryFilter} ${this.preferredDifficulty.toLowerCase()} ${this.getFormatSearchModifier()}`;
    }
    const primaryInterest = this.interests[0] || this.careerGoal || "Python programming";
    const primarySkill =
      this.skills.find((s) => s.toLowerCase() !== primaryInterest.toLowerCase()) || "";
    return this.deduplicateTerms([
      this.careerGoal,
      primaryInterest,
      primarySkill,
      this.preferredDifficulty.toLowerCase(),
      this.getFormatSearchModifier(),
    ]);
  }

  /**
   * Generates up to 3 complementary YouTube search queries directly from the user's built profile settings:
   * 1. Career Goal + Primary Interest + Preferred Difficulty + Format/Duration modifier
   * 2. User's Interests + Current Skills + Difficulty
   * 3. Career Skill-Gap Growth Query (missing career skills) or Secondary Interests
   */
  public buildProfileSearchQueries(): string[] {
    const queries: string[] = [];
    const levelTag = this.preferredDifficulty.toLowerCase();
    const modifier = this.getFormatSearchModifier();

    // Query 1: Career Goal + Primary Interest + Difficulty + Format
    const topInterest =
      this.interests.find((i) => i.toLowerCase() !== this.careerGoal.toLowerCase()) ||
      this.interests[0] ||
      "";
    const q1 = this.deduplicateTerms([this.careerGoal, topInterest, levelTag, modifier]);
    if (q1) queries.push(q1);

    // Query 2: Explicit Interests + Current Skills
    const interestSlice = this.interests.slice(0, 2);
    const skillSlice = this.skills.slice(0, 2);
    if (interestSlice.length > 0 || skillSlice.length > 0) {
      const q2 = this.deduplicateTerms([
        ...interestSlice,
        ...skillSlice,
        levelTag,
        "full course tutorial",
      ]);
      if (q2 && !queries.some((existing) => existing.toLowerCase() === q2.toLowerCase())) {
        queries.push(q2);
      }
    }

    // Query 3: Career Skill-Gap Bridge or Additional Interests
    const missingSkills = this.getMissingCareerSkills().slice(0, 2);
    const extraInterests = this.interests.slice(2, 4);
    const facet3 =
      extraInterests.length > 0
        ? [...extraInterests, this.careerGoal, levelTag, "full course"]
        : missingSkills.length > 0
        ? [this.careerGoal, ...missingSkills, levelTag, "tutorial course"]
        : this.skills.length > 2
        ? [...this.skills.slice(2, 4), this.careerGoal, levelTag, "course"]
        : [];

    if (facet3.length > 0) {
      const q3 = this.deduplicateTerms(facet3);
      if (q3 && !queries.some((existing) => existing.toLowerCase() === q3.toLowerCase())) {
        queries.push(q3);
      }
    }

    return queries.slice(0, 3);
  }

  public getCompositeProfileText(): string {
    return [
      this.careerGoal,
      this.careerGoal,
      ...this.interests,
      ...this.interests,
      ...this.skills,
      ...this.getMissingCareerSkills().slice(0, 3),
      this.preferredDifficulty,
      this.learningFormat,
      this.profession,
    ].join(" ");
  }
}

/**
 * OOP Class: CourseModel
 * Represents and validates a genuine YouTube educational video course.
 */
export class CourseModel {
  public static isValidVideoId(videoId: string | undefined | null): boolean {
    if (!videoId || typeof videoId !== "string") return false;
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId.trim());
  }

  public static inferDifficulty(
    title: string,
    description: string,
    fallbackLevel: "Beginner" | "Intermediate" | "Advanced" = "Beginner"
  ): "Beginner" | "Intermediate" | "Advanced" {
    const text = `${title} ${description}`.toLowerCase();
    if (
      /\b(advanced|expert|masterclass|deep dive|production|architecture|system design|internals|optimization)\b/.test(
        text
      )
    ) {
      return "Advanced";
    }
    if (
      /\b(beginner|beginners|from scratch|crash course|introduction|intro to|basics|fundamentals|101|zero to hero|start here)\b/.test(
        text
      )
    ) {
      return "Beginner";
    }
    if (
      /\b(intermediate|hands-on|practical|applied|projects|bootcamp|full course)\b/.test(text)
    ) {
      return "Intermediate";
    }
    return fallbackLevel;
  }

  public static inferCategory(title: string, description: string, queryHint?: string): string {
    const titleLower = title.toLowerCase();
    const fullLower = `${title} ${description} ${queryHint || ""}`.toLowerCase();

    // Check title first for strongest signal
    for (const [category, keywords] of Object.entries(EDUCATIONAL_CATEGORIES)) {
      if (category === "Programming Languages") continue;
      if (keywords.some((kw) => titleLower.includes(kw))) {
        return category;
      }
    }

    for (const [category, keywords] of Object.entries(EDUCATIONAL_CATEGORIES)) {
      if (category === "Programming Languages") continue;
      if (keywords.some((kw) => fullLower.includes(kw))) {
        return category;
      }
    }

    return "Computer Science";
  }

  public static extractSkills(title: string, description: string, category: string): string {
    const combined = `${title} ${description}`;
    const found: string[] = [];

    for (const skill of KNOWN_SKILLS) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(combined)) {
        found.push(skill);
      }
    }

    if (!found.includes(category) && category !== "All") {
      found.unshift(category);
    }

    if (found.length === 0) {
      found.push(category, "Programming", "Problem Solving");
    }

    return Array.from(new Set(found)).slice(0, 6).join(", ");
  }

  public static formatViews(viewCount: number | undefined): string {
    if (viewCount === undefined || viewCount === null || isNaN(viewCount) || viewCount <= 0) {
      return "Views unavailable";
    }
    if (viewCount >= 1_000_000) {
      return `${(viewCount / 1_000_000).toFixed(1)}M views`;
    }
    if (viewCount >= 1_000) {
      return `${(viewCount / 1_000).toFixed(1)}K views`;
    }
    return `${viewCount.toLocaleString()} views`;
  }
}

/**
 * OOP Class: RecommendationEngine
 * Processes user preferences, filters out unrelated/non-educational videos,
 * and ranks genuine YouTube courses based on multi-factor profile relevance.
 */
export class RecommendationEngine {
  private weights: RecommendationWeights;

  constructor(weights: RecommendationWeights = DEFAULT_WEIGHTS) {
    this.weights = { ...weights };
  }

  public setWeights(weights: RecommendationWeights): void {
    this.weights = { ...weights };
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase().match(/\b[a-z0-9+#.-]{2,}\b/g) || [];
  }

  private calculateCosineSimilarity(text1: string, text2: string): number {
    const tokens1 = this.tokenize(text1);
    const tokens2 = this.tokenize(text2);
    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const vocabulary = Array.from(new Set([...tokens1, ...tokens2]));
    const vec1 = vocabulary.map((w) => tokens1.filter((t) => t === w).length);
    const vec2 = vocabulary.map((w) => tokens2.filter((t) => t === w).length);

    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
  }

  private matchKeywordOverlap(items: string[], targetText: string): number {
    if (!items || items.length === 0) return 0.5;
    const targetLower = targetText.toLowerCase();
    const matched = items.filter((item) => {
      const term = item.trim().toLowerCase();
      if (!term) return false;
      if (targetLower.includes(term)) return true;
      const parts = term.split(/[\s/&,-]+/).filter((w) => w.length > 2);
      return parts.length > 0 && parts.some((p) => targetLower.includes(p));
    }).length;
    return Math.min(1.0, matched / Math.max(1, Math.min(3, items.length)));
  }

  private scoreDifficulty(userDiff: string, courseDiff: string): number {
    const levels: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
    const u = levels[userDiff.toLowerCase()] || 1;
    const c = levels[courseDiff.toLowerCase()] || 1;
    const diff = Math.abs(u - c);
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.65;
    return 0.30;
  }

  private scoreDurationAndFormat(
    durationPref: string,
    learningFormat: string,
    hours: number,
    courseText: string
  ): number {
    const pref = (durationPref || "").toLowerCase();
    let durScore = 0.85;

    if (pref.includes("less than 1") || pref.includes("< 1") || pref.includes("short")) {
      if (hours <= 1.0) {
        durScore = 1.0;
      } else if (hours <= 2.2) {
        durScore = 0.55;
      } else {
        durScore = 0.2;
      }
    } else if (pref.includes("more than 5") || pref.includes("> 5") || pref.includes("comprehensive")) {
      if (hours > 5.0) {
        durScore = 1.0;
      } else if (hours >= 2.5) {
        durScore = 0.6;
      } else {
        durScore = 0.2;
      }
    } else {
      // "1-5 hours" (or default medium range)
      if (hours >= 1.0 && hours <= 5.0) {
        durScore = 1.0;
      } else if (hours > 0.5 && hours <= 7.5) {
        durScore = 0.6;
      } else {
        durScore = 0.25;
      }
    }

    const fmt = (learningFormat || "").toLowerCase();
    const lowerText = courseText.toLowerCase();
    let formatBonus = 0;
    if (
      (fmt.includes("project") || fmt.includes("hands-on")) &&
      /\b(project|projects|hands-on|build|practical|portfolio)\b/.test(lowerText)
    ) {
      formatBonus = 0.08;
    } else if (
      fmt.includes("bootcamp") &&
      /\b(bootcamp|complete|zero to hero|masterclass|full course)\b/.test(lowerText)
    ) {
      formatBonus = 0.08;
    } else if (
      fmt.includes("academic") &&
      /\b(lecture|university|mit|stanford|harvard|cs50|fundamentals)\b/.test(lowerText)
    ) {
      formatBonus = 0.08;
    }

    return Math.min(1.0, durScore + formatBonus);
  }

  /**
   * Verifies that a video is genuinely educational, at least 10 minutes long, and relevant,
   * avoiding recommending unrelated entertainment/music/gaming or <10 min videos.
   */
  public isEducationalAndRelevant(course: Course, searchQuery?: string): boolean {
    if (!CourseModel.isValidVideoId(course.video_id || course.course_id)) {
      return false;
    }
    // Ignore any video which is under 10 minutes (< 10/60 hours)
    if (!course.duration_hours || course.duration_hours < 10 / 60) {
      return false;
    }
    const text = `${course.title} ${course.description} ${course.category} ${course.skills}`.toLowerCase();

    // Reject obvious non-course entertainment noise
    const nonEducationalPatterns = /\b(music video|official lyric|movie trailer|gameplay walkthrough|prank|vlog|tiktok compilation|unboxing|asmr|funny moments)\b/i;
    if (nonEducationalPatterns.test(text)) {
      return false;
    }

    // If a specific search query is provided, verify meaningful token relevance
    if (searchQuery && searchQuery.trim().length > 0) {
      const stopWords = new Set(["the", "and", "for", "with", "course", "courses", "tutorial", "tutorials", "full", "learn", "how", "to", "in", "of"]);
      const queryTokens = this.tokenize(searchQuery).filter((t) => !stopWords.has(t));
      if (queryTokens.length > 0) {
        const matchedTokens = queryTokens.filter((qt) => text.includes(qt));
        if (matchedTokens.length === 0) {
          return false;
        }
      }
    }

    return true;
  }

  public rankCourses(
    profile: UserProfile,
    courses: Course[],
    topN: number = 24,
    searchQuery?: string
  ): Course[] {
    if (!courses || courses.length === 0) return [];

    const prefs = new UserPreferences(profile);
    const missingCareerSkills = prefs.getMissingCareerSkills();
    const userText = prefs.getCompositeProfileText();

    const validCourses = courses.filter((c) => this.isEducationalAndRelevant(c, searchQuery));
    if (validCourses.length === 0) return [];

    const scored = validCourses.map((course) => {
      // Weight title 2x for stronger topical precision
      const courseText = `${course.title} ${course.title} ${course.category} ${course.description} ${course.skills} ${course.career_outcomes}`;
      const searchableLower = courseText.toLowerCase();

      const semanticSim = this.calculateCosineSimilarity(
        searchQuery ? `${searchQuery} ${userText}` : userText,
        courseText
      );

      const titleOverlap = this.matchKeywordOverlap(
        [...prefs.interests, ...prefs.skills, prefs.careerGoal],
        `${course.title} ${course.category}`
      );
      const interestScore = Math.min(
        1.0,
        Math.max(
          semanticSim * 1.45,
          titleOverlap,
          this.matchKeywordOverlap(
            prefs.interests,
            `${course.category} ${course.skills} ${course.title}`
          )
        )
      );

      // Skill match considers both user's existing skills and target career skill gaps
      const combinedTargetSkills = [...prefs.skills, ...missingCareerSkills.slice(0, 4)];
      const skillScore = this.matchKeywordOverlap(
        combinedTargetSkills,
        `${course.skills} ${course.title} ${course.description}`
      );

      const careerScore = this.matchKeywordOverlap(
        [prefs.careerGoal, prefs.profession].filter(Boolean),
        `${course.career_outcomes} ${course.title} ${course.category} ${course.skills}`
      );
      const diffScore = this.scoreDifficulty(prefs.preferredDifficulty, course.difficulty);

      // Engagement signal from real YouTube views & rating
      const views = course.view_count || course.num_reviews || 0;
      const popularityScore =
        views > 0 ? Math.min(1.0, Math.log10(Math.max(10, views)) / 6.5) : 0.7;
      const durationScore = this.scoreDurationAndFormat(
        prefs.durationPreference,
        prefs.learningFormat,
        course.duration_hours,
        courseText
      );

      // Fuzzy Logic compatibility + Bayesian posterior suitability + Forward-chaining Rule bonus
      const fuzzyCompatibility = diffScore === 1.0 ? 0.92 : diffScore >= 0.65 ? 0.62 : 0.25;
      const bayesianPrior = careerScore >= 0.5 ? 0.65 : 0.45;
      const bayesianLikelihood = (interestScore * 0.5 + skillScore * 0.5);
      const bayesianPosterior =
        (bayesianPrior * Math.max(0.2, bayesianLikelihood)) /
        Math.max(
          0.05,
          bayesianPrior * Math.max(0.2, bayesianLikelihood) +
            (1 - bayesianPrior) * (1 - Math.min(0.9, bayesianLikelihood * 0.8))
        );

      // Rule Engine check (IF AI/Data career AND Python/Math foundation -> boost ML/AI course)
      const hasPython = prefs.skills.some((s) => s.toLowerCase().includes("python"));
      const ruleBonus =
        hasPython &&
        (prefs.careerGoal.toLowerCase().includes("ai") ||
          prefs.careerGoal.toLowerCase().includes("data") ||
          prefs.careerGoal.toLowerCase().includes("machine learning")) &&
        searchableLower.includes("machine learning")
          ? 0.08
          : 0;

      const rawScore = Math.min(
        1.0,
        Math.max(
          0.0,
          interestScore * this.weights.interest_match +
            skillScore * this.weights.skill_match +
            careerScore * this.weights.career_goal_match +
            fuzzyCompatibility * this.weights.difficulty_match +
            bayesianPosterior * this.weights.rating_match +
            durationScore * this.weights.duration_match +
            ruleBonus
        )
      );

      // Actual calculated percentage without artificial [60, 99] clamping
      const matchPercent = Math.round(rawScore * 100);

      // Identify concrete profile matches to explain why this YouTube course was recommended
      const matchedInterests = prefs.interests.filter((i) =>
        searchableLower.includes(i.toLowerCase())
      );
      const matchedUserSkills = prefs.skills.filter((s) =>
        searchableLower.includes(s.toLowerCase())
      );
      const matchedGapSkills = missingCareerSkills.filter((s) =>
        searchableLower.includes(s.toLowerCase())
      );

      const reasons: string[] = [];
      if (careerScore >= 0.45 && prefs.careerGoal) {
        reasons.push(`aligned with your ${prefs.careerGoal} goal`);
      }
      if (matchedInterests.length > 0) {
        reasons.push(`TF-IDF match for ${matchedInterests.slice(0, 2).join(" & ")}`);
      } else if (interestScore > 0.25) {
        reasons.push(`TF-IDF content similarity ${(interestScore * 100).toFixed(0)}%`);
      }
      if (matchedGapSkills.length > 0) {
        reasons.push(`bridges skill gap in ${matchedGapSkills.slice(0, 2).join(", ")}`);
      } else if (matchedUserSkills.length > 0) {
        reasons.push(`advances ${matchedUserSkills.slice(0, 2).join(", ")}`);
      }
      if (durationScore >= 0.9) {
        reasons.push(`matches ${prefs.durationPreference} length (${course.duration_hours}h)`);
      }
      reasons.push(
        `Fuzzy ${course.difficulty} fit ${(fuzzyCompatibility * 100).toFixed(0)}% · Bayesian P(Suitable)=${(
          bayesianPosterior * 100
        ).toFixed(0)}%`
      );
      if (ruleBonus > 0) {
        reasons.push(`Rule R1 fired (Python -> Machine Learning)`);
      }

      const why_recommended = `Recommended from ${
        course.channel_title || course.instructor
      }: ${reasons.slice(0, 3).join(" • ")}.`;

      return {
        ...course,
        recommendation_score: matchPercent,
        why_recommended,
      };
    });

    scored.sort(
      (a, b) =>
        (b.recommendation_score || 0) - (a.recommendation_score || 0) ||
        (b.view_count || 0) - (a.view_count || 0)
    );

    return scored.slice(0, topN);
  }
}

export function recommendCourses(
  profile: UserProfile,
  courses: Course[],
  weights: RecommendationWeights = DEFAULT_WEIGHTS,
  topN: number = 12
): Course[] {
  const engine = new RecommendationEngine(weights);
  return engine.rankCourses(profile, courses, topN);
}

/**
 * Extracts all skills gained from completing a course, including explicit course.skills
 * and any matching target career skills covered by the course title, category, or description.
 */
export function extractCompletedCourseSkills(course: Course, careerGoal?: string): string[] {
  const explicitSkills = (course.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const combinedText = `${course.title} ${course.skills} ${course.category} ${course.description}`.toLowerCase();

  const matchedCareer =
    Object.keys(CAREER_SKILLS_MAP).find(
      (k) =>
        careerGoal &&
        (k.toLowerCase().includes(careerGoal.toLowerCase()) ||
          careerGoal.toLowerCase().includes(k.toLowerCase()))
    ) || "AI Engineer";

  const careerSkills = CAREER_SKILLS_MAP[matchedCareer] || [];
  const matchedTargetSkills = careerSkills.filter((reqSkill) =>
    combinedText.includes(reqSkill.toLowerCase())
  );

  return Array.from(new Set([...explicitSkills, ...matchedTargetSkills]));
}

export function analyzeSkillGap(
  careerGoal: string,
  currentSkills: string[],
  allCourses: Course[],
  completedCourses: Course[] = []
) {
  const matchedCareer =
    Object.keys(CAREER_SKILLS_MAP).find(
      (k) =>
        careerGoal &&
        (k.toLowerCase().includes(careerGoal.toLowerCase()) ||
          careerGoal.toLowerCase().includes(k.toLowerCase()))
    ) || "AI Engineer";

  const required = CAREER_SKILLS_MAP[matchedCareer] || CAREER_SKILLS_MAP["AI Engineer"];

  // Combine user's profile skills with all skills extracted from completed courses
  const completedExtracted = completedCourses.flatMap((c) =>
    extractCompletedCourseSkills(c, careerGoal)
  );
  const allUserSkills = [...currentSkills, ...completedExtracted]
    .map((s) => s.trim())
    .filter(Boolean);
  const currentNormalized = new Set(allUserSkills.map((s) => s.toLowerCase()));
  const completedIds = new Set(completedCourses.map((c) => c.course_id));

  const isSkillAcquired = (reqSkill: string): boolean => {
    const reqLower = reqSkill.toLowerCase();
    if (currentNormalized.has(reqLower)) return true;
    for (const owned of currentNormalized) {
      if (owned.length >= 3 && (owned.includes(reqLower) || reqLower.includes(owned))) {
        return true;
      }
    }
    return false;
  };

  const acquired = required.filter((r) => isSkillAcquired(r));
  const missing = required.filter((r) => !isSkillAcquired(r));

  const availableCourses = allCourses.filter((c) => !completedIds.has(c.course_id));
  const candidatePool = availableCourses.length > 0 ? availableCourses : allCourses;

  const gapCourses = missing
    .slice(0, 4)
    .map((skill, idx) => {
      const match =
        candidatePool.find(
          (c) =>
            c.skills.toLowerCase().includes(skill.toLowerCase()) ||
            c.title.toLowerCase().includes(skill.toLowerCase()) ||
            c.description.toLowerCase().includes(skill.toLowerCase())
        ) || candidatePool[idx % Math.max(1, candidatePool.length)];
      return match ? { skill, course: match } : null;
    })
    .filter((item): item is { skill: string; course: Course } => item !== null);

  const readinessPercent = Math.round((acquired.length / Math.max(1, required.length)) * 100);

  return {
    careerGoal: careerGoal || matchedCareer,
    required,
    acquired,
    missing,
    readinessPercent,
    gapCourses,
  };
}

export function generateRoadmapSteps(
  careerGoal: string,
  allCourses: Course[],
  experienceLevel: string = "Beginner",
  acquiredSkills: string[] = []
): RoadmapStep[] {
  const matchedCareer =
    Object.keys(CAREER_SKILLS_MAP).find(
      (k) =>
        careerGoal &&
        (k.toLowerCase().includes(careerGoal.toLowerCase()) ||
          careerGoal.toLowerCase().includes(k.toLowerCase()))
    ) || "AI Engineer";

  const rawSkills = CAREER_SKILLS_MAP[matchedCareer] || CAREER_SKILLS_MAP["AI Engineer"];
  const acquiredSet = new Set(acquiredSkills.map((s) => s.trim().toLowerCase()));

  const normalizedLevel: "Beginner" | "Intermediate" | "Advanced" =
    experienceLevel === "Intermediate" || experienceLevel === "Advanced"
      ? experienceLevel
      : "Beginner";

  const titlesByLevel: Record<"Beginner" | "Intermediate" | "Advanced", string[]> = {
    Beginner: [
      "Foundational Prerequisites & Core Syntax",
      "Mathematical & Data Structures Layer",
      "Core Domain Frameworks & Algorithms",
      "Applied Hands-On Projects & Workflows",
      "Entry-Level Portfolio & Readiness",
    ],
    Intermediate: [
      "Intermediate Architecture & Design Patterns",
      "Scalable Data Pipelines & Optimization",
      "Production Frameworks & System Integration",
      "Testing, Debugging & Performance Tuning",
      "End-to-End Real-World Deployment",
    ],
    Advanced: [
      "Advanced Distributed Systems & Internals",
      "High-Performance Architecture & Scaling",
      "Cutting-Edge Research & Domain Mastery",
      "Enterprise Security, Reliability & MLOps/DevOps",
      "Principal-Level System Design & Leadership",
    ],
  };

  const titles = titlesByLevel[normalizedLevel];

  return titles.map((title, idx) => {
    const startIdx = idx * 2;
    const stepSkillList = rawSkills.slice(startIdx, startIdx + 2);
    const stepSkills =
      stepSkillList.join(", ") || rawSkills[rawSkills.length - 1] || "Core Skills";

    const levelMatchedCourse = allCourses.find(
      (c) =>
        c.difficulty === normalizedLevel &&
        stepSkillList.some(
          (s) =>
            c.skills.toLowerCase().includes(s.trim().toLowerCase()) ||
            c.title.toLowerCase().includes(s.trim().toLowerCase())
        )
    );

    const matchingCourse =
      levelMatchedCourse ||
      allCourses.find((c) =>
        stepSkillList.some(
          (s) =>
            c.skills.toLowerCase().includes(s.trim().toLowerCase()) ||
            c.title.toLowerCase().includes(s.trim().toLowerCase())
        )
      ) ||
      allCourses[idx % Math.max(1, allCourses.length)];

    const isAcquired =
      stepSkillList.length > 0 &&
      stepSkillList.every((s) => acquiredSet.has(s.trim().toLowerCase()));

    return {
      id: idx + 1,
      step_number: idx + 1,
      title: `Step ${idx + 1}: ${title}`,
      description: `Build ${normalizedLevel.toLowerCase()}-level proficiency in ${stepSkills} through structured hands-on practice and applied coursework for ${
        careerGoal || matchedCareer
      }.`,
      skills: stepSkills,
      recommended_course_id: matchingCourse?.course_id,
      recommended_course: matchingCourse,
      completed: isAcquired,
    };
  });
}
