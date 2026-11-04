"""
Student domain models representing learner profiles, technical skills, and preferences.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class SkillProficiency:
    """Represents a student's proficiency in a specific technical skill."""
    skill_name: str
    score: float = 25.0  # Numeric score on [0, 100] scale
    category: str = "General"

    def __post_init__(self) -> None:
        self.skill_name = self.skill_name.strip()
        self.score = max(0.0, min(100.0, float(self.score)))

    @property
    def linguistic_level(self) -> str:
        """Maps numeric proficiency score to linguistic difficulty category."""
        if self.score < 40.0:
            return "Beginner"
        if self.score < 75.0:
            return "Intermediate"
        return "Advanced"


@dataclass
class LearningPreference:
    """Encapsulates a student's study habits and content format preferences."""
    preferred_difficulty: str = "Beginner"
    preferred_duration_hours: float = 3.0
    weekly_study_hours: int = 8
    learning_style: str = "Hands-on Projects"
    prefer_full_courses: bool = True


@dataclass
class Student:
    """
    Object-Oriented model representing a Student user in the system.
    Starts empty on first launch when no profile has been configured yet.
    """
    student_id: Optional[int] = None
    name: str = ""
    career_goal: str = ""
    interests: List[str] = field(default_factory=list)
    learning_objectives: str = ""
    skills: Dict[str, SkillProficiency] = field(default_factory=dict)
    completed_course_ids: List[str] = field(default_factory=list)
    bookmarked_course_ids: List[str] = field(default_factory=list)
    course_progress: Dict[str, float] = field(default_factory=dict)
    preferences: LearningPreference = field(default_factory=LearningPreference)

    @property
    def is_configured(self) -> bool:
        """Returns True if the student has saved a valid profile."""
        return bool(self.name.strip() or self.career_goal.strip() or self.skills or self.interests)

    @property
    def average_skill_score(self) -> float:
        """Calculates mean proficiency score across all registered skills."""
        if not self.skills:
            if self.preferences.preferred_difficulty == "Advanced":
                return 80.0
            if self.preferences.preferred_difficulty == "Intermediate":
                return 55.0
            return 25.0
        return sum(s.score for s in self.skills.values()) / len(self.skills)

    @property
    def overall_level(self) -> str:
        """Returns linguistic level based on average skill score or preferred difficulty."""
        if not self.skills:
            return self.preferences.preferred_difficulty or "Beginner"
        avg = self.average_skill_score
        if avg < 40.0:
            return "Beginner"
        if avg < 75.0:
            return "Intermediate"
        return "Advanced"

    def set_skill(self, skill_name: str, score: float, category: str = "General") -> None:
        clean = skill_name.strip()
        if clean:
            self.skills[clean] = SkillProficiency(skill_name=clean, score=score, category=category)

    def remove_skill(self, skill_name: str) -> None:
        clean = skill_name.strip()
        if clean in self.skills:
            del self.skills[clean]

    def has_skill(self, skill_name: str, min_score: float = 35.0) -> bool:
        target = skill_name.strip().lower()
        for name, prof in self.skills.items():
            if name.lower() == target and prof.score >= min_score:
                return True
        return False

    def get_skill_score(self, skill_name: str) -> float:
        target = skill_name.strip().lower()
        for name, prof in self.skills.items():
            if name.lower() == target:
                return prof.score
        return 0.0

    def to_text_corpus(self) -> str:
        """Builds a textual representation of the student's profile for TF-IDF vectorization."""
        parts: List[str] = []
        if self.career_goal:
            parts.append(self.career_goal)
        if self.interests:
            parts.extend(self.interests)
        if self.learning_objectives:
            parts.append(self.learning_objectives)
        if self.skills:
            parts.extend(self.skills.keys())
        return " ".join(parts).strip()
