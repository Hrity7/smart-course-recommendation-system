"""
View 4: AI Recommendations View for Tkinter/ttk.
Ranks live YouTube courses using TF-IDF, Skill-Gap Analysis, Prerequisite Graph,
Fuzzy Logic, Bayesian Suitability, and Forward-Chaining Rules.
"""

import tkinter as tk
from tkinter import messagebox, ttk
from typing import List

from models.course import Course
from models.recommendation import RecommendationResult
from utils.helpers import run_in_background
from .components.course_card import CourseCardWidget


class RecommendationsView(ttk.Frame):
    """Displays AI-ranked YouTube recommendations with transparent mathematical breakdowns."""

    def __init__(self, parent: tk.Widget, app_context) -> None:
        super().__init__(parent, style="Canvas.TFrame", padding=(24, 20))
        self.ctx = app_context
        self.recommendations: List[RecommendationResult] = []
        self.show_all = False
        self.status_var = tk.StringVar(
            value="Click 'Refresh Recommendations' to run the hybrid AI scoring engine on live YouTube courses."
        )
        self._build_ui()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)

        hdr = ttk.Frame(self, style="Canvas.TFrame")
        hdr.grid(row=0, column=0, sticky="ew", pady=(0, 14))
        hdr.columnconfigure(0, weight=1)

        ttk.Label(hdr, text="For You", style="PageTitle.TLabel").grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            hdr,
            text="Ranked by TF-IDF Cosine Similarity, Skill-Gap, Prerequisites, Fuzzy Logic, and Bayesian Reasoning.",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 0))

        self.refresh_btn = ttk.Button(
            hdr,
            text="Refresh Recommendations",
            style="Primary.TButton",
            command=self._load_recommendations,
        )
        self.refresh_btn.grid(row=0, column=1, rowspan=2, sticky="e")

        ttk.Label(self, textvariable=self.status_var, style="Muted.TLabel").grid(
            row=1, column=0, sticky="w", pady=(0, 12)
        )

        self.cards_frame = ttk.Frame(self, style="Canvas.TFrame")
        self.cards_frame.grid(row=2, column=0, sticky="nsew")
        self.cards_frame.columnconfigure(0, weight=1)

    def _load_recommendations(self) -> None:
        self.status_var.set("Running AI Recommendation Engine and querying YouTube Data API v3...")
        self.refresh_btn.configure(state="disabled")

        def _task():
            return self.ctx.course_service.generate_personalized_recommendations(
                self.ctx.student, max_results=10
            )

        def _on_ok(results: List[RecommendationResult]):
            self.refresh_btn.configure(state="normal")
            self.recommendations = results
            self.show_all = False
            if not results:
                self.status_var.set("No relevant courses found. Try updating your profile or search criteria.")
            else:
                self.status_var.set(
                    f"Ranked {len(results)} YouTube courses using genuine multi-factor AI calculations."
                )
            self._render_cards()

        def _on_err(exc: Exception):
            self.refresh_btn.configure(state="normal")
            self.recommendations = []
            self.status_var.set(str(exc))
            self._render_cards()

        run_in_background(_task, _on_ok, _on_err, tk_root=self.winfo_toplevel())

    def _render_cards(self) -> None:
        for child in self.cards_frame.winfo_children():
            child.destroy()

        if not self.recommendations:
            return

        limit = (
            len(self.recommendations)
            if self.show_all
            else min(5, len(self.recommendations))
        )
        for idx, rec in enumerate(self.recommendations[:limit]):
            card = CourseCardWidget(
                self.cards_frame,
                course=rec.course,
                theme=self.ctx.current_theme,
                recommendation=rec,
                is_bookmarked=rec.course.video_id in self.ctx.student.bookmarked_course_ids,
                is_completed=rec.course.video_id in self.ctx.student.completed_course_ids,
                on_toggle_bookmark=self._handle_bookmark,
                on_toggle_complete=self._handle_complete,
                on_ask_gemini=self._handle_gemini_explain,
            )
            card.grid(row=idx, column=0, sticky="ew", pady=(0, 10))

        if len(self.recommendations) > 5:
            btn_lbl = (
                "Show Less"
                if self.show_all
                else f"Show More ({len(self.recommendations) - 5} more)"
            )
            ttk.Button(
                self.cards_frame,
                text=btn_lbl,
                style="Secondary.TButton",
                command=self._toggle_show_all,
            ).grid(row=limit + 1, column=0, sticky="w", pady=(4, 12))

    def _toggle_show_all(self) -> None:
        self.show_all = not self.show_all
        self._render_cards()

    def _handle_bookmark(self, course: Course) -> None:
        self.ctx.progress_repo.toggle_bookmark(self.ctx.student, course.video_id)
        self._render_cards()

    def _handle_complete(self, course: Course) -> None:
        is_comp = course.video_id in self.ctx.student.completed_course_ids
        self.ctx.progress_repo.set_course_completed(
            self.ctx.student, course.video_id, not is_comp
        )
        self._render_cards()

    def _handle_gemini_explain(self, rec: RecommendationResult) -> None:
        def _task():
            return self.ctx.gemini_service.explain_recommendation(self.ctx.student, rec)

        def _on_ok(text: str):
            messagebox.showinfo(
                title=f"AI Advisor — {rec.course.title[:48]}",
                message=text,
            )

        run_in_background(_task, _on_ok, tk_root=self.winfo_toplevel())
