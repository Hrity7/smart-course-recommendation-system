"""
High-level Course Orchestration Service connecting YouTube Data API v3,
SQLite persistence, and the Hybrid AI Recommendation Engine.
"""

from typing import List

from ai.knowledge_base import KnowledgeBase
from ai.recommendation_engine import RecommendationEngine
from database.repositories import (
    CourseRepository,
    RecommendationHistoryRepository,
)
from models.course import Course
from models.recommendation import RecommendationResult
from models.student import Student
from .youtube_service import YouTubeService


class CourseService:
    """
    Coordinates live YouTube retrieval, SQLite course persistence, and AI recommendation scoring.
    """

    def __init__(
        self,
        youtube_service: YouTubeService,
        course_repo: CourseRepository,
        history_repo: RecommendationHistoryRepository,
        recommendation_engine: RecommendationEngine,
        knowledge_base: KnowledgeBase,
    ) -> None:
        self.youtube = youtube_service
        self.course_repo = course_repo
        self.history_repo = history_repo
        self.engine = recommendation_engine
        self.kb = knowledge_base

    def search_and_persist_youtube_courses(
        self,
        query: str,
        category: str = "All",
        difficulty: str = "All",
        prefer_full_courses: bool = False,
        max_results: int = 12,
    ) -> List[Course]:
        """
        Searches live YouTube courses via YouTube Data API v3 and saves metadata in SQLite.
        """
        courses = self.youtube.search_courses(
            query=query,
            category=category,
            difficulty=difficulty,
            prefer_full_courses=prefer_full_courses,
            max_results=max_results,
        )
        if courses:
            self.course_repo.upsert_many(courses)
        return courses

    def generate_personalized_recommendations(
        self, student: Student, max_results: int = 12
    ) -> List[RecommendationResult]:
        """
        Builds a personalized search query from the student's career goal, skill gaps,
        and interests, retrieves real YouTube courses, and ranks them with the AI engine.
        """
        query_terms: List[str] = []
        if student.career_goal:
            core_skills, _ = self.kb.get_career_skills(student.career_goal)
            missing_core = [
                sk for sk in core_skills if not student.has_skill(sk, 65.0)
            ]
            # Pick ready-to-learn missing skills first
            ready_missing = [
                sk
                for sk in missing_core
                if all(
                    student.has_skill(p, 35.0)
                    for p in self.kb.get_prerequisites(sk)
                )
            ]
            if ready_missing:
                query_terms.extend(ready_missing[:2])
            elif missing_core:
                query_terms.extend(missing_core[:2])
            else:
                query_terms.append(student.career_goal)

        if student.interests:
            query_terms.extend(student.interests[:2])

        search_query = " ".join(query_terms).strip()
        if not search_query:
            search_query = "Python Programming Computer Science Foundations"

        courses = self.search_and_persist_youtube_courses(
            query=search_query,
            difficulty=student.preferences.preferred_difficulty,
            prefer_full_courses=student.preferences.prefer_full_courses,
            max_results=max_results,
        )

        ranked = self.engine.recommend(student, courses)
        if student.student_id is not None and ranked:
            self.history_repo.record_recommendations(student.student_id, ranked)
        return ranked
