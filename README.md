# Smart Course Recommendation System (Python + AI + Tkinter + YouTube Data API v3)

An academic-grade, Object-Oriented **Smart Course Recommendation System** written in Python using **Tkinter/ttk**, **SQLite**, **scikit-learn**, **YouTube Data API v3**, and **Google Gemini AI**.

---

## 1. AI Syllabus Mapping

| Syllabus Module | Concept | Implementation File | Academic Role in System |
| :--- | :--- | :--- | :--- |
| **Module 1: Problem Solving Methodologies** | **Breadth-First Search (BFS)** | `ai/search_algorithms.py` (`bfs_shortest_prerequisite_path`, `bfs_shortest_chain_between`) | Explores the prerequisite knowledge graph level-by-level to find the shortest prerequisite learning sequence to any target skill. |
| **Module 1: Problem Solving Methodologies** | **Depth-First Search (DFS)** | `ai/search_algorithms.py` (`dfs_explore_alternative_paths`) | Traverses deep specialization tracks to generate alternative valid topological learning sequences. |
| **Module 1: Problem Solving Methodologies** | **A\* Search** | `ai/search_algorithms.py` (`a_star_optimal_roadmap`) | Computes the cost-optimal learning roadmap minimizing $f(n) = g(n) + h(n)$, where $g(n)$ is cumulative study duration weighted by difficulty transition penalties and $h(n)$ is an admissible lower-bound heuristic on remaining skill gaps. |
| **Module 1: Problem Solving Methodologies** | **Heuristic Search** | `ai/search_algorithms.py` (`heuristic_course_rank`) | Evaluates and ranks candidate courses using an informed multi-criteria evaluation function over career core-skill coverage, prerequisite readiness, and session duration fit. |
| **Module 3: Knowledge Representation & Reasoning** | **Structured Knowledge Base & Prerequisite DAG** | `ai/knowledge_base.py` (`KnowledgeBase`, `SkillMetadata`) | Represents domain skills, directed acyclic prerequisite graphs, career ontologies (Core & Secondary skills), and semantic keyword mappings. |
| **Module 3: Knowledge Representation & Reasoning** | **Forward-Chaining Rule Engine** | `ai/rule_engine.py` (`RuleEngine`, `InferenceRule`) | Evaluates declarative `IF-THEN` production rules (e.g., *IF career_goal == 'AI Engineer' AND Python >= 40 AND Math >= 35 THEN recommend Machine Learning*) and produces transparent inference traces. |
| **Module 4: Statistical Reasoning** | **Bayesian Reasoning** | `ai/bayesian_reasoning.py` (`BayesianReasoner`) | Computes posterior course suitability $P(\text{Suitable} \mid E_1, \dots, E_k)$ via Bayes' Theorem across interest match, prerequisite completion, difficulty fit, and format preference while handling cold-start uncertainty. |
| **Module 4: Statistical Reasoning** | **Fuzzy Logic** | `ai/fuzzy_logic.py` (`FuzzyLogicEngine`) | Models learner skill proficiency using continuous trapezoidal/triangular membership functions ($\mu_{\text{Beginner}}, \mu_{\text{Intermediate}}, \mu_{\text{Advanced}}$) and computes compatibility via centroid defuzzification. |
| **Content-Based Filtering** | **TF-IDF & Cosine Similarity** | `ai/recommendation_engine.py` (`RecommendationEngine`) | Vectorizes learner profile & missing career skills against genuine YouTube course titles, topics, and descriptions using n-gram TF-IDF and cosine similarity. |

---

## 2. Project Architecture (`smart_course_recommendation/`)

```text
smart_course_recommendation/
│
├── main.py                         # Application entry point
├── config.py                       # Environment configuration, constants, & Light/Dark theme tokens
├── requirements.txt                # Python package dependencies
├── README.md                       # Project documentation
├── run.bat                         # One-click Windows launcher
├── .env.example                    # Environment variable template
│
├── models/
│   ├── student.py                  # Student, SkillProficiency, LearningPreference
│   ├── course.py                   # Course, VideoMetrics
│   ├── recommendation.py           # RecommendationResult, ScoreBreakdown
│   └── learning_path.py            # LearningNode, LearningEdge, LearningRoadmap
│
├── database/
│   ├── db_manager.py               # SQLite schema manager (7 normalized tables)
│   └── repositories.py             # Student, Course, Progress, & RecommendationHistory repositories
│
├── ai/
│   ├── recommendation_engine.py    # Hybrid multi-factor AI Recommendation Engine
│   ├── knowledge_base.py           # Domain skill ontology & prerequisite DAG
│   ├── rule_engine.py              # Forward-chaining IF-THEN rule engine
│   ├── search_algorithms.py        # BFS, DFS, A* Search, and Heuristic Search
│   ├── bayesian_reasoning.py       # Bayesian posterior suitability estimator
│   ├── fuzzy_logic.py              # Fuzzy linguistic membership & centroid defuzzification
│   ├── skill_analyzer.py           # Target career vs. current skill-gap analyzer
│   └── roadmap_generator.py        # Dynamic learning roadmap builder
│
├── services/
│   ├── youtube_service.py          # Live YouTube Data API v3 integration (search.list + videos.list)
│   ├── gemini_service.py           # Google Gemini AI explanation, study plan, & Q&A advisor
│   └── course_service.py           # Course orchestration & SQLite caching service
│
├── ui/
│   ├── app.py                      # Main Tkinter/ttk window, 10-view navigation, & Light/Dark theme switch
│   ├── dashboard.py                # View 1: Dashboard
│   ├── profile.py                  # View 2: Student Profile
│   ├── explore.py                  # View 3: Explore Courses
│   ├── recommendations.py          # View 4: AI Recommendations ("For You")
│   ├── roadmap.py                  # View 5: Skill Gap Analysis & View 6: Learning Roadmap
│   ├── analytics.py                # Views 7–10: My Learning, Analytics, AI Advisor, Settings
│   └── components/                 # CourseCardWidget, ScoreBreakdownPanel, Tooltip
│
├── utils/
│   ├── validators.py               # Input & YouTube video ID validators
│   └── helpers.py                  # ISO-8601 duration parser, view formatter, & background worker threads
│
└── tests/
    ├── test_recommendations.py     # Unit tests for TF-IDF & hybrid recommendation scoring
    ├── test_search.py              # Unit tests for BFS, DFS, A*, and Heuristic Search
    ├── test_database.py            # Unit tests for SQLite 7-table schema & empty initial profile
    └── test_reasoning.py           # Unit tests for Knowledge Base, Rule Engine, Bayesian, & Fuzzy Logic
```

---

## 3. Setup & Running Instructions

1. **Navigate to the Python package directory**:
   ```bash
   cd smart_course_recommendation
   pip install -r requirements.txt
   ```

2. **Configure API Keys**:
   Copy `.env.example` to `.env` and set your keys:
   ```env
   YOUTUBE_API_KEY=your_youtube_data_api_v3_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run the Tkinter Application**:
   ```bash
   python main.py
   ```
   Or double-click `run.bat` on Windows.

4. **Run Unit Tests**:
   ```bash
   python -m unittest discover -s tests -p "test_*.py" -v
   ```
