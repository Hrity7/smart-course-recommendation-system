"""
Views 7, 8, 9, and 10:
- MyLearningView (View 7): Bookmarked, in-progress, and completed courses with interactive progress sliders
- AnalyticsView (View 8): 3 headline numbers + visual progress charts and expandable recommendation audit log
- AIAssistantView (View 9): Interactive Gemini AI advisor for weekly study plans and career/course Q&A
- SettingsView (View 10): Light/Dark theme switch, API key status diagnostics, and database reset
"""

import os
import tkinter as tk
from tkinter import messagebox, ttk
import webbrowser
from typing import Callable

from utils.helpers import run_in_background


class MyLearningView(ttk.Frame):
    """View 7: Tracks bookmarked and completed courses with live progress bars."""

    def __init__(self, parent: tk.Widget, app_context) -> None:
        super().__init__(parent, style="Canvas.TFrame", padding=(24, 20))
        self.ctx = app_context
        self._build_ui()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)
        student = self.ctx.student

        ttk.Label(self, text="My Learning", style="PageTitle.TLabel").grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            self,
            text="Track your progress across bookmarked and completed YouTube courses.",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 16))

        tracked_ids = list(
            dict.fromkeys(
                student.bookmarked_course_ids
                + student.completed_course_ids
                + list(student.course_progress.keys())
            )
        )
        courses = self.ctx.course_repo.get_by_ids(tracked_ids)

        if not courses:
            empty_card = ttk.Frame(self, style="Card.TFrame", padding=(20, 18))
            empty_card.grid(row=2, column=0, sticky="ew")
            ttk.Label(
                empty_card,
                text="No courses tracked yet. Bookmark or mark courses complete in Explore or For You.",
                style="Muted.TLabel",
            ).pack(anchor="w")
            return

        for idx, course in enumerate(courses, start=2):
            card = ttk.Frame(self, style="Card.TFrame", padding=(16, 14))
            card.grid(row=idx, column=0, sticky="ew", pady=(0, 10))
            card.columnconfigure(0, weight=1)

            pct = student.course_progress.get(
                course.video_id,
                100.0
                if course.video_id in student.completed_course_ids
                else 25.0,
            )

            ttk.Label(card, text=course.title, style="CardTitle.TLabel").grid(
                row=0, column=0, sticky="w"
            )
            ttk.Label(
                card,
                text=f"{course.channel_title}  ·  {course.difficulty}  ·  {course.duration_formatted}  ·  Progress: {pct:.0f}%",
                style="Muted.TLabel",
            ).grid(row=1, column=0, sticky="w", pady=(2, 8))

            ctrl_row = ttk.Frame(card, style="Surface.TFrame")
            ctrl_row.grid(row=2, column=0, sticky="ew")

            bar = ttk.Progressbar(
                ctrl_row,
                orient="horizontal",
                length=220,
                mode="determinate",
                maximum=100,
                value=pct,
            )
            bar.pack(side="left", padx=(0, 12))

            for step_pct, lbl in [(25.0, "25%"), (50.0, "50%"), (75.0, "75%"), (100.0, "Complete")]:
                ttk.Button(
                    ctrl_row,
                    text=lbl,
                    style="Secondary.TButton",
                    command=lambda vid=course.video_id, p=step_pct: self._set_progress(
                        vid, p
                    ),
                ).pack(side="left", padx=3)

            ttk.Button(
                ctrl_row,
                text="Watch",
                style="Primary.TButton",
                command=lambda url=course.youtube_url: webbrowser.open(url),
            ).pack(side="right")

    def _set_progress(self, video_id: str, pct: float) -> None:
        self.ctx.progress_repo.update_progress(self.ctx.student, video_id, pct)
        for child in self.winfo_children():
            child.destroy()
        self._build_ui()


