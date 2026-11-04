"""
View 3: Explore Courses View for Tkinter/ttk.
Allows dynamic search and filtering of live YouTube educational courses by topic,
category, and difficulty level.
"""

import tkinter as tk
from tkinter import ttk
from typing import List

from config import DIFFICULTY_LEVELS, EDUCATIONAL_CATEGORIES
from models.course import Course
from utils.helpers import run_in_background
from .components.course_card import CourseCardWidget


class ExploreView(ttk.Frame):
    """Interactive YouTube Course Explorer with category, difficulty, and keyword search."""

    def __init__(self, parent: tk.Widget, app_context) -> None:
        super().__init__(parent, style="Canvas.TFrame", padding=(24, 20))
        self.ctx = app_context
        self.courses: List[Course] = []
        self.show_all = False
        self.status_var = tk.StringVar(
            value="Enter a topic or select a category to search live YouTube courses."
        )
        self._build_ui()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)

        # Header
        ttk.Label(self, text="Explore Courses", style="PageTitle.TLabel").grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            self,
            text="Retrieve genuine educational courses directly from YouTube Data API v3.",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 14))

        # Search & Filter Toolbar
        bar = ttk.Frame(self, style="Card.TFrame", padding=(14, 12))
        bar.grid(row=2, column=0, sticky="ew", pady=(0, 14))
        bar.columnconfigure(0, weight=1)

        self.query_var = tk.StringVar(value="")
        search_entry = ttk.Entry(bar, textvariable=self.query_var, width=36)
        search_entry.grid(row=0, column=0, sticky="ew", padx=(0, 10))
        search_entry.bind("<Return>", lambda _e: self._trigger_search())

        self.cat_var = tk.StringVar(value="All")
        ttk.Combobox(
            bar,
            textvariable=self.cat_var,
            values=EDUCATIONAL_CATEGORIES,
            state="readonly",
            width=20,
        ).grid(row=0, column=1, padx=(0, 10))

        self.diff_var = tk.StringVar(value="All")
        ttk.Combobox(
            bar,
            textvariable=self.diff_var,
            values=["All"] + DIFFICULTY_LEVELS,
            state="readonly",
            width=14,
        ).grid(row=0, column=2, padx=(0, 10))

        self.search_btn = ttk.Button(
            bar,
            text="Search YouTube",
            style="Primary.TButton",
            command=self._trigger_search,
        )
        self.search_btn.grid(row=0, column=3)

        ttk.Label(self, textvariable=self.status_var, style="Muted.TLabel").grid(
            row=3, column=0, sticky="w", pady=(0, 10)
        )

        self.results_container = ttk.Frame(self, style="Canvas.TFrame")
        self.results_container.grid(row=4, column=0, sticky="nsew")
        self.results_container.columnconfigure(0, weight=1)

    def _trigger_search(self) -> None:
        q = self.query_var.get().strip()
        cat = self.cat_var.get()
        diff = self.diff_var.get()

        self.status_var.set("Searching YouTube Data API v3 for educational courses...")
        self.search_btn.configure(state="disabled")

        def _task():
            return self.ctx.course_service.search_and_persist_youtube_courses(
                query=q,
                category=cat,
                difficulty=diff,
                prefer_full_courses=self.ctx.student.preferences.prefer_full_courses,
                max_results=10,
            )

        def _on_ok(results: List[Course]):
            self.search_btn.configure(state="normal")
            self.courses = results
            self.show_all = False
            if not results:
                self.status_var.set("No relevant courses found. Try a different search.")
            else:
                self.status_var.set(f"Found {len(results)} YouTube courses.")
            self._render_results()

        def _on_err(exc: Exception):
            self.search_btn.configure(state="normal")
            self.courses = []
            self.status_var.set(str(exc))
            self._render_results()

        run_in_background(_task, _on_ok, _on_err, tk_root=self.winfo_toplevel())

    def _render_results(self) -> None:
        for child in self.results_container.winfo_children():
            child.destroy()

        if not self.courses:
            return

        limit = len(self.courses) if self.show_all else min(5, len(self.courses))
        for idx, course in enumerate(self.courses[:limit]):
            card = CourseCardWidget(
                self.results_container,
                course=course,
                theme=self.ctx.current_theme,
                is_bookmarked=course.video_id in self.ctx.student.bookmarked_course_ids,
                is_completed=course.video_id in self.ctx.student.completed_course_ids,
                on_toggle_bookmark=self._handle_bookmark,
                on_toggle_complete=self._handle_complete,
            )
            card.grid(row=idx, column=0, sticky="ew", pady=(0, 10))

        if len(self.courses) > 5:
            toggle_text = "Show Less" if self.show_all else f"Show More ({len(self.courses) - 5} more)"
            ttk.Button(
                self.results_container,
                text=toggle_text,
                style="Secondary.TButton",
                command=self._toggle_show_all,
            ).grid(row=limit + 1, column=0, sticky="w", pady=(4, 12))

    def _toggle_show_all(self) -> None:
        self.show_all = not self.show_all
        self._render_results()

    def _handle_bookmark(self, course: Course) -> None:
        self.ctx.progress_repo.toggle_bookmark(self.ctx.student, course.video_id)
        self._render_results()

    def _handle_complete(self, course: Course) -> None:
        is_comp = course.video_id in self.ctx.student.completed_course_ids
        self.ctx.progress_repo.set_course_completed(
            self.ctx.student, course.video_id, not is_comp
        )
        self._render_results()
