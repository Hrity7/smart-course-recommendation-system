"""
Google Gemini AI Service for personalized recommendation explanations,
weekly learning plans, skill-gap coaching, and interactive course Q&A.
Includes a dedicated `GeminiConfigHandler` that retrieves, sanitizes, and
validates the Gemini API key from environment variables before initiating
any AI Advisor requests.
"""

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from config import BASE_DIR, GEMINI_API_KEY, GEMINI_MODEL
from models.course import Course
from models.recommendation import RecommendationResult
from models.student import Student


@dataclass(frozen=True)
class GeminiValidationResult:
    """Represents the outcome of validating the Gemini API key and model configuration."""

    is_valid: bool
    api_key: str
    model_name: str
    source_env_var: str
    reason: str = "OK"


class GeminiConfigHandler:
    """
    Dedicated configuration handler for the Google Gemini API key and model.
    Ensures the API key is retrieved from environment variables (or .env),
    sanitized, and validated before any AI Advisor request is initiated.
    """

    ENV_VAR_CANDIDATES: Tuple[str, ...] = (
        "GEMINI_API_KEY",
        "GOOGLE_API_KEY",
        "API_KEY",
    )

    PLACEHOLDER_VALUES = {
        "",
        "your_gemini_api_key",
        "my_gemini_api_key",
        "your_api_key",
        "your_google_api_key",
        "insert_gemini_api_key_here",
        "replace_me",
        "none",
        "null",
        "undefined",
    }

    SUPPORTED_MODELS: Tuple[str, ...] = (
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
        "gemini-4-argon",
    )
    DEFAULT_MODEL: str = "gemini-3.8-flash"

    # Standard Google / Gemini API keys are alphanumeric + '-' / '_' and at least 20 characters
    _KEY_PATTERN = re.compile(r"^[A-Za-z0-9_\-]{20,}$")

    def __init__(
        self,
        explicit_api_key: Optional[str] = None,
        explicit_model: Optional[str] = None,
    ) -> None:
        self._explicit_api_key = explicit_api_key
        self._explicit_model = explicit_model

    @staticmethod
    def reload_dotenv_if_present() -> None:
        """Reloads environment variables from .env files if python-dotenv is installed."""
        try:
            from dotenv import load_dotenv

            env_paths = [
                BASE_DIR / ".env",
                BASE_DIR.parent / ".env",
            ]
            for env_path in env_paths:
                if isinstance(env_path, Path) and env_path.exists():
                    load_dotenv(dotenv_path=env_path, override=False)
        except ImportError:
            pass

    @classmethod
    def sanitize_key(cls, raw_key: Optional[str]) -> str:
        """Strips surrounding whitespace and quotes from a raw API key string."""
        if not raw_key or not isinstance(raw_key, str):
            return ""
        cleaned = raw_key.strip()
        if (cleaned.startswith('"') and cleaned.endswith('"')) or (
            cleaned.startswith("'") and cleaned.endswith("'")
        ):
            cleaned = cleaned[1:-1].strip()
        return cleaned

    def resolve_api_key(self) -> Tuple[str, str]:
        """
        Retrieves the Gemini API key in priority order:
        1. Explicit runtime override
        2. OS environment variables (`GEMINI_API_KEY`, `GOOGLE_API_KEY`, `API_KEY`)
        3. `config.GEMINI_API_KEY`
        Returns a tuple of (sanitized_key, source_name).
        """
        if self._explicit_api_key is not None:
            cleaned_explicit = self.sanitize_key(self._explicit_api_key)
            if cleaned_explicit:
                return cleaned_explicit, "explicit_override"

        self.reload_dotenv_if_present()

        for env_var in self.ENV_VAR_CANDIDATES:
            raw_val = os.environ.get(env_var) or os.getenv(env_var, "")
            cleaned = self.sanitize_key(raw_val)
            if cleaned:
                return cleaned, env_var

        fallback_cfg = self.sanitize_key(GEMINI_API_KEY)
        if fallback_cfg:
            return fallback_cfg, "config.GEMINI_API_KEY"

        return "", "missing"

    def resolve_model_name(self) -> str:
        """Resolves and validates the target Gemini model identifier."""
        raw_model = (
            self._explicit_model
            or os.getenv("GEMINI_MODEL", "")
            or GEMINI_MODEL
            or self.DEFAULT_MODEL
        ).strip()
        if not raw_model or raw_model.startswith("gemini-1.5") or raw_model.startswith("gemini-2.0"):
            return self.DEFAULT_MODEL
        return raw_model

    @classmethod
    def validate_api_key_format(cls, key: str) -> Tuple[bool, str]:
        """
        Validates that the API key is non-empty, not a template placeholder,
        and conforms to valid Google API key character and length constraints.
        """
        if not key:
            return False, "GEMINI_API_KEY is not set in environment variables."

        if key.lower() in cls.PLACEHOLDER_VALUES:
            return (
                False,
                "GEMINI_API_KEY contains a placeholder value instead of a real key.",
            )

        if not cls._KEY_PATTERN.match(key):
            return (
                False,
                "GEMINI_API_KEY format is invalid (expected at least 20 alphanumeric/dash/underscore characters).",
            )

        return True, "Valid Gemini API key."

    def validate(self) -> GeminiValidationResult:
        """
        Performs full pre-request configuration retrieval and validation.
        Must be called before initiating any AI Advisor request.
        """
        key, source = self.resolve_api_key()
        model = self.resolve_model_name()
        is_valid, reason = self.validate_api_key_format(key)

        return GeminiValidationResult(
            is_valid=is_valid,
            api_key=key if is_valid else "",
            model_name=model,
            source_env_var=source,
            reason=reason,
        )

    def set_explicit_key(self, api_key: Optional[str]) -> GeminiValidationResult:
        """Updates the runtime API key and immediately returns its validation result."""
        self._explicit_api_key = api_key
        if api_key is not None:
            cleaned = self.sanitize_key(api_key)
            if cleaned:
                os.environ["GEMINI_API_KEY"] = cleaned
        return self.validate()