class AnalyticsView(ttk.Frame):
    """View 8: 3 Headline Analytics numbers with visual progress bars and expandable breakdown."""

    def __init__(self, parent: tk.Widget, app_context) -> None:
        super().__init__(parent, style="Canvas.TFrame", padding=(24, 20))
        self.ctx = app_context
        self.show_history = False
        self._build_ui()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)
        student = self.ctx.student
        report = self.ctx.skill_analyzer.analyze(student)
        history = (
            self.ctx.history_repo.get_recent_history(student.student_id, limit=10)
            if student.student_id is not None
            else []
        )

        ttk.Label(self, text="Analytics", style="PageTitle.TLabel").grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            self,
            text="Skill proficiency distribution and AI recommendation telemetry.",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 16))

        # 3 Headline Numbers
        stats_row = ttk.Frame(self, style="Canvas.TFrame")
        stats_row.grid(row=2, column=0, sticky="ew", pady=(0, 18))
        for i in range(3):
            stats_row.columnconfigure(i, weight=1)

        avg_skill = student.average_skill_score if student.skills else 0.0
        mean_rec_score = (
            sum(float(h["final_score"]) for h in history) / len(history)
            if history
            else 0.0
        )

        cards_data = [
            ("Mean Skill Proficiency", f"{avg_skill:.1f}%", f"Dominant Fuzzy Level: {student.overall_level}"),
            ("Career Target Readiness", f"{report.overall_readiness_percent:.1f}%", f"Goal: {report.career_goal}"),
            ("Mean AI Match Score", f"{mean_rec_score:.2f}", f"{len(history)} logged recommendations"),
        ]

        for idx, (title, big_num, sub) in enumerate(cards_data):
            c = ttk.Frame(stats_row, style="Card.TFrame", padding=(16, 14))
            c.grid(
                row=0,
                column=idx,
                sticky="nsew",
                padx=(0 if idx == 0 else 8, 0 if idx == 2 else 8),
            )
            ttk.Label(c, text=title, style="Muted.TLabel").pack(anchor="w")
            ttk.Label(c, text=big_num, style="StatHero.TLabel").pack(anchor="w", pady=(6, 4))
            ttk.Label(c, text=sub, style="Body.TLabel").pack(anchor="w")

        # Skill Proficiency Visual Chart Card
        chart_card = ttk.Frame(self, style="Card.TFrame", padding=(18, 16))
        chart_card.grid(row=3, column=0, sticky="ew", pady=(0, 14))
        chart_card.columnconfigure(1, weight=1)

        ttk.Label(
            chart_card, text="Skill Proficiency Breakdown", style="SectionTitle.TLabel"
        ).grid(row=0, column=0, columnspan=3, sticky="w", pady=(0, 10))

        if not student.skills:
            ttk.Label(
                chart_card,
                text="Add skills in your Student Profile to visualize proficiency bars.",
                style="Muted.TLabel",
            ).grid(row=1, column=0, sticky="w")
        else:
            for r_idx, (sk_name, prof) in enumerate(sorted(student.skills.items()), start=1):
                ttk.Label(chart_card, text=sk_name, style="Body.TLabel").grid(
                    row=r_idx, column=0, sticky="w", padx=(0, 12), pady=3
                )
                bar = ttk.Progressbar(
                    chart_card,
                    orient="horizontal",
                    length=280,
                    mode="determinate",
                    maximum=100,
                    value=prof.score,
                )
                bar.grid(row=r_idx, column=1, sticky="ew", padx=(0, 12), pady=3)
                ttk.Label(
                    chart_card,
                    text=f"{prof.score:.0f}% ({prof.linguistic_level})",
                    style="BodyBold.TLabel",
                ).grid(row=r_idx, column=2, sticky="e", pady=3)

        # Expandable Detailed Recommendation Audit Log
        if history:
            ttk.Button(
                self,
                text="Hide Detailed History" if self.show_history else "Show Detailed Recommendation History",
                style="Secondary.TButton",
                command=self._toggle_history,
            ).grid(row=4, column=0, sticky="w", pady=(0, 10))

            if self.show_history:
                hist_card = ttk.Frame(self, style="Card.TFrame", padding=(16, 14))
                hist_card.grid(row=5, column=0, sticky="ew")
                for h_idx, h in enumerate(history[:6]):
                    title_str = h.get("title") or h.get("video_id")
                    line = (
                        f"• {title_str} — Final: {float(h['final_score']):.2f} "
                        f"(TF-IDF: {float(h['tfidf_score']):.2f}, Gap: {float(h['skill_gap_score']):.2f}, "
                        f"Fuzzy: {float(h['fuzzy_score']):.2f}, Bayes: {float(h['bayesian_score']):.2f})"
                    )
                    ttk.Label(hist_card, text=line, style="Muted.TLabel", wraplength=820).pack(
                        anchor="w", pady=2
                    )

    def _toggle_history(self) -> None:
        self.show_history = not self.show_history
        for child in self.winfo_children():
            child.destroy()
        self._build_ui()


