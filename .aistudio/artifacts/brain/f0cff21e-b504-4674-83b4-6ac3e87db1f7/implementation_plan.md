# Smart Course Recommendation System — Architecture & AI Upgrade Plan

## 1. Executive Summary & Architectural Goals

This upgrade refactors and expands the **Smart Course Recommendation System** into a modular, object-oriented Python application (`smart_course_recommendation/`) designed for academic rigor in Artificial Intelligence, software architecture, and clean UI/UX design.

Based on your preferences:
- **Strict Live YouTube API Integration**: All course searches and recommendations query the live YouTube Data API v3 (`search.list` and `videos.list`) using `YOUTUBE_API_KEY`. No fabricated course links, fake ratings, or dummy datasets are used. If no API key is configured or no courses match, the system displays clear, actionable guidance.
- **Strictly Empty Initial Student Profile**: First launch initializes a clean, empty student profile in SQLite without pre-filled sample presets, enabling genuine end-to-end profile creation and evaluation.
- **Zero Pricing / Budget Fields**: All courses come from free YouTube educational content; no price or budget logic appears anywhere in the data models, scoring, database, or UI.
- **Dual Delivery (Complete Python Tkinter Desktop Package + Live AI Studio Preview)**:
  - The full multi-package Python OOP desktop application (`Tkinter`/`ttk` + `SQLite` + `scikit-learn` + `YouTube API v3` + `Gemini AI`) is built in `smart_course_recommendation/` and packaged into `public/smart_course_recommendation.zip` for 1-click download and local execution via `python main.py` or `run.bat`.
  - The AI Studio web preview on port 3000 reflects the upgraded AI syllabus algorithms (TF-IDF, BFS/DFS/A* roadmaps, Rule Engine, Bayesian & Fuzzy Logic scoring, live YouTube courses, and empty initial profile) and provides a direct download button for the complete Python Tkinter `.zip` project.

---

## 2. Modular Python Package Structure

The Python project in `smart_course_recommendation/` will be organized into the following object-oriented packages:

```text
smart_course_recommendation/
│
├── main.py                         # Application entry point & dependency bootstrapper
├── config.py                       # Environment configuration, constants, & theme tokens
├── requirements.txt                # Python dependencies
├── README.md                       # Academic & technical documentation mapping AI syllabus modules
├── run.bat                         # One-click Windows launcher script
├── .env.example                    # Template for YOUTUBE_API_KEY and GEMINI_API_KEY
│
├── models/
│   ├── __init__.py
│   ├── student.py                  # Student, SkillProficiency, LearningPreference classes
│   ├── course.py                   # Course, VideoMetrics, CourseCategory classes
│   ├── recommendation.py           # RecommendationResult, ScoreBreakdown, Explanation classes
│   └── learning_path.py            # LearningNode, LearningEdge, LearningRoadmap classes
│
├── database/
│   ├── __init__.py
│   ├── db_manager.py               # SQLite connection manager, schema migrations, transactions
│   └── repositories.py             # StudentRepository, CourseRepository, ProgressRepository, HistoryRepository
│
├── ai/
│   ├── __init__.py
│   ├── recommendation_engine.py    # Hybrid multi-factor AI Recommendation Engine (TF-IDF + AI modules)
│   ├── knowledge_base.py           # Domain ontology: skills, prerequisites, topics, & career graphs
│   ├── rule_engine.py              # Forward-chaining IF-THEN inference engine with explanation trace
│   ├── search_algorithms.py        # Module 1: BFS, DFS, A* Search, and Heuristic Search
│   ├── bayesian_reasoning.py       # Module 4: Bayesian posterior suitability & evidence updating
│   ├── fuzzy_logic.py              # Module 4: Trapezoidal/triangular membership & centroid defuzzification
│   ├── skill_analyzer.py           # Target career vs. current skill-gap vector analysis
│   └── roadmap_generator.py        # Dynamic learning path constructor using BFS, DFS, & A*
│
├── services/
│   ├── __init__.py
│   ├── youtube_service.py          # Live YouTube Data API v3 integration (Search + Videos endpoints)
│   ├── gemini_service.py           # Gemini AI explanation, learning plan, career & Q&A service
│   └── course_service.py           # Orchestrates YouTube retrieval, deduplication, & SQLite caching
│
├── ui/
│   ├── __init__.py
│   ├── app.py                      # Main Tkinter/ttk window, sidebar navigation, & theme manager
│   ├── dashboard.py                # View 1: Overview metrics, current progress, & quick actions
│   ├── profile.py                  # View 2: Student profile form, skills manager, & career goal selector
│   ├── explore.py                  # View 3: Live YouTube course search, category & difficulty filters
│   ├── recommendations.py          # View 4: AI-ranked recommendations with transparent score breakdown
│   ├── roadmap.py                  # View 5 & 6: Skill Gap Analysis & Interactive BFS/DFS/A* Roadmap
│   ├── analytics.py                # View 7, 8, 9, 10: My Learning, Analytics charts, AI Assistant, Settings
│   └── components/
│       ├── __init__.py
│       ├── course_card.py          # Reusable ttk Course Card with thumbnail, metadata, & YouTube launch
│       ├── score_badge.py          # Visual breakdown widget for AI sub-scores
│       └── tooltip.py              # Hover tooltip widget for progressive disclosure
│
├── utils/
│   ├── __init__.py
│   ├── validators.py               # Input validation for profiles, skills, API keys, & queries
│   └── helpers.py                  # ISO-8601 duration parser, view count formatter, & threading helpers
│
└── tests/
    ├── __init__.py
    ├── test_recommendations.py     # Tests TF-IDF similarity, multi-factor scoring, & zero fake ratings
    ├── test_search.py              # Tests BFS shortest path, DFS alternatives, A* optimality, & heuristics
    ├── test_database.py            # Tests SQLite schema creation, CRUD repositories, & empty profile init
    └── test_reasoning.py           # Tests Knowledge Base, forward-chaining rules, Bayesian & Fuzzy logic
```

