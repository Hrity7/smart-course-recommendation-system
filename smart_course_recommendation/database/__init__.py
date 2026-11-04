"""
Database persistence layer for Smart Course Recommendation System.
"""

from .db_manager import DatabaseManager
from .repositories import (
    StudentRepository,
    CourseRepository,
    ProgressRepository,
    RecommendationHistoryRepository,
)

__all__ = [
    "DatabaseManager",
    "StudentRepository",
    "CourseRepository",
    "ProgressRepository",
    "RecommendationHistoryRepository",
]
