"""
SQLite Database Manager handling schema initialization, migrations, and safe transactions.
Creates all 7 required tables:
1. students
2. courses
3. student_skills
4. completed_courses
5. bookmarked_courses
6. learning_progress
7. recommendation_history
"""

import sqlite3
from pathlib import Path
from typing import Optional, Union

from config import DB_PATH


class DatabaseManager:
    """Manages SQLite connections and initializes the schema without pre-loading dummy profiles."""

    def __init__(self, db_path: Optional[Union[str, Path]] = None) -> None:
        self.db_path = Path(db_path) if db_path else DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize_schema()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def initialize_schema(self) -> None:
        """Creates all required database tables if they do not exist."""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # 1. students table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS students (
                    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL DEFAULT '',
                    career_goal TEXT NOT NULL DEFAULT '',
                    interests TEXT NOT NULL DEFAULT '',
                    learning_objectives TEXT NOT NULL DEFAULT '',
                    preferred_difficulty TEXT NOT NULL DEFAULT 'Beginner',
                    preferred_duration_hours REAL NOT NULL DEFAULT 3.0,
                    weekly_study_hours INTEGER NOT NULL DEFAULT 8,
                    learning_style TEXT NOT NULL DEFAULT 'Hands-on Projects',
                    prefer_full_courses INTEGER NOT NULL DEFAULT 1,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )

            # 2. courses table (stores real retrieved YouTube courses; zero pricing columns)
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS courses (
                    video_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    channel_title TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    category TEXT NOT NULL DEFAULT 'Computer Science',
                    difficulty TEXT NOT NULL DEFAULT 'Beginner',
                    content_type TEXT NOT NULL DEFAULT 'Tutorial',
                    topics TEXT NOT NULL DEFAULT '',
                    prerequisites TEXT NOT NULL DEFAULT '',
                    published_at TEXT NOT NULL DEFAULT '',
                    thumbnail_url TEXT NOT NULL DEFAULT '',
                    language TEXT NOT NULL DEFAULT 'English',
                    view_count INTEGER,
                    like_count INTEGER,
                    comment_count INTEGER,
                    duration_iso TEXT NOT NULL DEFAULT '',
                    duration_seconds INTEGER NOT NULL DEFAULT 0,
                    duration_formatted TEXT NOT NULL DEFAULT 'Duration unavailable',
                    last_fetched TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )

            # 3. student_skills table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS student_skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    skill_name TEXT NOT NULL,
                    proficiency_score REAL NOT NULL DEFAULT 25.0,
                    category TEXT NOT NULL DEFAULT 'General',
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_id, skill_name),
                    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
                );
                """
            )

            # 4. completed_courses table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS completed_courses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    video_id TEXT NOT NULL,
                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_id, video_id),
                    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
                );
                """
            )

            # 5. bookmarked_courses table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS bookmarked_courses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    video_id TEXT NOT NULL,
                    bookmarked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_id, video_id),
                    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
                );
                """
            )

            # 6. learning_progress table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS learning_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    video_id TEXT NOT NULL,
                    progress_percent REAL NOT NULL DEFAULT 0.0,
                    notes TEXT NOT NULL DEFAULT '',
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_id, video_id),
                    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
                );
                """
            )

            # 7. recommendation_history table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS recommendation_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    video_id TEXT NOT NULL,
                    final_score REAL NOT NULL,
                    tfidf_score REAL NOT NULL DEFAULT 0.0,
                    skill_gap_score REAL NOT NULL DEFAULT 0.0,
                    prerequisite_score REAL NOT NULL DEFAULT 0.0,
                    fuzzy_score REAL NOT NULL DEFAULT 0.0,
                    bayesian_score REAL NOT NULL DEFAULT 0.0,
                    explanation TEXT NOT NULL DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
                );
                """
            )

            conn.commit()

    def list_tables(self) -> list[str]:
        """Returns the list of table names in the SQLite database."""
        with self.get_connection() as conn:
            rows = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
            ).fetchall()
            return [r["name"] for r in rows]

    def reset_all_data(self) -> None:
        """Clears all user records to restore a strictly empty state."""
        with self.get_connection() as conn:
            for table in [
                "recommendation_history",
                "learning_progress",
                "bookmarked_courses",
                "completed_courses",
                "student_skills",
                "students",
                "courses",
            ]:
                conn.execute(f"DELETE FROM {table};")
            conn.commit()