---

## 3. Core AI Syllabus Implementations

### Module 1 — Problem Solving & Search Methodologies (`ai/search_algorithms.py` & `ai/roadmap_generator.py`)
1. **Breadth-First Search (BFS)**:
   - Explores the skill prerequisite graph level-by-level from the student's current acquired skills to the target career goal skills, guaranteed to find the **shortest prerequisite learning path** (minimum number of intermediate skill steps).
2. **Depth-First Search (DFS)**:
   - Explores deep specialized learning tracks and generates **alternative learning paths** (e.g., theory-first vs. project-first sequences) with cycle detection.
3. **A* Search (`f(n) = g(n) + h(n)`)**:
   - Computes the optimal learning roadmap where:
     - `g(n)` = cumulative actual path cost (estimated study hours + difficulty transition penalty from current skill level).
     - `h(n)` = admissible heuristic estimating remaining skill gap distance weighted by target career core-skill priority.
4. **Heuristic Search**:
   - Ranks candidate YouTube courses for each roadmap milestone using a multi-criteria heuristic combining content relevance, duration match, and prerequisite readiness.

### Module 3 — Knowledge Representation & Reasoning (`ai/knowledge_base.py` & `ai/rule_engine.py`)
1. **Structured Knowledge Base**:
   - Represents career roles (e.g., *AI Engineer*, *Data Scientist*, *Full-Stack Developer*, *Machine Learning Engineer*, *Cybersecurity Analyst*, *Cloud Architect*), required core and secondary skills, prerequisite directed acyclic graphs (DAGs), and skill-to-topic mappings.
2. **Forward-Chaining Rule-Based Engine**:
   - Evaluates declarative `IF-THEN` rules against the student's profile facts (`career_goal`, `completed_courses`, `skills`, `proficiency`, `preferred_difficulty`).
   - Produces human-readable inference traces (e.g., *"Rule R4 Triggered: IF career_goal == 'AI Engineer' AND completed('Python Fundamentals') AND skill('Linear Algebra') >= Intermediate THEN recommend('Machine Learning Foundations')"*).

### Module 4 — Statistical Reasoning (`ai/bayesian_reasoning.py` & `ai/fuzzy_logic.py`)
1. **Bayesian Reasoning**:
   - Computes posterior probability $P(\text{Suitable} \mid E_1, E_2, \dots, E_k)$ using Bayes' theorem given prior suitability $P(\text{Suitable})$ for the student's career track and likelihood ratios from observed evidence (topic interest match, prerequisite completion, duration preference alignment, and past completion patterns).
   - Gracefully handles uncertainty when a new student profile has sparse data.
2. **Fuzzy Logic**:
   - Models learner skill proficiency and course difficulty using continuous fuzzy membership functions ($\mu_{\text{Beginner}}(x)$, $\mu_{\text{Intermediate}}(x)$, $\mu_{\text{Advanced}}(x)$ over $[0, 100]$).
   - Evaluates fuzzy inference rules (e.g., *IF Learner is Beginner AND Course is Beginner-to-Intermediate THEN Compatibility is High*) and applies centroid defuzzification to compute a continuous compatibility score in $[0, 1]$.

### Hybrid Recommendation Engine (`ai/recommendation_engine.py`)
- Combines:
  1. **TF-IDF & Cosine Similarity**: Vectorizes student interests, career goals, and skill gaps against real YouTube course titles, tags, and descriptions.
  2. **Skill-Gap Alignment**: Prioritizes courses that teach missing skills required for the student's target career.
  3. **Prerequisite Compatibility**: Verifies whether the student satisfies the course's inferred prerequisites in the Knowledge Base.
  4. **Fuzzy Difficulty Compatibility**: Matches student fuzzy proficiency against course difficulty.
  5. **Bayesian Suitability Posterior**: Incorporates probabilistic preference alignment.
  6. **Rule Engine Boost & Inference Trace**: Applies domain expert rules and attaches explicit natural-language explanations for why each course was recommended.
