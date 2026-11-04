"""
Unit tests for SQLite Database Persistence (`database/db_manager.py` & `database/repositories.py`).
Verifies:
- All 7 required tables are created (`students`, `courses`, `student_skills`, `completed_courses`,
  `bookmarked_courses`, `learning_progress`, `recommendation_history`)
- First launch creates a strictly empty student profile with no preset skills
- CRUD persistence for Student, Skills, Courses, Bookmarks, and Progress
"""

import sys
import tempfile
from pathlib import Path
import unittest

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from database.db_manager import DatabaseManager
from database.repositories import (
    CourseRepository,
    ProgressRepository,
    RecommendationHistoryRepository,
    StudentRepository,
)
from models.course import Course, VideoMetrics


class TestDatabasePersistence(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tmp_dir.name) / "test_smart_courses.db"
        self.db = DatabaseManager(db_path=self.db_path)
        self.student_repo = StudentRepository(self.db)
        self.course_repo = CourseRepository(self.db)
        self.progress_repo = ProgressRepository(self.db)
        self.history_repo = RecommendationHistoryRepository(self.db)

    def tearDown(self) -> None:
        self.tmp_dir.cleanup()

    def test_all_seven_tables_exist(self) -> None:
        tables = set(self.db.list_tables())
        expected = {
            "students",
            "courses",
            "student_skills",
            "completed_courses",
            "bookmarked_courses",
            "learning_progress",
            "recommendation_history",
        }
        self.assertTrue(expected.issubset(tables))

    def test_strictly_empty_initial_student_profile(self) -> None:
        student = self.student_repo.get_or_create_active_student()
        self.assertEqual(student.name, "")
        self.assertEqual(student.career_goal, "")
        self.assertEqual(len(student.skills), 0)
        self.assertFalse(student.is_configured)

    def test_save_and_reload_student_and_progress(self) -> None:
        student = self.student_repo.get_or_create_active_student()
        student.name = "Priya Verma"
        student.career_goal = "Data Scientist"
        student.interests = ["SQL", "Pandas"]
        student.set_skill("Python Fundamentals", 70.0)
        self.student_repo.save_student(student)

        reloaded = self.student_repo.get_or_create_active_student()
        self.assertEqual(reloaded.name, "Priya Verma")
        self.assertEqual(reloaded.career_goal, "Data Scientist")
        self.assertTrue(reloaded.has_skill("Python Fundamentals", 65.0))

        course = Course(
            video_id="rfscVS0vtbw",
            title="Learn Python - Full Course for Beginners",
            channel_title="freeCodeCamp.org",
            metrics=VideoMetrics(view_count=42000000, duration_seconds=16000, duration_formatted="4h 26m"),
        )
        self.course_repo.upsert_course(course)
        fetched = self.course_repo.get_by_id("rfscVS0vtbw")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.title, "Learn Python - Full Course for Beginners")

        # Bookmark and progress update
        bm_state = self.progress_repo.toggle_bookmark(reloaded, "rfscVS0vtbw")
        self.assertTrue(bm_state)
        self.progress_repo.update_progress(reloaded, "rfscVS0vtbw", 100.0)
        self.assertIn("rfscVS0vtbw", reloaded.completed_course_ids)


if __name__ == "__main__":
    unittest.main()