class AIAssistantView(ttk.Frame):
    """View 9: Gemini AI Career Advisor & Study Plan Generator."""

    def __init__(self, parent: tk.Widget, app_context) -> None:
        super().__init__(parent, style="Canvas.TFrame", padding=(24, 20))
        self.ctx = app_context
        self._build_ui()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)

        ttk.Label(self, text="AI Assistant", style="PageTitle.TLabel").grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            self,
            text="Generate personalized weekly study schedules or ask course & career questions.",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 14))

        prompt_card = ttk.Frame(self, style="Card.TFrame", padding=(16, 14))
        prompt_card.grid(row=2, column=0, sticky="ew", pady=(0, 14))
        prompt_card.columnconfigure(0, weight=1)

        self.question_var = tk.StringVar(value="")
        q_entry = ttk.Entry(prompt_card, textvariable=self.question_var, width=56)
        q_entry.grid(row=0, column=0, sticky="ew", padx=(0, 10))
        q_entry.bind("<Return>", lambda _e: self._ask_advisor())

        ttk.Button(
            prompt_card,
            text="Ask AI Advisor",
            style="Primary.TButton",
            command=self._ask_advisor,
        ).grid(row=0, column=1, padx=(0, 8))

        ttk.Button(
            prompt_card,
            text="Generate Weekly Study Plan",
            style="Secondary.TButton",
            command=self._generate_study_plan,
        ).grid(row=0, column=2)

        resp_card = ttk.Frame(self, style="Card.TFrame", padding=(18, 16))
        resp_card.grid(row=3, column=0, sticky="nsew")
        resp_card.columnconfigure(0, weight=1)

        ttk.Label(resp_card, text="Advisor Response", style="SectionTitle.TLabel").grid(
            row=0, column=0, sticky="w", pady=(0, 8)
        )

        self.output_lbl = ttk.Label(
            resp_card,
            text="Select 'Generate Weekly Study Plan' or ask a question above.",
            style="Body.TLabel",
            wraplength=820,
            justify="left",
        )
        self.output_lbl.grid(row=1, column=0, sticky="w")

    def _ask_advisor(self) -> None:
        q = self.question_var.get().strip()
        if not q:
            return
        self.output_lbl.configure(text="Consulting Gemini AI Advisor...")
        courses = self.ctx.course_repo.get_all_cached_courses(limit=6)

        def _task():
            return self.ctx.gemini_service.answer_career_or_course_question(
                self.ctx.student, q, courses
            )

        def _on_ok(ans: str):
            self.output_lbl.configure(text=ans)

        run_in_background(_task, _on_ok, tk_root=self.winfo_toplevel())

    def _generate_study_plan(self) -> None:
        self.output_lbl.configure(text="Generating personalized weekly study schedule...")
        courses = self.ctx.course_repo.get_all_cached_courses(limit=4)

        def _task():
            return self.ctx.gemini_service.generate_weekly_study_plan(
                self.ctx.student, courses
            )

        def _on_ok(plan: str):
            self.output_lbl.configure(text=plan)

        run_in_background(_task, _on_ok, tk_root=self.winfo_toplevel())


