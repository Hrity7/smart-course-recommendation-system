"""
Module 3: Knowledge Representation and Reasoning - Forward-Chaining Rule Engine.
Implements declarative IF-THEN production rules that evaluate student facts and course
attributes to derive logical recommendations and human-readable explanations.
"""

from dataclasses import dataclass
from typing import Callable, List

from models.course import Course
from models.student import Student
from .knowledge_base import KnowledgeBase


@dataclass
class InferenceRule:
    """Represents a declarative IF-THEN production rule in the expert system."""
    rule_id: str
    name: str
    antecedent_description: str
    consequent_description: str
    weight_bonus: float
    condition: Callable[[Student, Course, KnowledgeBase], bool]
    explanation_builder: Callable[[Student, Course], str]


@dataclass
class RuleMatch:
    """Represents a fired rule during forward-chaining inference."""
    rule_id: str
    rule_name: str
    weight_bonus: float
    explanation: str


class RuleEngine:
    """
    Forward-chaining inference engine that evaluates a student's profile facts
    and candidate course properties against domain IF-THEN rules.
    """

    def __init__(self, knowledge_base: KnowledgeBase) -> None:
        self.kb = knowledge_base
        self.rules: List[InferenceRule] = self._initialize_rules()

    def _initialize_rules(self) -> List[InferenceRule]:
        return [
            InferenceRule(
                rule_id="R1",
                name="AI Engineer -> Machine Learning Progression Rule",
                antecedent_description=(
                    "IF student wants to become an AI Engineer or Machine Learning Engineer "
                    "AND has Python Fundamentals (>= 40) AND has mathematics foundation (>= 35)"
                ),
                consequent_description="THEN recommend Machine Learning Foundations courses",
                weight_bonus=0.18,
                condition=lambda s, c, kb: (
                    any(role in s.career_goal.lower() for role in ["ai", "machine learning", "data scientist"])
                    and s.has_skill("Python Fundamentals", 40.0)
                    and (
                        s.has_skill("Linear Algebra & Calculus", 35.0)
                        or s.has_skill("Probability & Statistics", 35.0)
                    )
                    and (
                        "Machine Learning Foundations" in c.topics
                        or "machine learning" in c.title.lower()
                    )
                ),
                explanation_builder=lambda s, c: (
                    f"IF career goal is '{s.career_goal}' AND Python + Math foundations are acquired "
                    f"THEN prioritize '{c.title}' to master Machine Learning."
                ),
            ),
            InferenceRule(
                rule_id="R2",
                name="Foundational Python Prerequisite Rule",
                antecedent_description=(
                    "IF student lacks Python Fundamentals (< 35) "
                    "AND course teaches Python Fundamentals at Beginner level"
                ),
                consequent_description="THEN recommend Beginner Python Fundamentals first",
                weight_bonus=0.20,
                condition=lambda s, c, kb: (
                    not s.has_skill("Python Fundamentals", 35.0)
                    and c.difficulty == "Beginner"
                    and (
                        "Python Fundamentals" in c.topics
                        or "python" in c.title.lower()
                    )
                ),
                explanation_builder=lambda s, c: (
                    "IF Python Fundamentals proficiency is below threshold "
                    "THEN recommend foundational Beginner Python course before advanced tracks."
                ),
            ),
            InferenceRule(
                rule_id="R3",
                name="Deep Learning Readiness Rule",
                antecedent_description=(
                    "IF student has Machine Learning Foundations (>= 50) "
                    "AND targets AI/ML career AND course covers Deep Learning or NLP"
                ),
                consequent_description="THEN recommend Deep Learning & Neural Networks specialization",
                weight_bonus=0.16,
                condition=lambda s, c, kb: (
                    s.has_skill("Machine Learning Foundations", 50.0)
                    and any(role in s.career_goal.lower() for role in ["ai", "machine learning"])
                    and any(
                        t in c.topics
                        for t in ["Deep Learning & Neural Networks", "Natural Language Processing & LLMs"]
                    )
                ),
                explanation_builder=lambda s, c: (
                    "IF Machine Learning Foundations is established (>= 50%) "
                    "THEN advance to Deep Learning & Neural Networks."
                ),
            ),
            InferenceRule(
                rule_id="R4",
                name="Core Career Skill Gap Bridging Rule",
                antecedent_description=(
                    "IF course teaches a missing Core Skill required by the student's target career "
                    "AND all prerequisites for that course are satisfied"
                ),
                consequent_description="THEN strongly recommend course to bridge career skill gap",
                weight_bonus=0.15,
                condition=lambda s, c, kb: self._bridges_ready_core_gap(s, c, kb),
                explanation_builder=lambda s, c: (
                    f"IF '{c.title}' directly teaches a missing core skill for '{s.career_goal}' "
                    "with all prerequisites satisfied THEN recommend immediately."
                ),
            ),
            InferenceRule(
                rule_id="R5",
                name="Full-Course Format Preference Rule",
                antecedent_description=(
                    "IF student prefers Comprehensive Full Courses "
                    "AND video duration is >= 1.5 hours"
                ),
                consequent_description="THEN boost comprehensive full-length course",
                weight_bonus=0.08,
                condition=lambda s, c, kb: (
                    s.preferences.prefer_full_courses
                    and c.duration_hours >= 1.5
                ),
                explanation_builder=lambda s, c: (
                    f"IF learner prefers full-length courses AND duration is {c.duration_formatted} "
                    "THEN prioritize comprehensive instruction."
                ),
            ),
            InferenceRule(
                rule_id="R6",
                name="Data Science SQL & Pandas Synergy Rule",
                antecedent_description=(
                    "IF student targets Data Scientist AND has Python Fundamentals "
                    "AND lacks SQL or Pandas proficiency"
                ),
                consequent_description="THEN recommend SQL or Data Analysis with Pandas & NumPy",
                weight_bonus=0.15,
                condition=lambda s, c, kb: (
                    "data" in s.career_goal.lower()
                    and s.has_skill("Python Fundamentals", 35.0)
                    and (
                        (
                            not s.has_skill("SQL & Relational Databases", 50.0)
                            and "SQL & Relational Databases" in c.topics
                        )
                        or (
                            not s.has_skill("Data Analysis with Pandas & NumPy", 50.0)
                            and "Data Analysis with Pandas & NumPy" in c.topics
                        )
                    )
                ),
                explanation_builder=lambda s, c: (
                    "IF career goal is Data Scientist AND Python is known "
                    "THEN recommend SQL / Pandas data analysis foundations."
                ),
            ),
        ]

    @staticmethod
    def _bridges_ready_core_gap(student: Student, course: Course, kb: KnowledgeBase) -> bool:
        if not student.career_goal:
            return False
        core_skills, _ = kb.get_career_skills(student.career_goal)
        missing_core = [sk for sk in core_skills if not student.has_skill(sk, 60.0)]
        teaches_missing = any(sk in missing_core for sk in course.topics)
        if not teaches_missing:
            return False
        for prereq in course.prerequisites:
            if not student.has_skill(prereq, 35.0):
                return False
        return True

    def evaluate(self, student: Student, course: Course) -> List[RuleMatch]:
        """Runs forward-chaining over all rules and returns all fired RuleMatches."""
        matches: List[RuleMatch] = []
        for rule in self.rules:
            try:
                if rule.condition(student, course, self.kb):
                    matches.append(
                        RuleMatch(
                            rule_id=rule.rule_id,
                            rule_name=rule.name,
                            weight_bonus=rule.weight_bonus,
                            explanation=rule.explanation_builder(student, course),
                        )
                    )
            except Exception:
                continue
        return matches

    def infer_recommended_skill_targets(self, student: Student) -> List[dict]:
        """
        Derives high-level skill recommendations directly from student facts using IF-THEN logic.
        Used in the Skill Gap & Rule Reasoning UI panels.
        """
        derived: List[dict] = []
        core_skills, secondary_skills = self.kb.get_career_skills(student.career_goal or "AI Engineer")

        for sk in core_skills:
            if student.has_skill(sk, 65.0):
                continue
            prereqs = self.kb.get_prerequisites(sk)
            missing_prereqs = [p for p in prereqs if not student.has_skill(p, 40.0)]
            if not missing_prereqs:
                derived.append(
                    {
                        "target_skill": sk,
                        "status": "Ready to Learn Now",
                        "rule": (
                            f"IF career_goal == '{student.career_goal or 'AI Engineer'}' "
                            f"AND prerequisites({', '.join(prereqs) or 'None'}) == Satisfied "
                            f"THEN recommend_skill('{sk}')"
                        ),
                    }
                )
            else:
                derived.append(
                    {
                        "target_skill": sk,
                        "status": f"Requires Prerequisites: {', '.join(missing_prereqs)}",
                        "rule": (
                            f"IF target_skill == '{sk}' AND missing_prerequisites({', '.join(missing_prereqs)}) "
                            f"THEN complete({', '.join(missing_prereqs)}) BEFORE '{sk}'"
                        ),
                    }
                )
        return derived
