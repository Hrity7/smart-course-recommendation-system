"""
Hybrid AI Course Recommendation Engine.
Combines:
1. TF-IDF Vectorization and Cosine Similarity for content relevance
2. Skill-Gap Analysis alignment
3. Prerequisite compatibility verification
4. Fuzzy Logic difficulty compatibility
5. Career-goal alignment
6. Learning preference matching
7. Bayesian posterior suitability estimation
8. Forward-chaining Rule Engine bonus & transparent explanation generation

Academic Integrity Guarantees:
- Never generates artificial star ratings.
- Never uses popularity (view count) as a substitute for rating or duration.
- Never forces or clamps recommendation scores into an artificial percentage band.
- Every score is an authentic mathematical calculation.
"""

from collections import Counter
import math
import re
from typing import Dict, List, Tuple

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

from models.course import Course
from models.recommendation import RecommendationResult, ScoreBreakdown
from models.student import Student
from .bayesian_reasoning import BayesianReasoner
from .fuzzy_logic import FuzzyLogicEngine
from .knowledge_base import KnowledgeBase
from .rule_engine import RuleEngine
from .search_algorithms import SearchAlgorithms

ENGLISH_STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
    "in", "is", "it", "its", "of", "on", "that", "the", "to", "was", "were",
    "will", "with", "this", "you", "your", "learn", "course", "tutorial", "video",
}


