"""
Module 4: Statistical Reasoning - Bayesian Reasoning Engine.
Estimates posterior probability P(Suitable | Evidence) for a candidate course
given uncertain or partial learner profile evidence using Bayes' Theorem.
"""

from typing import Dict, Tuple

from models.course import Course
from models.student import Student
from .knowledge_base import KnowledgeBase


class BayesianReasoner:
    """
    Applies Bayes' Theorem sequentially across multiple observed evidence variables:
        P(S | E_1, E_2, ..., E_n) =
            [P(S) * prod_i P(E_i | S)] /
            [P(S) * prod_i P(E_i | S) + P(~S) * prod_i P(E_i | ~S)]
    Handles cold-start uncertainty gracefully when learner preferences are sparse.
    """

    def __init__(self, knowledge_base: KnowledgeBase) -> None:
        self.kb = knowledge_base

    def compute_posterior_suitability(
        self, student: Student, course: Course
    ) -> Tuple[float, Dict[str, float]]:
        """
        Calculates the posterior probability P(Suitable | Evidence) in [0.0, 1.0]
        along with the likelihood trace for transparency.
        """
        # 1. Prior probability P(Suitable) based on whether profile is configured
        prior_s = 0.50
        if student.career_goal:
            core_skills, sec_skills = self.kb.get_career_skills(student.career_goal)
            if any(t in core_skills for t in course.topics):
                prior_s = 0.65
            elif any(t in sec_skills for t in course.topics):
                prior_s = 0.55
            else:
                prior_s = 0.35

        # Pairs of (P(E_i | Suitable), P(E_i | NotSuitable))
        likelihoods: Dict[str, Tuple[float, float]] = {}

        # Evidence 1: Interest & Topic Overlap
        interest_tokens = {
            tok.lower()
            for item in student.interests
            for tok in item.replace(",", " ").split()
            if len(tok) > 2
        }
        course_text = f"{course.title} {course.category} {' '.join(course.topics)}".lower()
        if interest_tokens:
            matched_interests = sum(1 for tok in interest_tokens if tok in course_text)
            if matched_interests > 0:
                likelihoods["interest_match"] = (0.82, 0.25)
            else:
                likelihoods["interest_match"] = (0.35, 0.65)
        else:
            # Uncertainty handling: uninformative likelihood when student hasn't specified interests
            likelihoods["interest_match"] = (0.50, 0.50)

        # Evidence 2: Prerequisite Readiness
        if not course.prerequisites:
            likelihoods["prerequisite_readiness"] = (0.75, 0.45)
        else:
            met = sum(1 for p in course.prerequisites if student.has_skill(p, 35.0))
            ratio = met / len(course.prerequisites)
            if ratio >= 0.8:
                likelihoods["prerequisite_readiness"] = (0.85, 0.20)
            elif ratio >= 0.4:
                likelihoods["prerequisite_readiness"] = (0.55, 0.45)
            else:
                likelihoods["prerequisite_readiness"] = (0.20, 0.78)

        # Evidence 3: Difficulty Match with Learner Level
        learner_level = student.overall_level
        if course.difficulty == learner_level:
            likelihoods["difficulty_alignment"] = (0.80, 0.30)
        elif (
            (learner_level == "Beginner" and course.difficulty == "Intermediate")
            or (learner_level == "Intermediate" and course.difficulty in ("Beginner", "Advanced"))
            or (learner_level == "Advanced" and course.difficulty == "Intermediate")
        ):
            likelihoods["difficulty_alignment"] = (0.55, 0.45)
        else:
            likelihoods["difficulty_alignment"] = (0.22, 0.75)

        # Evidence 4: Content Format / Duration Preference
        if course.duration_hours > 0:
            if student.preferences.prefer_full_courses and course.duration_hours >= 1.2:
                likelihoods["format_preference"] = (0.76, 0.35)
            elif not student.preferences.prefer_full_courses and course.duration_hours < 1.5:
                likelihoods["format_preference"] = (0.76, 0.35)
            else:
                likelihoods["format_preference"] = (0.48, 0.52)
        else:
            likelihoods["format_preference"] = (0.50, 0.50)

        # Multiply likelihoods under conditional independence assumption (Naive Bayes update)
        prob_e_given_s = 1.0
        prob_e_given_not_s = 1.0
        trace: Dict[str, float] = {"prior": round(prior_s, 4)}

        for ev_name, (p_s, p_not_s) in likelihoods.items():
            prob_e_given_s *= p_s
            prob_e_given_not_s *= p_not_s
            trace[ev_name] = round(p_s / max(0.01, p_s + p_not_s), 4)

        numerator = prior_s * prob_e_given_s
        denominator = numerator + (1.0 - prior_s) * prob_e_given_not_s
        posterior = numerator / denominator if denominator > 0 else prior_s

        trace["posterior"] = round(posterior, 4)
        return round(posterior, 4), trace
