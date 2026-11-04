"""
Skill Gap Analyzer comparing a student's current technical skill vector against
target career role requirements in the Knowledge Base.
"""

from dataclasses import dataclass, field
from typing import Dict, List

from models.student import Student
from .fuzzy_logic import FuzzyLogicEngine
from .knowledge_base import KnowledgeBase


@dataclass
class SkillGapItem:
    """Detailed gap metrics for a single required career skill."""
    skill_name: str
    category: str
    priority: str  # "Core" or "Secondary"
    current_score: float
    target_score: float
    gap_magnitude: float
    linguistic_level: str
    fuzzy_memberships: Dict[str, float]
    prerequisites_satisfied: bool
    missing_prerequisites: List[str] = field(default_factory=list)


@dataclass
class SkillGapReport:
    """Comprehensive skill gap analysis report for a student's career goal."""
    career_goal: str
    overall_readiness_percent: float
    acquired_skills: List[SkillGapItem] = field(default_factory=list)
    partial_skills: List[SkillGapItem] = field(default_factory=list)
    missing_skills: List[SkillGapItem] = field(default_factory=list)
    immediate_next_skills: List[str] = field(default_factory=list)


class SkillAnalyzer:
    """Computes quantitative and fuzzy skill-gap reports for a student."""

    def __init__(self, knowledge_base: KnowledgeBase, fuzzy_engine: FuzzyLogicEngine) -> None:
        self.kb = knowledge_base
        self.fuzzy = fuzzy_engine

    def analyze(self, student: Student) -> SkillGapReport:
        career = student.career_goal.strip() or "AI Engineer"
        core_skills, sec_skills = self.kb.get_career_skills(career)

        acquired: List[SkillGapItem] = []
        partial: List[SkillGapItem] = []
        missing: List[SkillGapItem] = []
        immediate_next: List[str] = []

        all_required = [(sk, "Core", 75.0) for sk in core_skills] + [
            (sk, "Secondary", 60.0) for sk in sec_skills
        ]

        total_weighted_score = 0.0
        total_weight = 0.0

        for sk_name, priority, target_val in all_required:
            meta = self.kb.get_skill(sk_name)
            cat = meta.category if meta else "General"
            curr = student.get_skill_score(sk_name)
            gap = max(0.0, target_val - curr)
            prereqs = self.kb.get_prerequisites(sk_name)
            missing_prereqs = [p for p in prereqs if not student.has_skill(p, 40.0)]
            prereqs_ok = len(missing_prereqs) == 0

            weight = 1.5 if priority == "Core" else 1.0
            total_weighted_score += min(1.0, curr / target_val) * weight
            total_weight += weight

            item = SkillGapItem(
                skill_name=sk_name,
                category=cat,
                priority=priority,
                current_score=round(curr, 1),
                target_score=target_val,
                gap_magnitude=round(gap, 1),
                linguistic_level=self.fuzzy.dominant_linguistic_label(curr),
                fuzzy_memberships=self.fuzzy.fuzzify_skill(curr),
                prerequisites_satisfied=prereqs_ok,
                missing_prerequisites=missing_prereqs,
            )

            if curr >= target_val * 0.85:
                acquired.append(item)
            elif curr >= 25.0:
                partial.append(item)
                if prereqs_ok and priority == "Core":
                    immediate_next.append(sk_name)
            else:
                missing.append(item)
                if prereqs_ok and priority == "Core":
                    immediate_next.append(sk_name)

        readiness = (
            round((total_weighted_score / total_weight) * 100.0, 1)
            if total_weight > 0
            else 0.0
        )

        return SkillGapReport(
            career_goal=career,
            overall_readiness_percent=readiness,
            acquired_skills=acquired,
            partial_skills=partial,
            missing_skills=missing,
            immediate_next_skills=immediate_next[:4],
        )