- **Strict Academic Integrity**: Never fabricates star ratings, never substitutes view counts for ratings or durations, and never clamps scores into artificial ranges.

---

## 4. Real YouTube Data API v3 & Gemini AI Services

### Live YouTube Course Service (`services/youtube_service.py`)
- Uses `search.list` (`type=video`, `videoEmbeddable=true`, educational queries tailored to skill gaps and topics) followed by `videos.list` (`part=snippet,contentDetails,statistics`) to retrieve:
  - Actual `videoId` and direct link `https://www.youtube.com/watch?v={videoId}`
  - Genuine title, channel name, thumbnail URL, full description, ISO-8601 duration (parsed into hours/minutes), publication date, and exact view count.
- Classifies videos into *Complete Course*, *In-Depth Tutorial*, or *Concept Overview* based on actual duration and title/description metadata, and infers skill level (*Beginner*, *Intermediate*, *Advanced*) from textual indicators.
- Requires a valid `YOUTUBE_API_KEY`; handles missing keys, invalid keys, quota limits, and empty search results with clear, non-crashing UI messages.

### Gemini AI Service (`services/gemini_service.py`)
- Uses the official Google GenAI SDK (`gemini-3.8-flash`) with graceful error handling to provide:
  - Personalized explanations of why specific YouTube courses fit the student's profile.
  - Custom weekly study schedules and step-by-step learning plans.
  - Interactive Q&A for course concepts and career guidance.

---

## 5. SQLite Database & 10-View Tkinter UI

### SQLite Persistence (`database/db_manager.py` & `database/repositories.py`)
- Automatically initializes 7 normalized tables on startup:
  - `students` (initializes empty on first launch — no pre-loaded sample profile)
  - `student_skills`
  - `courses`
  - `completed_courses`
  - `bookmarked_courses`
  - `learning_progress`
  - `recommendation_history`

### 10-View Tkinter/ttk Desktop Interface (`ui/`)
- Built with a calm, high-contrast Light/Dark theme token system (`config.py`), responsive background threading for API requests, and progressive disclosure:
  1. **Dashboard**: Headline learning stats, active roadmap step, and quick actions.
  2. **Student Profile**: Clean editor for name, target career goal, technical skills with proficiency sliders (0–100 with Fuzzy linguistic label), learning interests, and preferred session duration.
  3. **Explore Courses**: Dynamic YouTube topic search with filters for Difficulty (Beginner, Intermediate, Advanced), Category (AI, Machine Learning, Web Development, Data Science, Computer Science, Programming Languages), and video length.
  4. **AI Recommendations**: Ranked YouTube courses showing thumbnail, title, channel, duration, inferred level, view count, transparent AI score breakdown (TF-IDF, Skill Gap, Fuzzy, Bayesian, Rule Engine), "Why Recommended" explanation, and "Watch on YouTube" button.
  5. **Skill Gap Analysis**: Visual comparison of current student skills vs. target career requirements from the Knowledge Base.
  6. **Learning Roadmap**: Interactive prerequisite path generator allowing the student to switch between **BFS (Shortest Path)**, **DFS (Alternative Paths)**, and **A* Search (Optimal Cost-Heuristic Path)** and mark milestones complete.
  7. **My Learning**: Bookmarked, in-progress, and completed YouTube courses with interactive progress tracking.
  8. **Analytics**: Visual charts of skill proficiency distribution, learning progress, and recommendation score components.
  9. **AI Assistant**: Interactive Gemini AI advisor for study schedules, career Q&A, and skill-gap coaching.
  10. **Settings**: Light/Dark theme toggle, API key status diagnostics, and database reset controls.

---

## 6. Verification, Testing & Packaging

1. **Automated Unit Test Suite (`tests/`)**:
   - `test_recommendations.py`: Verifies TF-IDF scoring, skill-gap prioritization, and absence of fake ratings.
   - `test_search.py`: Verifies BFS shortest path, DFS alternative path exploration, A* optimal path calculation, and heuristic ordering.
   - `test_database.py`: Verifies SQLite table creation, empty initial profile state, and CRUD operations across all 7 tables.
   - `test_reasoning.py`: Verifies Knowledge Base graph queries, forward-chaining `IF-THEN` rules, Bayesian posterior updates, and Fuzzy membership/defuzzification.
2. **Documentation & Packaging**:
   - Update `smart_course_recommendation/README.md` with architecture diagrams, AI syllabus mapping, setup instructions, and testing commands.
   - Package the entire `smart_course_recommendation/` directory into `public/smart_course_recommendation.zip` and verify the web preview builds cleanly.
