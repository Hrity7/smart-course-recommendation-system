"""
Module 4: Statistical Reasoning - Fuzzy Logic Engine.
Represents learner skill proficiency using continuous fuzzy linguistic variables:
- Beginner
- Intermediate
- Advanced
Computes compatibility between learner skill proficiency and course difficulty
using Mamdani-style fuzzy inference rules and centroid defuzzification.
"""

from typing import Dict

from models.course import Course
from models.student import Student


class FuzzyLogicEngine:
    """
    Fuzzy Logic system for modeling continuous skill proficiency and course difficulty compatibility.
    """

    @staticmethod
    def mu_beginner(score: float) -> float:
        """
        Trapezoidal membership function for 'Beginner' on [0, 100]:
        Full membership [0, 25], linear decay [25, 50], 0 above 50.
        """
        x = max(0.0, min(100.0, float(score)))
        if x <= 25.0:
            return 1.0
        if x >= 50.0:
            return 0.0
        return (50.0 - x) / 25.0

    @staticmethod
    def mu_intermediate(score: float) -> float:
        """
        Triangular/trapezoidal membership function for 'Intermediate' on [0, 100]:
        Rises [25, 45], full membership [45, 65], decays [65, 85].
        """
        x = max(0.0, min(100.0, float(score)))
        if x <= 25.0 or x >= 85.0:
            return 0.0
        if 45.0 <= x <= 65.0:
            return 1.0
        if x < 45.0:
            return (x - 25.0) / 20.0
        return (85.0 - x) / 20.0

    @staticmethod
    def mu_advanced(score: float) -> float:
        """
        Trapezoidal membership function for 'Advanced' on [0, 100]:
        0 below 60, linear rise [60, 80], full membership [80, 100].
        """
        x = max(0.0, min(100.0, float(score)))
        if x <= 60.0:
            return 0.0
        if x >= 80.0:
            return 1.0
        return (x - 60.0) / 20.0

    def fuzzify_skill(self, score: float) -> Dict[str, float]:
        """Returns fuzzy membership degrees for Beginner, Intermediate, and Advanced."""
        return {
            "Beginner": round(self.mu_beginner(score), 4),
            "Intermediate": round(self.mu_intermediate(score), 4),
            "Advanced": round(self.mu_advanced(score), 4),
        }

    def dominant_linguistic_label(self, score: float) -> str:
        """Returns the linguistic category with the highest membership degree."""
        memberships = self.fuzzify_skill(score)
        return max(memberships.items(), key=lambda kv: kv[1])[0]

    def calculate_compatibility(self, student: Student, course: Course) -> float:
        """
        Calculates fuzzy compatibility in [0.0, 1.0] between the learner's relevant skill
        proficiency and the course's difficulty level using fuzzy inference and centroid defuzzification.
        """
        # Determine effective learner skill score for the course's topics/prerequisites
        relevant_scores = []
        for prereq in course.prerequisites:
            relevant_scores.append(student.get_skill_score(prereq))
        for topic in course.topics:
            if student.has_skill(topic, 1.0):
                relevant_scores.append(student.get_skill_score(topic))

        if relevant_scores:
            effective_score = sum(relevant_scores) / len(relevant_scores)
        else:
            effective_score = student.average_skill_score

        mu = self.fuzzify_skill(effective_score)
        b_deg = mu["Beginner"]
        i_deg = mu["Intermediate"]
        a_deg = mu["Advanced"]

        course_diff = course.difficulty

        # Fuzzy Rule Base -> Output linguistic levels:
        # HighCompatibility (centroid = 0.92), MediumCompatibility (centroid = 0.62), LowCompatibility (centroid = 0.20)
        if course_diff == "Beginner":
            # Ideal for Beginner, moderate for Intermediate, low for Advanced
            high_firing = b_deg
            med_firing = i_deg
            low_firing = a_deg
        elif course_diff == "Intermediate":
            # Ideal for Intermediate, moderate for Beginner (stretch) or Advanced (review)
            high_firing = i_deg
            med_firing = max(b_deg * 0.75, a_deg * 0.80)
            low_firing = b_deg * 0.25
        else:  # Advanced
            # Ideal for Advanced, moderate for strong Intermediate, low for Beginner
            high_firing = a_deg
            med_firing = i_deg * 0.85
            low_firing = b_deg

        # Centroid defuzzification
        numerator = (
            high_firing * 0.92 + med_firing * 0.62 + low_firing * 0.20
        )
        denominator = high_firing + med_firing + low_firing
        if denominator <= 1e-6:
            return 0.50

        crisp_compatibility = numerator / denominator
        return round(max(0.0, min(1.0, crisp_compatibility)), 4)
