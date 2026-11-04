"""
Data Access Object (Repository) classes for Student, Course, Progress, and Recommendation History.
"""

import json
from typing import Dict, List, Optional

from models.course import Course, VideoMetrics
from models.recommendation import RecommendationResult
from models.student import LearningPreference, SkillProficiency, Student
from .db_manager import DatabaseManager


class StudentRepository:
    """Handles persistence of Student profiles and skills in SQLite."""

    def __init__(self, db: DatabaseManager) -> None:
        self.db = db

    def get_or_create_active_student(self) -> Student:
        """
        Loads the active student from SQLite.
        On first launch, creates an empty Student record (no sample presets).
        """
        with self.db.get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM students ORDER BY student_id ASC LIMIT 1;"
            ).fetchone()

            if row is None:
                cursor = conn.execute(
                    """
                    INSERT INTO students (
                        name, career_goal, interests, learning_objectives,
                        preferred_difficulty, preferred_duration_hours,
                        weekly_study_hours, learning_style, prefer_full_courses
                    ) VALUES ('', '', '', '', 'Beginner', 3.0, 8, 'Hands-on Projects', 1);
                    """
                )
                conn.commit()
                student_id = int(cursor.lastrowid)
                return Student(student_id=student_id)

            student_id = int(row["student_id"])
            interests_raw = row["interests"] or ""
            interests = [i.strip() for i in interests_raw.split(",") if i.strip()]

            prefs = LearningPreference(
                preferred_difficulty=row["preferred_difficulty"] or "Beginner",
                preferred_duration_hours=float(row["preferred_duration_hours"] or 3.0),
                weekly_study_hours=int(row["weekly_study_hours"] or 8),
                learning_style=row["learning_style"] or "Hands-on Projects",
                prefer_full_courses=bool(row["prefer_full_courses"]),
            )

            # Load skills
            skill_rows = conn.execute(
                "SELECT skill_name, proficiency_score, category FROM student_skills WHERE student_id = ?;",
                (student_id,),
            ).fetchall()
            skills: Dict[str, SkillProficiency] = {}
            for s_row in skill_rows:
                s_name = s_row["skill_name"]
                skills[s_name] = SkillProficiency(
                    skill_name=s_name,
                    score=float(s_row["proficiency_score"]),
                    category=s_row["category"] or "General",
                )

            # Load completed courses
            comp_rows = conn.execute(
                "SELECT video_id FROM completed_courses WHERE student_id = ?;",
                (student_id,),
            ).fetchall()
            completed_ids = [r["video_id"] for r in comp_rows]

            # Load bookmarked courses
            bm_rows = conn.execute(
                "SELECT video_id FROM bookmarked_courses WHERE student_id = ?;",
                (student_id,),
            ).fetchall()
            bookmarked_ids = [r["video_id"] for r in bm_rows]

            # Load learning progress
            prog_rows = conn.execute(
                "SELECT video_id, progress_percent FROM learning_progress WHERE student_id = ?;",
                (student_id,),
            ).fetchall()
            progress_map = {r["video_id"]: float(r["progress_percent"]) for r in prog_rows}

            return Student(
                student_id=student_id,
                name=row["name"] or "",
                career_goal=row["career_goal"] or "",
                interests=interests,
                learning_objectives=row["learning_objectives"] or "",
                skills=skills,
                completed_course_ids=completed_ids,
                bookmarked_course_ids=bookmarked_ids,
                course_progress=progress_map,
                preferences=prefs,
            )

    def save_student(self, student: Student) -> Student:
        """Saves student profile and skills atomically."""
        interests_str = ", ".join(i.strip() for i in student.interests if i.strip())
        with self.db.get_connection() as conn:
            if student.student_id is None:
                cursor = conn.execute(
                    """
                    INSERT INTO students (
                        name, career_goal, interests, learning_objectives,
                        preferred_difficulty, preferred_duration_hours,
                        weekly_study_hours, learning_style, prefer_full_courses
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (
                        student.name.strip(),
                        student.career_goal.strip(),
                        interests_str,
                        student.learning_objectives.strip(),
                        student.preferences.preferred_difficulty,
                        student.preferences.preferred_duration_hours,
                        student.preferences.weekly_study_hours,
                        student.preferences.learning_style,
                        1 if student.preferences.prefer_full_courses else 0,
                    ),
                )
                student.student_id = int(cursor.lastrowid)
            else:
                conn.execute(
                    """
                    UPDATE students
                    SET name = ?,
                        career_goal = ?,
                        interests = ?,
                        learning_objectives = ?,
                        preferred_difficulty = ?,
                        preferred_duration_hours = ?,
                        weekly_study_hours = ?,
                        learning_style = ?,
                        prefer_full_courses = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE student_id = ?;
                    """,
                    (
                        student.name.strip(),
                        student.career_goal.strip(),
                        interests_str,
                        student.learning_objectives.strip(),
                        student.preferences.preferred_difficulty,
                        student.preferences.preferred_duration_hours,
                        student.preferences.weekly_study_hours,
                        student.preferences.learning_style,
                        1 if student.preferences.prefer_full_courses else 0,
                        student.student_id,
                    ),
                )

            # Sync skills
            conn.execute(
                "DELETE FROM student_skills WHERE student_id = ?;",
                (student.student_id,),
            )
            for skill in student.skills.values():
                conn.execute(
                    """
                    INSERT INTO student_skills (student_id, skill_name, proficiency_score, category)
                    VALUES (?, ?, ?, ?);
                    """,
                    (student.student_id, skill.skill_name, skill.score, skill.category),
                )

            conn.commit()
        return student


class CourseRepository:
    """Stores and retrieves genuine YouTube courses in SQLite."""

    def __init__(self, db: DatabaseManager) -> None:
        self.db = db

    def upsert_course(self, course: Course) -> None:
        with self.db.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO courses (
                    video_id, title, channel_title, description, category,
                    difficulty, content_type, topics, prerequisites,
                    published_at, thumbnail_url, language, view_count,
                    like_count, comment_count, duration_iso,
                    duration_seconds, duration_formatted, last_fetched
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(video_id) DO UPDATE SET
                    title = excluded.title,
                    channel_title = excluded.channel_title,
                    description = excluded.description,
                    category = excluded.category,
                    difficulty = excluded.difficulty,
                    content_type = excluded.content_type,
                    topics = excluded.topics,
                    prerequisites = excluded.prerequisites,
                    published_at = excluded.published_at,
                    thumbnail_url = excluded.thumbnail_url,
                    view_count = excluded.view_count,
                    like_count = excluded.like_count,
                    comment_count = excluded.comment_count,
                    duration_iso = excluded.duration_iso,
                    duration_seconds = excluded.duration_seconds,
                    duration_formatted = excluded.duration_formatted,
                    last_fetched = CURRENT_TIMESTAMP;
                """,
                (
                    course.video_id,
                    course.title,
                    course.channel_title,
                    course.description,
                    course.category,
                    course.difficulty,
                    course.content_type,
                    json.dumps(course.topics),
                    json.dumps(course.prerequisites),
                    course.published_at,
                    course.thumbnail_url,
                    course.language,
                    course.metrics.view_count,
                    course.metrics.like_count,
                    course.metrics.comment_count,
                    course.metrics.duration_iso,
                    course.metrics.duration_seconds,
                    course.metrics.duration_formatted,
                ),
            )
            conn.commit()

    def upsert_many(self, courses: List[Course]) -> None:
        for course in courses:
            self.upsert_course(course)

    def get_by_id(self, video_id: str) -> Optional[Course]:
        with self.db.get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM courses WHERE video_id = ?;", (video_id,)
            ).fetchone()
            if not row:
                return None
            return self._row_to_course(row)

    def get_by_ids(self, video_ids: List[str]) -> List[Course]:
        if not video_ids:
            return []
        placeholders = ",".join("?" for _ in video_ids)
        with self.db.get_connection() as conn:
            rows = conn.execute(
                f"SELECT * FROM courses WHERE video_id IN ({placeholders});",
                tuple(video_ids),
            ).fetchall()
            by_id = {r["video_id"]: self._row_to_course(r) for r in rows}
            return [by_id[vid] for vid in video_ids if vid in by_id]

    def get_all_cached_courses(self, limit: int = 100) -> List[Course]:
        with self.db.get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM courses ORDER BY last_fetched DESC LIMIT ?;", (limit,)
            ).fetchall()
            return [self._row_to_course(r) for r in rows]

    @staticmethod
    def _row_to_course(row) -> Course:
        try:
            topics = json.loads(row["topics"]) if row["topics"] else []
        except Exception:
            topics = [t.strip() for t in str(row["topics"]).split(",") if t.strip()]

        try:
            prerequisites = json.loads(row["prerequisites"]) if row["prerequisites"] else []
        except Exception:
            prerequisites = [p.strip() for p in str(row["prerequisites"]).split(",") if p.strip()]

        metrics = VideoMetrics(
            view_count=row["view_count"],
            like_count=row["like_count"],
            comment_count=row["comment_count"],
            duration_iso=row["duration_iso"] or "",
            duration_seconds=int(row["duration_seconds"] or 0),
            duration_formatted=row["duration_formatted"] or "Duration unavailable",
        )
        return Course(
            video_id=row["video_id"],
            title=row["title"],
            channel_title=row["channel_title"],
            description=row["description"] or "",
            category=row["category"] or "Computer Science",
            difficulty=row["difficulty"] or "Beginner",
            content_type=row["content_type"] or "Tutorial",
            topics=topics,
            prerequisites=prerequisites,
            published_at=row["published_at"] or "",
            thumbnail_url=row["thumbnail_url"] or "",
            language=row["language"] or "English",
            metrics=metrics,
        )


