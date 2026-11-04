"""
Unit tests for Module 3 (Knowledge Base & Rule Engine) and Module 4 (Bayesian & Fuzzy Logic):
- Knowledge Base prerequisite DAG and career skill mappings
- Forward-chaining IF-THEN rule evaluation (e.g., AI Engineer + Python + Math -> Machine Learning)
- Bayesian posterior suitability computation under evidence updates
- Fuzzy Logic linguistic membership functions and centroid defuzzification
"""

import sys
from pathlib import Path
import unittest

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ai.bayesian_reasoning import BayesianReasoner
from ai.fuzzy_logic import FuzzyLogicEngine
from ai.knowledge_base import KnowledgeBase
from ai.rule_engine import RuleEngine
from models.course import Course, VideoMetrics
from models.student import Student


class TestKnowledgeAndStatisticalReasoning(unittest.TestCase):
    def setUp(self) -> None:
        self.kb = KnowledgeBase()
        self.rule_engine = RuleEngine(self.kb)
        self.bayesian = BayesianReasoner(self.kb)
        self.fuzzy = FuzzyLogicEngine()

    def test_knowledge_base_career_and_prerequisites(self) -> None:
        prereqs = self.kb.get_prerequisites("Machine Learning Foundations")
        self.assertIn("Python Fundamentals", prereqs)
        self.assertIn("Linear Algebra & Calculus", prereqs)

        core, secondary = self.kb.get_career_skills("AI Engineer")
        self.assertIn("Machine Learning Foundations", core)
        self.assertIn("Deep Learning & Neural Networks", core)

    def test_forward_chaining_rule_r1_ai_engineer_to_ml(self) -> None:
        # IF student wants to become an AI Engineer AND has Python Fundamentals AND has Math
        # THEN recommend Machine Learning
        student = Student(name="Rohan", career_goal="AI Engineer")
        student.set_skill("Python Fundamentals", 80.0)
        student.set_skill("Linear Algebra & Calculus", 70.0)

        ml_course = Course(
            video_id="GwIo3gDZCVQ",
            title="Machine Learning Foundations with Python",
            channel_title="StatQuest",
            difficulty="Intermediate",
            topics=["Machine Learning Foundations"],
            prerequisites=["Python Fundamentals", "Linear Algebra & Calculus"],
            metrics=VideoMetrics(duration_seconds=7200, duration_formatted="2h"),
        )

        matches = self.rule_engine.evaluate(student, ml_course)
        rule_ids = [m.rule_id for m in matches]
        self.assertIn("R1", rule_ids)

    def test_bayesian_posterior_increases_with_positive_evidence(self) -> None:
        student = Student(
            name="Meera",
            career_goal="Data Scientist",
            interests=["Machine Learning", "Pandas"],
        )
        student.set_skill("Python Fundamentals", 80.0)
        student.set_skill("Linear Algebra & Calculus", 75.0)
        student.set_skill("Probability & Statistics", 75.0)

        suitable_course = Course(
            video_id="GwIo3gDZCVQ",
            title="Data Analysis with Pandas & Machine Learning",
            channel_title="DataSchool",
            difficulty="Intermediate",
            topics=["Data Analysis with Pandas & NumPy", "Machine Learning Foundations"],
            prerequisites=["Python Fundamentals", "Probability & Statistics"],
            metrics=VideoMetrics(duration_seconds=9000, duration_formatted="2h 30m"),
        )

        unsuitable_course = Course(
            video_id="PkZNo7MFNFg",
            title="Advanced Assembly Kernel Exploitation",
            channel_title="SecLab",
            difficulty="Advanced",
            topics=["Application & Network Security"],
            prerequisites=["Networking & Linux Fundamentals"],
            metrics=VideoMetrics(duration_seconds=1800, duration_formatted="30m"),
        )

        post_good, _ = self.bayesian.compute_posterior_suitability(student, suitable_course)
        post_bad, _ = self.bayesian.compute_posterior_suitability(student, unsuitable_course)
        self.assertGreater(post_good, post_bad)
        self.assertGreater(post_good, 0.70)

    def test_fuzzy_logic_membership_and_compatibility(self) -> None:
        m_low = self.fuzzy.fuzzify_skill(15.0)
        self.assertEqual(m_low["Beginner"], 1.0)
        self.assertEqual(m_low["Advanced"], 0.0)

        m_mid = self.fuzzy.fuzzify_skill(55.0)
        self.assertEqual(m_mid["Intermediate"], 1.0)

        m_high = self.fuzzy.fuzzify_skill(90.0)
        self.assertEqual(m_high["Advanced"], 1.0)

        beginner_student = Student(name="Newbie")
        beginner_student.set_skill("Python Fundamentals", 15.0)

        beg_course = Course(
            video_id="rfscVS0vtbw",
            title="Python for Beginners",
            channel_title="CS",
            difficulty="Beginner",
            topics=["Python Fundamentals"],
        )
        adv_course = Course(
            video_id="aircAruvnKk",
            title="Advanced Transformers Research",
            channel_title="AI Lab",
            difficulty="Advanced",
            topics=["Natural Language Processing & LLMs"],
            prerequisites=["Deep Learning & Neural Networks"],
        )

        compat_beg = self.fuzzy.calculate_compatibility(beginner_student, beg_course)
        compat_adv = self.fuzzy.calculate_compatibility(beginner_student, adv_course)
        self.assertGreater(compat_beg, compat_adv)


if __name__ == "__main__":
    unittest.main()