class GeminiService:
    """
    Object-Oriented wrapper around the `google-genai` SDK (`gemini-3.8-flash`).
    Uses `GeminiConfigHandler` to retrieve and validate `GEMINI_API_KEY` before
    initiating any AI Advisor requests, providing deterministic analytical
    fallbacks when no valid key is present.
    """

    def __init__(
        self, api_key: Optional[str] = None, model_name: Optional[str] = None
    ) -> None:
        self.config_handler = GeminiConfigHandler(
            explicit_api_key=api_key,
            explicit_model=model_name,
        )
        self._client = None
        self._client_key: Optional[str] = None

    @property
    def _explicit_key(self) -> Optional[str]:
        return self.config_handler._explicit_api_key

    @_explicit_key.setter
    def _explicit_key(self, value: Optional[str]) -> None:
        self.config_handler.set_explicit_key(value)
        self._client = None
        self._client_key = None

    @property
    def api_key(self) -> str:
        validation = self.config_handler.validate()
        return validation.api_key

    @property
    def model_name(self) -> str:
        return self.config_handler.resolve_model_name()

    def is_configured(self) -> bool:
        """Returns True only if the Gemini API key is present and passes validation."""
        return self.config_handler.validate().is_valid

    def get_diagnostics(self) -> Dict[str, object]:
        """Returns structured diagnostic metadata for the Gemini configuration."""
        result = self.config_handler.validate()
        return {
            "configured": result.is_valid,
            "model": result.model_name,
            "source": result.source_env_var,
            "reason": result.reason,
        }

    def _get_validated_client(self) -> Tuple[Optional[object], GeminiValidationResult]:
        """
        Validates the environment configuration before initiating any AI Advisor request
        and initializes or refreshes the `google.genai.Client` instance if the key changed.
        """
        validation = self.config_handler.validate()
        if not validation.is_valid:
            self._client = None
            self._client_key = None
            return None, validation

        if self._client is None or self._client_key != validation.api_key:
            try:
                from google import genai

                self._client = genai.Client(api_key=validation.api_key)
                self._client_key = validation.api_key
            except Exception as exc:
                self._client = None
                self._client_key = None
                return (
                    None,
                    GeminiValidationResult(
                        is_valid=False,
                        api_key="",
                        model_name=validation.model_name,
                        source_env_var=validation.source_env_var,
                        reason=f"Failed to initialize google-genai client: {exc}",
                    ),
                )

        return self._client, validation

    def explain_recommendation(
        self, student: Student, result: RecommendationResult
    ) -> str:
        """Explains why a specific YouTube course was recommended to the student."""
        course = result.course
        b = result.breakdown
        client, validation = self._get_validated_client()

        if client is not None and validation.is_valid:
            prompt = (
                f"You are an academic AI advisor. In 2-3 concise sentences, explain why "
                f"the YouTube course '{course.title}' by {course.channel_title} ({course.difficulty}, "
                f"{course.duration_formatted}) is recommended for {student.name or 'the student'} "
                f"(Career Goal: {student.career_goal or 'Tech Specialist'}). "
                f"Reference its AI scores: TF-IDF similarity={b.tfidf_cosine_similarity:.2f}, "
                f"Skill-Gap alignment={b.skill_gap_alignment:.2f}, "
                f"Fuzzy compatibility={b.fuzzy_difficulty_compatibility:.2f}, "
                f"Bayesian suitability={b.bayesian_suitability_posterior:.2f}."
            )
            try:
                resp = client.models.generate_content(
                    model=validation.model_name, contents=prompt
                )
                text = getattr(resp, "text", None)
                if text and text.strip():
                    return text.strip()
            except Exception as exc:
                return (
                    f"[Gemini API notice: {exc}]\n\n"
                    f"Analytical Explanation: {result.explanation_summary}"
                )

        return (
            f"Recommended for {student.name or 'your profile'} targeting "
            f"{student.career_goal or 'skill growth'}: {result.explanation_summary}."
        )

    def generate_weekly_study_plan(
        self, student: Student, top_courses: List[Course]
    ) -> str:
        """Generates a structured weekly study schedule tailored to the student's weekly hours."""
        hours = max(2, student.preferences.weekly_study_hours)
        course_titles = [
            f"- {c.title} ({c.channel_title}, {c.duration_formatted})"
            for c in top_courses[:4]
        ]
        courses_block = (
            "\n".join(course_titles)
            if course_titles
            else "- Foundational skill modules"
        )

        client, validation = self._get_validated_client()
        if client is not None and validation.is_valid:
            prompt = (
                f"Create a concise 4-week study plan ({hours} hours/week) for "
                f"{student.name or 'a student'} aiming to become a {student.career_goal or 'Software Engineer'}.\n"
                f"Selected YouTube courses:\n{courses_block}\n"
                f"Include weekly milestones, hands-on practice goals, and review checkpoints."
            )
            try:
                resp = client.models.generate_content(
                    model=validation.model_name, contents=prompt
                )
                text = getattr(resp, "text", None)
                if text and text.strip():
                    return text.strip()
            except Exception as exc:
                return (
                    f"Unable to reach Gemini API ({exc}). Showing structured local plan:\n\n"
                    + self._fallback_plan(student, top_courses)
                )

        return self._fallback_plan(student, top_courses)

    def answer_career_or_course_question(
        self, student: Student, question: str, context_courses: List[Course]
    ) -> str:
        """Answers a student's question about courses, skills, or career roadmaps."""
        q = (question or "").strip()
        if not q:
            return "Please enter a question about your courses, skills, or career roadmap."

        client, validation = self._get_validated_client()
        if client is not None and validation.is_valid:
            course_context = "\n".join(
                f"- {c.title} by {c.channel_title} ({c.difficulty}, {c.duration_formatted})"
                for c in context_courses[:5]
            )
            skills_summary = (
                ", ".join(f"{k} ({v.score:.0f}%)" for k, v in student.skills.items())
                or "None yet"
            )
            prompt = (
                f"You are an AI Academic & Career Advisor.\n"
                f"Student Name: {student.name or 'Not set'}\n"
                f"Career Goal: {student.career_goal or 'Not set'}\n"
                f"Current Skills: {skills_summary}\n"
                f"Available YouTube Courses:\n{course_context or 'None loaded yet'}\n\n"
                f"Question: {q}\n"
                f"Provide a clear, practical, and academically sound response in 3-5 sentences."
            )
            try:
                resp = client.models.generate_content(
                    model=validation.model_name, contents=prompt
                )
                text = getattr(resp, "text", None)
                if text and text.strip():
                    return text.strip()
            except Exception as exc:
                return f"[Gemini API notice: {exc}]\n\n" + self._fallback_answer(
                    student, q, context_courses
                )

        return self._fallback_answer(student, q, context_courses)

    @staticmethod
    def _fallback_plan(student: Student, top_courses: List[Course]) -> str:
        hours = max(2, student.preferences.weekly_study_hours)
        goal = student.career_goal or "AI Engineer"
        c1 = (
            top_courses[0].title
            if len(top_courses) > 0
            else "Core Prerequisite Foundations"
        )
        c2 = (
            top_courses[1].title
            if len(top_courses) > 1
            else "Applied Intermediate Concepts"
        )
        return (
            f"Weekly Study Schedule ({hours} hrs/week) — Target: {goal}\n"
            f"• Week 1 ({hours}h): Complete foundational modules in '{c1}' and take structured concept notes.\n"
            f"• Week 2 ({hours}h): Finish '{c1}' and implement a small standalone coding exercise.\n"
            f"• Week 3 ({hours}h): Begin '{c2}' focusing on problem-solving patterns and prerequisite links.\n"
            f"• Week 4 ({hours}h): Complete hands-on capstone mini-project and update your Skill Proficiency sliders."
        )

    @staticmethod
    def _fallback_answer(
        student: Student, question: str, context_courses: List[Course]
    ) -> str:
        goal = student.career_goal or "your chosen career track"
        first_course = (
            f"'{context_courses[0].title}' by {context_courses[0].channel_title}"
            if context_courses
            else "foundational YouTube courses matching your skill gaps"
        )
        return (
            f"To progress toward {goal}, focus on satisfying prerequisite skills in order using your "
            f"Learning Roadmap. Based on your current profile, starting with {first_course} "
            f"and allocating {student.preferences.weekly_study_hours} hours per week will build verifiable competency."
        )