class ProgressRepository:
    """Manages bookmarks, course completion status, and percentage learning progress."""

    def __init__(self, db: DatabaseManager) -> None:
        self.db = db

    def toggle_bookmark(self, student: Student, video_id: str) -> bool:
        """Toggles bookmark state; returns True if now bookmarked, False if removed."""
        if student.student_id is None:
            return False
        with self.db.get_connection() as conn:
            existing = conn.execute(
                "SELECT id FROM bookmarked_courses WHERE student_id = ? AND video_id = ?;",
                (student.student_id, video_id),
            ).fetchone()
            if existing:
                conn.execute(
                    "DELETE FROM bookmarked_courses WHERE student_id = ? AND video_id = ?;",
                    (student.student_id, video_id),
                )
                if video_id in student.bookmarked_course_ids:
                    student.bookmarked_course_ids.remove(video_id)
                conn.commit()
                return False
            else:
                conn.execute(
                    "INSERT INTO bookmarked_courses (student_id, video_id) VALUES (?, ?);",
                    (student.student_id, video_id),
                )
                if video_id not in student.bookmarked_course_ids:
                    student.bookmarked_course_ids.append(video_id)
                conn.commit()
                return True

    def set_course_completed(
        self, student: Student, video_id: str, completed: bool = True
    ) -> None:
        """Marks a course as completed (100% progress) or uncompleted."""
        if student.student_id is None:
            return
        with self.db.get_connection() as conn:
            if completed:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO completed_courses (student_id, video_id)
                    VALUES (?, ?);
                    """,
                    (student.student_id, video_id),
                )
                conn.execute(
                    """
                    INSERT INTO learning_progress (student_id, video_id, progress_percent, updated_at)
                    VALUES (?, ?, 100.0, CURRENT_TIMESTAMP)
                    ON CONFLICT(student_id, video_id) DO UPDATE SET
                        progress_percent = 100.0,
                        updated_at = CURRENT_TIMESTAMP;
                    """,
                    (student.student_id, video_id),
                )
                if video_id not in student.completed_course_ids:
                    student.completed_course_ids.append(video_id)
                student.course_progress[video_id] = 100.0
            else:
                conn.execute(
                    "DELETE FROM completed_courses WHERE student_id = ? AND video_id = ?;",
                    (student.student_id, video_id),
                )
                if video_id in student.completed_course_ids:
                    student.completed_course_ids.remove(video_id)
            conn.commit()

    def update_progress(
        self, student: Student, video_id: str, progress_percent: float, notes: str = ""
    ) -> None:
        """Updates course progress percentage [0, 100] and syncs completion table if 100%."""
        if student.student_id is None:
            return
        pct = max(0.0, min(100.0, float(progress_percent)))
        with self.db.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO learning_progress (student_id, video_id, progress_percent, notes, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(student_id, video_id) DO UPDATE SET
                    progress_percent = excluded.progress_percent,
                    notes = CASE WHEN excluded.notes != '' THEN excluded.notes ELSE learning_progress.notes END,
                    updated_at = CURRENT_TIMESTAMP;
                """,
                (student.student_id, video_id, pct, notes),
            )
            conn.commit()
        student.course_progress[video_id] = pct
        if pct >= 100.0:
            self.set_course_completed(student, video_id, True)
        elif video_id in student.completed_course_ids:
            self.set_course_completed(student, video_id, False)