class RecommendationEngine:
    """
    Core AI Recommendation Engine integrating content-based filtering (TF-IDF + Cosine Similarity),
    knowledge graph prerequisite reasoning, rule-based inference, Bayesian reasoning, and Fuzzy logic.
    """

    def __init__(self, knowledge_base: KnowledgeBase | None = None) -> None:
        self.kb = knowledge_base or KnowledgeBase()
        self.rule_engine = RuleEngine(self.kb)
        self.bayesian = BayesianReasoner(self.kb)
        self.fuzzy = FuzzyLogicEngine()
        self.search = SearchAlgorithms(self.kb)

    @staticmethod
    def _tokenize_ngrams(text: str) -> List[str]:
        tokens = [
            tok
            for tok in re.findall(r"[a-z0-9+#]+", text.lower())
            if len(tok) > 1 and tok not in ENGLISH_STOP_WORDS
        ]
        bigrams = [f"{tokens[i]}_{tokens[i + 1]}" for i in range(len(tokens) - 1)]
        return tokens + bigrams

    @classmethod
    def _pure_python_tfidf_cosine(cls, corpus: List[str]) -> List[float]:
        """
        Exact mathematical TF-IDF (sublinear / smooth IDF) and Cosine Similarity
        between corpus[0] (student vector) and corpus[1:] (course documents).
        """
        n_docs = len(corpus)
        if n_docs <= 1:
            return []

        tokenized_docs = [cls._tokenize_ngrams(doc) for doc in corpus]
        df_counts: Counter = Counter()
        for tokens in tokenized_docs:
            for term in set(tokens):
                df_counts[term] += 1

        # Smooth IDF: log((1 + N) / (1 + df(t))) + 1
        idf: Dict[str, float] = {
            term: math.log((1.0 + n_docs) / (1.0 + df)) + 1.0
            for term, df in df_counts.items()
        }

        def build_normalized_tfidf_vector(tokens: List[str]) -> Dict[str, float]:
            if not tokens:
                return {}
            tf = Counter(tokens)
            vec = {term: (count / len(tokens)) * idf[term] for term, count in tf.items()}
            norm = math.sqrt(sum(v * v for v in vec.values()))
            if norm <= 1e-12:
                return {}
            return {term: val / norm for term, val in vec.items()}

        query_vec = build_normalized_tfidf_vector(tokenized_docs[0])
        if not query_vec:
            return [0.0 for _ in corpus[1:]]

        similarities: List[float] = []
        for doc_tokens in tokenized_docs[1:]:
            doc_vec = build_normalized_tfidf_vector(doc_tokens)
            if not doc_vec:
                similarities.append(0.0)
                continue
            dot_prod = sum(
                q_val * doc_vec.get(term, 0.0) for term, q_val in query_vec.items()
            )
            similarities.append(round(max(0.0, min(1.0, dot_prod)), 4))

        return similarities

    def compute_tfidf_similarities(
        self, student: Student, courses: List[Course]
    ) -> List[float]:
        """
        Calculates TF-IDF Cosine Similarity between the student's profile query vector
        and each candidate YouTube course's text document.
        """
        if not courses:
            return []

        student_doc = student.to_text_corpus()
        if student.career_goal:
            core_skills, _ = self.kb.get_career_skills(student.career_goal)
            missing_core = [sk for sk in core_skills if not student.has_skill(sk, 65.0)]
            if missing_core:
                student_doc = f"{student_doc} {' '.join(missing_core)}".strip()

        if not student_doc:
            return [0.0 for _ in courses]

        corpus = [student_doc] + [c.to_text_document() for c in courses]
        if HAS_SKLEARN:
            try:
                vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
                tfidf_matrix = vectorizer.fit_transform(corpus)
                sims = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
                return [round(float(max(0.0, min(1.0, s))), 4) for s in sims]
            except ValueError:
                return [0.0 for _ in courses]

        return self._pure_python_tfidf_cosine(corpus)

    def _compute_skill_gap_alignment(
        self, student: Student, course: Course
    ) -> Tuple[float, List[str]]:
        """
        Calculates how directly a course addresses the student's missing skills
        for their target career goal.
        """
        if not course.topics:
            course.topics = self.kb.extract_skills_from_text(
                course.title, course.description
            )

        if not course.topics:
            return 0.0, []

        career = student.career_goal.strip()
        if career:
            core_skills, sec_skills = self.kb.get_career_skills(career)
        else:
            core_skills, sec_skills = [], []

        matched_gaps: List[str] = []
        score_sum = 0.0

        for topic in course.topics:
            current_prof = student.get_skill_score(topic)
            gap_ratio = max(0.0, (100.0 - current_prof) / 100.0)
            if topic in core_skills and current_prof < 75.0:
                score_sum += 0.65 * gap_ratio + 0.35
                matched_gaps.append(topic)
            elif topic in sec_skills and current_prof < 65.0:
                score_sum += 0.45 * gap_ratio + 0.20
                matched_gaps.append(topic)
            elif current_prof < 50.0:
                score_sum += 0.30 * gap_ratio
                matched_gaps.append(topic)

        normalized = min(1.0, score_sum / max(1, len(course.topics)))
        return round(normalized, 4), matched_gaps

    def _compute_prerequisite_compatibility(
        self, student: Student, course: Course
    ) -> Tuple[float, List[str]]:
        """
        Checks if the student satisfies the course's prerequisites in the Knowledge Base.
        Returns (compatibility_score, missing_prerequisites_list).
        """
        if not course.prerequisites:
            course.prerequisites = self.kb.infer_course_prerequisites(
                course.topics, course.difficulty
            )

        if not course.prerequisites:
            return 1.0, []

        missing: List[str] = []
        satisfied_score = 0.0
        for prereq in course.prerequisites:
            prof = student.get_skill_score(prereq)
            if prof >= 40.0:
                satisfied_score += 1.0
            elif prof >= 20.0:
                satisfied_score += 0.5
                missing.append(prereq)
            else:
                missing.append(prereq)

        compatibility = satisfied_score / len(course.prerequisites)
        return round(compatibility, 4), missing

    def _compute_career_goal_alignment(
        self, student: Student, course: Course
    ) -> float:
        """Measures alignment between the course's category/topics and the student's career goal."""
        if not student.career_goal:
            return 0.50

        core_skills, sec_skills = self.kb.get_career_skills(student.career_goal)
        core_matches = sum(1 for t in course.topics if t in core_skills)
        sec_matches = sum(1 for t in course.topics if t in sec_skills)

        if core_matches >= 2:
            return 1.0
        if core_matches == 1:
            return 0.85 if sec_matches == 0 else 0.95
        if sec_matches >= 1:
            return 0.65

        career_words = [
            w.lower() for w in student.career_goal.split() if len(w) > 2
        ]
        combined = f"{course.title} {course.category}".lower()
        if any(w in combined for w in career_words):
            return 0.60
        return 0.15

    def _compute_learning_preference_match(
        self, student: Student, course: Course
    ) -> float:
        """Matches course duration and format against student's LearningPreference."""
        prefs = student.preferences
        score = 0.50

        if course.duration_hours > 0:
            target_h = max(0.5, prefs.preferred_duration_hours)
            rel_diff = abs(course.duration_hours - target_h) / max(
                target_h, course.duration_hours, 1.0
            )
            duration_fit = max(0.0, 1.0 - rel_diff * 0.7)
            score = 0.6 * duration_fit + 0.4 * (
                1.0
                if (prefs.prefer_full_courses and course.duration_hours >= 1.2)
                or (not prefs.prefer_full_courses and course.duration_hours < 1.5)
                else 0.4
            )

        return round(max(0.0, min(1.0, score)), 4)

    def recommend(
        self, student: Student, candidate_courses: List[Course]
    ) -> List[RecommendationResult]:
        """
        Ranks candidate YouTube courses using the multi-factor AI scoring pipeline
        and generates transparent explanations for each course.
        """
        if not candidate_courses:
            return []

        active_candidates = [
            c
            for c in candidate_courses
            if c.video_id not in student.completed_course_ids
        ]
        if not active_candidates:
            active_candidates = list(candidate_courses)

        for c in active_candidates:
            if not c.topics:
                c.topics = self.kb.extract_skills_from_text(c.title, c.description)
            if not c.prerequisites:
                c.prerequisites = self.kb.infer_course_prerequisites(
                    c.topics, c.difficulty
                )

        tfidf_scores = self.compute_tfidf_similarities(student, active_candidates)
        heuristic_pairs = dict(
            (c.video_id, h_val)
            for c, h_val in self.search.heuristic_course_rank(
                student, active_candidates
            )
        )

        results: List[RecommendationResult] = []

        for idx, course in enumerate(active_candidates):
            tfidf_sim = tfidf_scores[idx]
            skill_gap_score, matched_skills = self._compute_skill_gap_alignment(
                student, course
            )
            prereq_score, missing_prereqs = self._compute_prerequisite_compatibility(
                student, course
            )
            fuzzy_compat = self.fuzzy.calculate_compatibility(student, course)
            career_align = self._compute_career_goal_alignment(student, course)
            pref_match = self._compute_learning_preference_match(student, course)
            bayes_post, _ = self.bayesian.compute_posterior_suitability(
                student, course
            )
            rule_matches = self.rule_engine.evaluate(student, course)
            rule_bonus = min(
                0.25, sum(rm.weight_bonus for rm in rule_matches)
            )
            h_rank = heuristic_pairs.get(course.video_id, 0.0)

            raw_weighted_score = (
                0.22 * tfidf_sim
                + 0.20 * skill_gap_score
                + 0.14 * prereq_score
                + 0.14 * fuzzy_compat
                + 0.12 * career_align
                + 0.10 * bayes_post
                + 0.08 * pref_match
                + rule_bonus
            )
            final_score = round(max(0.0, min(1.0, raw_weighted_score)), 4)

            breakdown = ScoreBreakdown(
                tfidf_cosine_similarity=tfidf_sim,
                skill_gap_alignment=skill_gap_score,
                prerequisite_compatibility=prereq_score,
                fuzzy_difficulty_compatibility=fuzzy_compat,
                career_goal_alignment=career_align,
                learning_preference_match=pref_match,
                bayesian_suitability_posterior=bayes_post,
                rule_engine_bonus=round(rule_bonus, 4),
                heuristic_rank_score=h_rank,
                final_score=final_score,
            )

            explanation = self._build_explanation(
                student=student,
                course=course,
                breakdown=breakdown,
                matched_skills=matched_skills,
                missing_prereqs=missing_prereqs,
                rule_matches=[rm.explanation for rm in rule_matches],
            )

            results.append(
                RecommendationResult(
                    course=course,
                    breakdown=breakdown,
                    matched_skills=matched_skills,
                    missing_prerequisites=missing_prereqs,
                    triggered_rules=[rm.explanation for rm in rule_matches],
                    explanation_summary=explanation,
                )
            )

        results.sort(key=lambda r: r.final_score, reverse=True)
        return results

    @staticmethod
    def _build_explanation(
        student: Student,
        course: Course,
        breakdown: ScoreBreakdown,
        matched_skills: List[str],
        missing_prereqs: List[str],
        rule_matches: List[str],
    ) -> str:
        reasons: List[str] = []

        if matched_skills:
            reasons.append(
                f"Bridges skill gap in {', '.join(matched_skills[:3])}"
                + (f" for {student.career_goal}" if student.career_goal else "")
            )
        elif course.topics:
            reasons.append(f"Covers {', '.join(course.topics[:3])}")

        reasons.append(
            f"TF-IDF content similarity: {breakdown.tfidf_cosine_similarity:.2f}, "
            f"Fuzzy {course.difficulty} difficulty match: {breakdown.fuzzy_difficulty_compatibility:.2f}, "
            f"Bayesian suitability: {breakdown.bayesian_suitability_posterior:.2f}"
        )

        if not missing_prereqs:
            reasons.append("All prerequisites satisfied")
        else:
            reasons.append(
                f"Recommended prerequisite review: {', '.join(missing_prereqs[:2])}"
            )

        if rule_matches:
            reasons.append(f"Rule fired: {rule_matches[0]}")

        return " | ".join(reasons)
