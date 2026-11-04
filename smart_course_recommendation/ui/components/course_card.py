"""
Reusable CourseCardWidget for Tkinter/ttk displaying genuine YouTube course information,
expandable AI explanation, bookmark/completion actions, and direct YouTube video launch.
"""

import tkinter as tk
from tkinter import ttk
import webbrowser
from typing import Callable, Optional

from models.course import Course
from models.recommendation import RecommendationResult
from .score_badge import ScoreBreakdownPanel


class CourseCardWidget(ttk.Frame):
    """
    Clean, minimal Course Card following progressive disclosure principles:
    - Shows title, channel, key metadata (difficulty, duration, views, content type), and primary Watch button.
    - Expandable section reveals full description, prerequisites, AI score breakdown, and Gemini explanation.
    """

    def __init__(
        self,
        parent: tk.Widget,
        course: Course,
        theme: dict,
        recommendation: Optional[RecommendationResult] = None,
        is_bookmarked: bool = False,
        is_completed: bool = False,
        on_toggle_bookmark: Optional[Callable[[Course], None]] = None,
        on_toggle_complete: Optional[Callable[[Course], None]] = None,
        on_ask_gemini: Optional[Callable[[RecommendationResult], None]] = None,
    ) -> None:
        super().__init__(parent, style="Card.TFrame", padding=(14, 12))
        self.course = course
        self.theme = theme
        self.recommendation = recommendation
        self.is_bookmarked = is_bookmarked
        self.is_completed = is_completed
        self.on_toggle_bookmark = on_toggle_bookmark
        self.on_toggle_complete = on_toggle_complete
        self.on_ask_gemini = on_ask_gemini
        self.details_visible = False

        self._build_ui()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)

        # Header Row: Title + AI Score (if present)
        top_row = ttk.Frame(self, style="Surface.TFrame")
        top_row.grid(row=0, column=0, sticky="ew")
        top_row.columnconfigure(0, weight=1)

        title_lbl = ttk.Label(
            top_row,
            text=self.course.title,
            style="CardTitle.TLabel",
            wraplength=680,
        )
        title_lbl.grid(row=0, column=0, sticky="w")

        if self.recommendation is not None:
            score_val = self.recommendation.final_score
            score_lbl = ttk.Label(
                top_row,
                text=f"AI Score: {score_val:.2f}",
                style="AccentBadge.TLabel",
            )
            score_lbl.grid(row=0, column=1, sticky="e", padx=(10, 0))

        # Metadata line: Channel · Difficulty · Duration · Views · Type
        meta_parts = [
            self.course.channel_title,
            self.course.difficulty,
            self.course.duration_formatted,
            self.course.formatted_views,
            self.course.content_type,
        ]
        if self.course.published_at:
            meta_parts.append(self.course.published_at)

        meta_lbl = ttk.Label(
            self,
            text="  ·  ".join(meta_parts),
            style="Muted.TLabel",
        )
        meta_lbl.grid(row=1, column=0, sticky="w", pady=(4, 6))

        # Concise 1-line why recommended summary if available
        if self.recommendation and self.recommendation.explanation_summary:
            why_lbl = ttk.Label(
                self,
                text=f"Why recommended: {self.recommendation.explanation_summary}",
                style="Body.TLabel",
                wraplength=760,
            )
            why_lbl.grid(row=2, column=0, sticky="w", pady=(0, 8))

        # Action Row
        btn_row = ttk.Frame(self, style="Surface.TFrame")
        btn_row.grid(row=3, column=0, sticky="ew")

        watch_btn = ttk.Button(
            btn_row,
            text="Watch on YouTube",
            style="Primary.TButton",
            command=self._open_youtube,
        )
        watch_btn.pack(side="left", padx=(0, 8))

        self.toggle_details_btn = ttk.Button(
            btn_row,
            text="Details",
            style="Secondary.TButton",
            command=self._toggle_details,
        )
        self.toggle_details_btn.pack(side="left", padx=(0, 8))

        if self.on_toggle_bookmark:
            bm_text = "Bookmarked" if self.is_bookmarked else "Bookmark"
            bm_btn = ttk.Button(
                btn_row,
                text=bm_text,
                style="Secondary.TButton",
                command=lambda: self.on_toggle_bookmark(self.course),
            )
            bm_btn.pack(side="left", padx=(0, 8))

        if self.on_toggle_complete:
            comp_text = "Completed" if self.is_completed else "Mark Complete"
            comp_btn = ttk.Button(
                btn_row,
                text=comp_text,
                style="Secondary.TButton",
                command=lambda: self.on_toggle_complete(self.course),
            )
            comp_btn.pack(side="left", padx=(0, 8))

        if self.recommendation and self.on_ask_gemini:
            ai_btn = ttk.Button(
                btn_row,
                text="AI Advisor Insight",
                style="Secondary.TButton",
                command=lambda: self.on_ask_gemini(self.recommendation),
            )
            ai_btn.pack(side="right")

        # Progressive Disclosure Drawer (hidden by default)
        self.details_frame = ttk.Frame(self, style="Surface.TFrame", padding=(0, 10, 0, 0))

    def _toggle_details(self) -> None:
        if self.details_visible:
            self.details_frame.grid_forget()
            self.details_visible = False
            self.toggle_details_btn.configure(text="Details")
            return

        for child in self.details_frame.winfo_children():
            child.destroy()

        topics_str = ", ".join(self.course.topics) if self.course.topics else "General Computer Science"
        prereq_str = ", ".join(self.course.prerequisites) if self.course.prerequisites else "None required"
        desc_snippet = (
            self.course.description[:360] + "..."
            if len(self.course.description) > 360
            else (self.course.description or "No additional description provided.")
        )

        ttk.Label(
            self.details_frame,
            text=f"Topics: {topics_str}   |   Prerequisites: {prereq_str}",
            style="BodyBold.TLabel",
            wraplength=760,
        ).pack(anchor="w", pady=(0, 4))

        ttk.Label(
            self.details_frame,
            text=desc_snippet,
            style="Muted.TLabel",
            wraplength=760,
        ).pack(anchor="w", pady=(0, 8))

        if self.recommendation is not None:
            ScoreBreakdownPanel(
                self.details_frame, self.recommendation.breakdown, self.theme
            ).pack(fill="x", pady=(4, 0))

        self.details_frame.grid(row=4, column=0, sticky="ew")
        self.details_visible = True
        self.toggle_details_btn.configure(text="Hide Details")

    def _open_youtube(self) -> None:
        webbrowser.open(self.course.youtube_url)