class SettingsView(ttk.Frame):
    """View 10: Theme switcher (Light/Dark), API status, and condensed disclaimer."""

    def __init__(
        self,
        parent: tk.Widget,
        app_context,
        on_toggle_theme: Callable[[], None],
        on_reset_db: Callable[[], None],
    ) -> None:
        super().__init__(parent, style="Canvas.TFrame", padding=(24, 20))
        self.ctx = app_context
        self.on_toggle_theme = on_toggle_theme
        self.on_reset_db = on_reset_db
        self._build_ui()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)

        ttk.Label(self, text="Settings", style="PageTitle.TLabel").grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            self,
            text="Appearance, API diagnostics, database reset, and academic notice.",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 16))

        # Appearance & Theme Card
        theme_card = ttk.Frame(self, style="Card.TFrame", padding=(18, 14))
        theme_card.grid(row=2, column=0, sticky="ew", pady=(0, 12))
        theme_card.columnconfigure(0, weight=1)

        ttk.Label(theme_card, text="Appearance", style="SectionTitle.TLabel").grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            theme_card,
            text=f"Active Theme: {self.ctx.theme_mode.capitalize()} Mode",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 0))

        ttk.Button(
            theme_card,
            text="Switch Light / Dark Mode",
            style="Primary.TButton",
            command=self.on_toggle_theme,
        ).grid(row=0, column=1, rowspan=2, sticky="e")

        # API Key Configuration Card
        api_card = ttk.Frame(self, style="Card.TFrame", padding=(18, 14))
        api_card.grid(row=3, column=0, sticky="ew", pady=(0, 12))
        api_card.columnconfigure(1, weight=1)

        ttk.Label(api_card, text="API Configuration", style="SectionTitle.TLabel").grid(
            row=0, column=0, columnspan=3, sticky="w", pady=(0, 8)
        )

        yt_status = (
            "Configured" if self.ctx.youtube_service.is_configured() else "Not Set (Required for live YouTube search)"
        )
        gem_status = (
            "Configured" if self.ctx.gemini_service.is_configured() else "Not Set (Using analytical fallback)"
        )

        ttk.Label(
            api_card,
            text=f"YouTube Data API v3: {yt_status}   |   Gemini API: {gem_status}",
            style="Body.TLabel",
        ).grid(row=1, column=0, columnspan=3, sticky="w", pady=(0, 8))

        ttk.Label(api_card, text="Session YouTube API Key:", style="Muted.TLabel").grid(
            row=2, column=0, sticky="w", padx=(0, 8)
        )
        self.yt_key_var = tk.StringVar(value=os.getenv("YOUTUBE_API_KEY", ""))
        ttk.Entry(api_card, textvariable=self.yt_key_var, show="*", width=36).grid(
            row=2, column=1, sticky="ew", padx=(0, 8)
        )
        ttk.Button(
            api_card,
            text="Apply Key",
            style="Secondary.TButton",
            command=self._apply_yt_key,
        ).grid(row=2, column=2)

        # Database Reset Card
        db_card = ttk.Frame(self, style="Card.TFrame", padding=(18, 14))
        db_card.grid(row=4, column=0, sticky="ew", pady=(0, 12))
        db_card.columnconfigure(0, weight=1)

        ttk.Label(db_card, text="Local SQLite Storage", style="SectionTitle.TLabel").grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            db_card,
            text="Clear all stored student profiles, skills, and cached courses to start fresh.",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 0))

        ttk.Button(
            db_card,
            text="Reset Database",
            style="Secondary.TButton",
            command=self._confirm_reset,
        ).grid(row=0, column=1, rowspan=2, sticky="e")

        # Condensed Academic Disclaimer Card (3 short bullet lines + 1 closing line)
        disc_card = ttk.Frame(self, style="Card.TFrame", padding=(18, 14))
        disc_card.grid(row=5, column=0, sticky="ew")
        ttk.Label(disc_card, text="Disclaimer", style="SectionTitle.TLabel").pack(
            anchor="w", pady=(0, 6)
        )
        bullets = [
            "• Recommendations are generated algorithmically from public YouTube metadata.",
            "• Course links open directly on YouTube; creators retain all content ownership.",
            "• AI career roadmaps provide academic guidance, not formal accreditation.",
        ]
        for b in bullets:
            ttk.Label(disc_card, text=b, style="Body.TLabel").pack(anchor="w", pady=1)
        ttk.Label(
            disc_card,
            text="Always verify course prerequisites against your syllabus.",
            style="Muted.TLabel",
        ).pack(anchor="w", pady=(6, 0))

    def _apply_yt_key(self) -> None:
        key = self.yt_key_var.get().strip()
        os.environ["YOUTUBE_API_KEY"] = key
        self.ctx.youtube_service._explicit_key = key
        messagebox.showinfo("API Key Updated", "YouTube Data API v3 key updated for this session.")
        for child in self.winfo_children():
            child.destroy()
        self._build_ui()

    def _confirm_reset(self) -> None:
        if messagebox.askyesno(
            "Reset Database",
            "Reset all student profile data, skills, and history to an empty state?",
        ):
            self.on_reset_db()
