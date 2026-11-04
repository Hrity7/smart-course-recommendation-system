"""
Recommendation result models containing transparent multi-factor AI score breakdowns
and human-readable reasoning explanations.
"""

from dataclasses import dataclass, field
from typing import List
from .course import Course


@dataclass
class ScoreBreakdown:
    """
    Stores genuine, un-clamped mathematical sub-scores in [0.0, 1.0] for each AI component.
    """
    tfidf_cosine_similarity: float = 0.0
    skill_gap_alignment: float = 0.0
    prerequisite_compatibility: float = 0.0
    fuzzy_difficulty_compatibility: float = 0.0
    career_goal_alignment: float = 0.0
    learning_preference_match: float = 0.0
    bayesian_suitability_posterior: float = 0.0
    rule_engine_bonus: float = 0.0
    heuristic_rank_score: float = 0.0
    final_score: float = 0.0  # Actual weighted calculation without artificial clamping

    def to_dict(self) -> dict:
        return {
            "tfidf_cosine_similarity": round(self.tfidf_cosine_similarity, 4),
            "skill_gap_alignment": round(self.skill_gap_alignment, 4),
            "prerequisite_compatibility": round(self.prerequisite_compatibility, 4),
            "fuzzy_difficulty_compatibility": round(self.fuzzy_difficulty_compatibility, 4),
            "career_goal_alignment": round(self.career_goal_alignment, 4),
            "learning_preference_match": round(self.learning_preference_match, 4),
            "bayesian_suitability_posterior": round(self.bayesian_suitability_posterior, 4),
            "rule_engine_bonus": round(self.rule_engine_bonus, 4),
            "heuristic_rank_score": round(self.heuristic_rank_score, 4),
            "final_score": round(self.final_score, 4),
        }


@dataclass
class RecommendationResult:
    """Pairs a recommended YouTube Course with its AI score breakdown and reasoning trace."""
    course: Course
    breakdown: ScoreBreakdown
    matched_skills: List[str] = field(default_factory=list)
    missing_prerequisites: List[str] = field(default_factory=list)
    triggered_rules: List[str] = field(default_factory=list)
    explanation_summary: str = ""

    @property
    def final_score(self) -> float:
        return self.breakdown.final_score
