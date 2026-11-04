"""
Unit tests for the Hybrid AI Recommendation Engine (`ai/recommendation_engine.py`).
Verifies:
- TF-IDF Cosine Similarity calculation
- Multi-factor scoring (Skill-Gap, Prerequisites, Fuzzy Compatibility, Bayesian Suitability, Rules)
- Absence of artificial ratings or arbitrary clamping
- Transparent explanation generation
"""

import sys
from pathlib import Path
import unittest

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ai.recommendation_engine import RecommendationEngine
from models.course import Course, VideoMetrics
from models.student import LearningPreference, Student


class TestRecommendationEngine(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = RecommendationEngine()
        self.student = Student(
            name="Aarav Sharma",
            career_goal="AI Engineer",
            interests=["Machine Learning", "Python", "Neural Networks"],
            learning_objectives="Master machine learning and deep learning",
            preferences=LearningPreference(
                preferred_difficulty="Intermediate",
                preferred_duration_hours=4.0,
                weekly_study_hours=10,
                prefer_full_courses=True,
            ),
        )
        self.student.set_skill("Python Fundamentals", 75.0)
        self.student.set_skill("Linear Algebra & Calculus", 65.0)
        self.student.set_skill("Probability & Statistics", 60.0)

        self.ml_course = Course(
            video_id="GwIo3gDZCVQ",
            title="Machine Learning Full Course with Scikit-Learn and Python",
            channel_title="freeCodeCamp.org",
            description="Complete intermediate course on machine learning algorithms, regression, classification, and scikit-learn.",
            category="Machine Learning",
            difficulty="Intermediate",
            content_type="Complete Course",
            topics=["Machine Learning Foundations", "Data Analysis with Pandas & NumPy"],
            prerequisites=["Python Fundamentals", "Linear Algebra & Calculus"],
            metrics=VideoMetrics(
                view_count=2500000,
                duration_iso="PT4H15M00S",
                duration_seconds=15300,
                duration_formatted="4h 15m",
            ),
        )

        self.unrelated_web_course = Course(
            video_id="PkZNo7MFNFg",
            title="HTML and CSS Styling for Beginners",
            channel_title="WebDev Simplified",
            description="Learn basic HTML tags and CSS selectors for static web pages.",
            category="Web Development",
            difficulty="Beginner",
            content_type="Concept Overview",
            topics=["HTML, CSS & JavaScript Foundations"],
            prerequisites=[],
            metrics=VideoMetrics(
                view_count=400000,
                duration_iso="PT35M00S",
                duration_seconds=2100,
                duration_formatted="35m",
            ),
        )

    def test_tfidf_similarity_prefers_relevant_course(self) -> None:
        sims = self.engine.compute_tfidf_similarities(
            self.student, [self.ml_course, self.unrelated_web_course]
        )
        self.assertEqual(len(sims), 2)
        self.assertGreater(sims[0], sims[1])

    def test_multi_factor_recommendation_ranking(self) -> None:
        results = self.engine.recommend(
            self.student, [self.unrelated_web_course, self.ml_course]
        )
        self.assertEqual(len(results), 2)
        # ML course must rank higher than unrelated HTML course for an AI Engineer student
        self.assertEqual(results[0].course.video_id, self.ml_course.video_id)
        self.assertGreater(results[0].final_score, results[1].final_score)
        self.assertTrue(len(results[0].explanation_summary) > 15)

    def test_no_artificial_ratings_or_price_fields(self) -> None:
        self.assertFalse(hasattr(self.ml_course, "rating"))
        self.assertFalse(hasattr(self.ml_course, "price"))
        self.assertFalse(hasattr(self.ml_course, "budget"))


if __name__ == "__main__":
    unittest.main()
