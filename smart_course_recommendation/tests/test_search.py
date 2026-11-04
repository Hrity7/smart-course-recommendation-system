"""
Unit tests for Module 1 AI Search Methodologies (`ai/search_algorithms.py` & `ai/roadmap_generator.py`):
- Breadth-First Search (BFS) shortest prerequisite path
- Depth-First Search (DFS) alternative learning paths
- A* Search optimal path with g(n) cost and h(n) admissible heuristic
- Heuristic Search course ranking
"""

import sys
from pathlib import Path
import unittest

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ai.knowledge_base import KnowledgeBase
from ai.roadmap_generator import RoadmapGenerator
from ai.search_algorithms import SearchAlgorithms
from models.course import Course, VideoMetrics
from models.student import Student


class TestSearchAlgorithms(unittest.TestCase):
    def setUp(self) -> None:
        self.kb = KnowledgeBase()
        self.search = SearchAlgorithms(self.kb)
        self.roadmap_gen = RoadmapGenerator(self.kb, self.search)

    def test_bfs_shortest_prerequisite_path(self) -> None:
        acquired = {"Python Fundamentals"}
        path = self.search.bfs_shortest_prerequisite_path(
            acquired, "Data Structures & Algorithms"
        )
        self.assertIn("Object-Oriented Programming", path)
        self.assertIn("Data Structures & Algorithms", path)
        self.assertLess(
            path.index("Object-Oriented Programming"),
            path.index("Data Structures & Algorithms"),
        )

    def test_bfs_shortest_chain_between_skills(self) -> None:
        chain = self.search.bfs_shortest_chain_between(
            "Python Fundamentals", "Data Structures & Algorithms"
        )
        self.assertEqual(chain[0], "Python Fundamentals")
        self.assertEqual(chain[-1], "Data Structures & Algorithms")

    def test_dfs_explores_alternative_paths(self) -> None:
        acquired = {"Python Fundamentals"}
        paths = self.search.dfs_explore_alternative_paths(
            acquired,
            ["Machine Learning Foundations", "Data Structures & Algorithms"],
            max_paths=3,
        )
        self.assertGreaterEqual(len(paths), 1)
        for p in paths:
            self.assertIn("Machine Learning Foundations", p)
            self.assertIn("Data Structures & Algorithms", p)

    def test_a_star_optimal_roadmap_respects_prerequisites(self) -> None:
        student = Student(name="Test", career_goal="Data Scientist")
        student.set_skill("Python Fundamentals", 85.0)
        seq, metrics = self.search.a_star_optimal_roadmap(
            student, ["Machine Learning Foundations"]
        )
        self.assertIn("Linear Algebra & Calculus", seq)
        self.assertIn("Probability & Statistics", seq)
        self.assertIn("Machine Learning Foundations", seq)
        # Prerequisite must precede dependent skill
        self.assertLess(
            seq.index("Linear Algebra & Calculus"),
            seq.index("Probability & Statistics"),
        )
        self.assertLess(
            seq.index("Probability & Statistics"),
            seq.index("Machine Learning Foundations"),
        )
        self.assertGreater(metrics["Machine Learning Foundations"]["f"], 0.0)

    def test_heuristic_course_rank(self) -> None:
        student = Student(name="Test", career_goal="Cybersecurity Analyst")
        c1 = Course(
            video_id="12345678901",
            title="Networking & Linux Fundamentals Course",
            channel_title="NetSec",
            topics=["Networking & Linux Fundamentals"],
            metrics=VideoMetrics(duration_seconds=10800, duration_formatted="3h"),
        )
        c2 = Course(
            video_id="12345678902",
            title="Frontend CSS Animations",
            channel_title="DesignLab",
            topics=["HTML, CSS & JavaScript Foundations"],
            metrics=VideoMetrics(duration_seconds=3600, duration_formatted="1h"),
        )
        ranked = self.search.heuristic_course_rank(student, [c2, c1])
        self.assertEqual(ranked[0][0].video_id, "12345678901")


if __name__ == "__main__":
    unittest.main()
