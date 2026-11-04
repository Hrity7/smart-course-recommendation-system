"""
Domain models package for Smart Course Recommendation System.
"""

from .student import Student, SkillProficiency, LearningPreference
from .course import Course, VideoMetrics
from .recommendation import RecommendationResult, ScoreBreakdown
from .learning_path import LearningNode, LearningEdge, LearningRoadmap

__all__ = [
    "Student",
    "SkillProficiency",
    "LearningPreference",
    "Course",
    "VideoMetrics",
    "RecommendationResult",
    "ScoreBreakdown",
    "LearningNode",
    "LearningEdge",
    "LearningRoadmap",
]