class RecommendationHistoryRepository:
    """Logs AI recommendation runs and score breakdowns for auditability and analytics."""

    def __init__(self, db: DatabaseManager) -> None:
        self.db = db

    def record_recommendations(
        self, student_id: int, results: List[RecommendationResult], max_entries: int = 10
    ) -> None:
        with self.db.get_connection() as conn:
            for res in results[:max_entries]:
                b = res.breakdown
                conn.execute(
                    """
                    INSERT INTO recommendation_history (
                        student_id, video_id, final_score, tfidf_score,
                        skill_gap_score, prerequisite_score, fuzzy_score,
                        bayesian_score, explanation
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (
                        student_id,
                        res.course.video_id,
                        b.final_score,
                        b.tfidf_cosine_similarity,
                        b.skill_gap_alignment,
                        b.prerequisite_compatibility,
                        b.fuzzy_difficulty_compatibility,
                        b.bayesian_suitability_posterior,
                        res.explanation_summary,
                    ),
                )
            conn.commit()

    def get_recent_history(self, student_id: int, limit: int = 20) -> List[dict]:
        with self.db.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT h.*, c.title, c.channel_title
                FROM recommendation_history h
                LEFT JOIN courses c ON h.video_id = c.video_id
                WHERE h.student_id = ?
                ORDER BY h.created_at DESC
                LIMIT ?;
                """,
                (student_id, limit),
            ).fetchall()
            return [dict(r) for r in rows]
