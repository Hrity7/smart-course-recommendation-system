"""
Module 3: Knowledge Representation and Reasoning - Structured Knowledge Base.
Models domain skills, prerequisite Directed Acyclic Graphs (DAGs), career role ontologies,
and topic-to-skill semantic mappings.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Tuple


@dataclass(frozen=True)
class SkillMetadata:
    """Ontology node representing a domain skill in the Knowledge Graph."""
    name: str
    category: str
    difficulty: str  # "Beginner", "Intermediate", "Advanced"
    estimated_hours: float
    prerequisites: Tuple[str, ...] = field(default_factory=tuple)
    keywords: Tuple[str, ...] = field(default_factory=tuple)


class KnowledgeBase:
    """
    Structured Knowledge Graph representing:
    - Technical skills and their metadata
    - Directed prerequisite relationships (u -> v means u is a prerequisite for v)
    - Career Goal requirements (core and secondary skills)
    - Semantic keyword extraction for courses
    """

    def __init__(self) -> None:
        self.skills: Dict[str, SkillMetadata] = {}
        self.career_paths: Dict[str, Dict[str, List[str]]] = {}
        self._build_default_ontology()

    def _build_default_ontology(self) -> None:
        raw_skills = [
            SkillMetadata(
                name="Python Fundamentals",
                category="Programming Languages",
                difficulty="Beginner",
                estimated_hours=12.0,
                prerequisites=(),
                keywords=("python", "variables", "loops", "functions", "syntax", "scripting"),
            ),
            SkillMetadata(
                name="Object-Oriented Programming",
                category="Computer Science",
                difficulty="Beginner",
                estimated_hours=10.0,
                prerequisites=("Python Fundamentals",),
                keywords=("oop", "object oriented", "classes", "inheritance", "polymorphism", "encapsulation"),
            ),
            SkillMetadata(
                name="Data Structures & Algorithms",
                category="Computer Science",
                difficulty="Intermediate",
                estimated_hours=20.0,
                prerequisites=("Python Fundamentals", "Object-Oriented Programming"),
                keywords=("data structures", "algorithms", "trees", "graphs", "sorting", "bfs", "dfs", "dynamic programming"),
            ),
            SkillMetadata(
                name="Linear Algebra & Calculus",
                category="Data Science",
                difficulty="Beginner",
                estimated_hours=14.0,
                prerequisites=(),
                keywords=("linear algebra", "calculus", "matrices", "vectors", "eigenvalues", "mathematics", "math"),
            ),
            SkillMetadata(
                name="Probability & Statistics",
                category="Data Science",
                difficulty="Beginner",
                estimated_hours=14.0,
                prerequisites=("Linear Algebra & Calculus",),
                keywords=("probability", "statistics", "bayesian", "distributions", "hypothesis testing", "statistical"),
            ),
            SkillMetadata(
                name="SQL & Relational Databases",
                category="Data Science",
                difficulty="Beginner",
                estimated_hours=10.0,
                prerequisites=(),
                keywords=("sql", "sqlite", "postgresql", "mysql", "database", "relational", "queries"),
            ),
            SkillMetadata(
                name="Data Analysis with Pandas & NumPy",
                category="Data Science",
                difficulty="Intermediate",
                estimated_hours=15.0,
                prerequisites=("Python Fundamentals", "Probability & Statistics"),
                keywords=("pandas", "numpy", "data analysis", "data wrangling", "exploratory data analysis", "eda", "matplotlib"),
            ),
            SkillMetadata(
                name="Machine Learning Foundations",
                category="Machine Learning",
                difficulty="Intermediate",
                estimated_hours=22.0,
                prerequisites=("Python Fundamentals", "Linear Algebra & Calculus", "Probability & Statistics", "Data Analysis with Pandas & NumPy"),
                keywords=("machine learning", "scikit-learn", "regression", "classification", "clustering", "supervised", "unsupervised"),
            ),
            SkillMetadata(
                name="Deep Learning & Neural Networks",
                category="Artificial Intelligence",
                difficulty="Advanced",
                estimated_hours=26.0,
                prerequisites=("Machine Learning Foundations", "Linear Algebra & Calculus"),
                keywords=("deep learning", "neural networks", "pytorch", "tensorflow", "backpropagation", "cnn", "rnn"),
            ),
            SkillMetadata(
                name="Natural Language Processing & LLMs",
                category="Artificial Intelligence",
                difficulty="Advanced",
                estimated_hours=24.0,
                prerequisites=("Deep Learning & Neural Networks", "Machine Learning Foundations"),
                keywords=("nlp", "natural language processing", "transformers", "llm", "generative ai", "embeddings", "tf-idf"),
            ),
            SkillMetadata(
                name="AI Search & Knowledge Reasoning",
                category="Artificial Intelligence",
                difficulty="Intermediate",
                estimated_hours=16.0,
                prerequisites=("Data Structures & Algorithms", "Probability & Statistics"),
                keywords=("artificial intelligence", "heuristic", "a* search", "knowledge graph", "expert systems", "fuzzy logic", "bayesian"),
            ),
            SkillMetadata(
                name="MLOps & Model Deployment",
                category="Machine Learning",
                difficulty="Advanced",
                estimated_hours=18.0,
                prerequisites=("Machine Learning Foundations", "Object-Oriented Programming"),
                keywords=("mlops", "deployment", "docker", "fastapi", "model serving", "ci/cd", "monitoring"),
            ),
            SkillMetadata(
                name="HTML, CSS & JavaScript Foundations",
                category="Web Development",
                difficulty="Beginner",
                estimated_hours=14.0,
                prerequisites=(),
                keywords=("html", "css", "javascript", "frontend", "dom", "responsive web"),
            ),
            SkillMetadata(
                name="Modern Frontend Architecture",
                category="Web Development",
                difficulty="Intermediate",
                estimated_hours=18.0,
                prerequisites=("HTML, CSS & JavaScript Foundations",),
                keywords=("react", "typescript", "frontend architecture", "state management", "web components"),
            ),
            SkillMetadata(
                name="Backend APIs & Microservices",
                category="Web Development",
                difficulty="Intermediate",
                estimated_hours=18.0,
                prerequisites=("Python Fundamentals", "SQL & Relational Databases", "Object-Oriented Programming"),
                keywords=("backend", "rest api", "fastapi", "django", "flask", "node", "microservices", "authentication"),
            ),
            SkillMetadata(
                name="System Design & Cloud Architecture",
                category="Cloud Computing",
                difficulty="Advanced",
                estimated_hours=22.0,
                prerequisites=("Backend APIs & Microservices", "Data Structures & Algorithms"),
                keywords=("system design", "cloud", "aws", "gcp", "azure", "kubernetes", "scalability", "distributed systems"),
            ),
            SkillMetadata(
                name="Networking & Linux Fundamentals",
                category="Cybersecurity",
                difficulty="Beginner",
                estimated_hours=12.0,
                prerequisites=(),
                keywords=("linux", "networking", "tcp/ip", "bash", "operating systems", "dns", "http"),
            ),
            SkillMetadata(
                name="Application & Network Security",
                category="Cybersecurity",
                difficulty="Intermediate",
                estimated_hours=18.0,
                prerequisites=("Networking & Linux Fundamentals", "Python Fundamentals"),
                keywords=("cybersecurity", "security", "owasp", "cryptography", "penetration testing", "ethical hacking", "SOC"),
            ),
        ]

        for s in raw_skills:
            self.skills[s.name] = s

        self.career_paths = {
            "AI Engineer": {
                "core": [
                    "Python Fundamentals",
                    "Object-Oriented Programming",
                    "Data Structures & Algorithms",
                    "Linear Algebra & Calculus",
                    "Probability & Statistics",
                    "Data Analysis with Pandas & NumPy",
                    "AI Search & Knowledge Reasoning",
                    "Machine Learning Foundations",
                    "Deep Learning & Neural Networks",
                    "Natural Language Processing & LLMs",
                ],
                "secondary": ["MLOps & Model Deployment", "Backend APIs & Microservices"],
            },
            "Machine Learning Engineer": {
                "core": [
                    "Python Fundamentals",
                    "Object-Oriented Programming",
                    "Data Structures & Algorithms",
                    "Linear Algebra & Calculus",
                    "Probability & Statistics",
                    "Data Analysis with Pandas & NumPy",
                    "Machine Learning Foundations",
                    "Deep Learning & Neural Networks",
                    "MLOps & Model Deployment",
                ],
                "secondary": ["SQL & Relational Databases", "Natural Language Processing & LLMs"],
            },
            "Data Scientist": {
                "core": [
                    "Python Fundamentals",
                    "Linear Algebra & Calculus",
                    "Probability & Statistics",
                    "SQL & Relational Databases",
                    "Data Analysis with Pandas & NumPy",
                    "Machine Learning Foundations",
                ],
                "secondary": ["Deep Learning & Neural Networks", "Natural Language Processing & LLMs"],
            },
            "Full-Stack Web Developer": {
                "core": [
                    "Python Fundamentals",
                    "Object-Oriented Programming",
                    "HTML, CSS & JavaScript Foundations",
                    "SQL & Relational Databases",
                    "Modern Frontend Architecture",
                    "Backend APIs & Microservices",
                ],
                "secondary": ["System Design & Cloud Architecture", "Data Structures & Algorithms"],
            },
            "Software Engineer": {
                "core": [
                    "Python Fundamentals",
                    "Object-Oriented Programming",
                    "Data Structures & Algorithms",
                    "SQL & Relational Databases",
                    "Backend APIs & Microservices",
                    "System Design & Cloud Architecture",
                ],
                "secondary": ["Networking & Linux Fundamentals", "MLOps & Model Deployment"],
            },
            "Cybersecurity Analyst": {
                "core": [
                    "Networking & Linux Fundamentals",
                    "Python Fundamentals",
                    "SQL & Relational Databases",
                    "Application & Network Security",
                ],
                "secondary": ["Backend APIs & Microservices", "System Design & Cloud Architecture"],
            },
            "Cloud Architect": {
                "core": [
                    "Networking & Linux Fundamentals",
                    "Python Fundamentals",
                    "Object-Oriented Programming",
                    "SQL & Relational Databases",
                    "Backend APIs & Microservices",
                    "System Design & Cloud Architecture",
                ],
                "secondary": ["MLOps & Model Deployment", "Application & Network Security"],
            },
        }

    def get_skill(self, skill_name: str) -> SkillMetadata | None:
        if skill_name in self.skills:
            return self.skills[skill_name]
        lower = skill_name.strip().lower()
        for k, v in self.skills.items():
            if k.lower() == lower:
                return v
        return None

    def get_all_skill_names(self) -> List[str]:
        return list(self.skills.keys())

    def get_prerequisites(self, skill_name: str) -> List[str]:
        meta = self.get_skill(skill_name)
        return list(meta.prerequisites) if meta else []

    def get_dependents(self, skill_name: str) -> List[str]:
        """Returns skills that directly require `skill_name` as a prerequisite."""
        dependents: List[str] = []
        for s_name, meta in self.skills.items():
            if skill_name in meta.prerequisites:
                dependents.append(s_name)
        return dependents

    def get_all_ancestors(self, skill_name: str) -> Set[str]:
        """Returns transitive closure of all prerequisites needed before `skill_name`."""
        visited: Set[str] = set()
        stack = list(self.get_prerequisites(skill_name))
        while stack:
            curr = stack.pop()
            if curr not in visited:
                visited.add(curr)
                stack.extend(self.get_prerequisites(curr))
        return visited

    def get_career_skills(self, career_goal: str) -> Tuple[List[str], List[str]]:
        """Returns (core_skills, secondary_skills) for a given career goal."""
        if career_goal in self.career_paths:
            entry = self.career_paths[career_goal]
            return list(entry["core"]), list(entry["secondary"])
        # Default fallback to Software Engineer if custom career goal entered
        lower = career_goal.strip().lower()
        for role, entry in self.career_paths.items():
            if role.lower() in lower or lower in role.lower():
                return list(entry["core"]), list(entry["secondary"])
        default_entry = self.career_paths["AI Engineer"]
        return list(default_entry["core"]), list(default_entry["secondary"])

    def extract_skills_from_text(self, title: str, description: str = "") -> List[str]:
        """Maps course title & description text to canonical Knowledge Base skills."""
        combined = f"{title} {description}".lower()
        matched: List[str] = []
        for s_name, meta in self.skills.items():
            if s_name.lower() in combined or any(kw in combined for kw in meta.keywords):
                matched.append(s_name)
        return matched

    def infer_course_prerequisites(self, course_skills: List[str], difficulty: str) -> List[str]:
        """Infers prerequisite skills for a course based on its taught skills and difficulty."""
        prereqs: Set[str] = set()
        for skill in course_skills:
            for p in self.get_prerequisites(skill):
                if p not in course_skills:
                    prereqs.add(p)
        if difficulty == "Beginner":
            # Beginner courses on foundational topics usually require no advanced prerequisites
            prereqs = {
                p for p in prereqs
                if (self.get_skill(p) and self.get_skill(p).difficulty == "Beginner")
            }
        return sorted(prereqs)
