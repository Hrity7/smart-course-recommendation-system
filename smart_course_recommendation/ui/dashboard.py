"""
View 1: Dashboard View for Tkinter/ttk.
Displays 3 headline metrics, profile setup prompt if empty, next roadmap step, and quick actions.
"""

import tkinter as tk
from tkinter import ttk
from typing import Callable


class DashboardView(ttk.Frame):
    """Minimal, scannable Dashboard communicating system status and next step in seconds."""

    def __init__(
        self,
        parent: tk.Widget,
        app_context,
        on_navigate: Callable[[str], None],
    ) -> None:
        super().__init__(parent, style="Canvas.TFrame", padding=(24, 20))
        self.ctx = app_context
        self.on_navigate = on_navigate
        self._build_ui()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)
        student = self.ctx.student
        gap_report = self.ctx.skill_analyzer.analyze(student)
        roadmap = self.ctx.roadmap_generator.generate_roadmap(student, algorithm="A*")

        # Header
        header_frame = ttk.Frame(self, style="Canvas.TFrame")
        header_frame.grid(row=0, column=0, sticky="ew", pady=(0, 18))
        header_frame.columnconfigure(0, weight=1)

        greeting = f"Welcome, {student.name}" if student.name else "Dashboard"
        ttk.Label(
            header_frame, text=greeting, style="PageTitle.TLabel"
        ).grid(row=0, column=0, sticky="w")

        sub_line = (
            f"Target Career: {student.career_goal}  ·  Level: {student.overall_level}"
            if student.is_configured
            else "Complete your Student Profile to unlock personalized AI course recommendations."
        )
        ttk.Label(
            header_frame, text=sub_line, style="Muted.TLabel"
        ).grid(row=1, column=0, sticky="w", pady=(4, 0))

        primary_btn_text = "Get AI Recommendations" if student.is_configured else "Set Up Profile"
        primary_target = "recommendations" if student.is_configured else "profile"
        ttk.Button(
            header_frame,
            text=primary_btn_text,
            style="Primary.TButton",
            command=lambda: self.on_navigate(primary_target),
        ).grid(row=0, column=1, rowspan=2, sticky="e")

        # 3 Headline Stat Cards
        stats_frame = ttk.Frame(self, style="Canvas.TFrame")
        stats_frame.grid(row=1, column=0, sticky="ew", pady=(0, 20))
        for i in range(3):
            stats_frame.columnconfigure(i, weight=1)

        headlines = [
            (
                "Career Readiness",
                f"{gap_report.overall_readiness_percent:.0f}%" if student.is_configured else "0%",
                f"{len(gap_report.acquired_skills)} core skills acquired",
            ),
            (
                "Registered Skills",
                str(len(student.skills)),
                f"Fuzzy Level: {student.overall_level}",
            ),
            (
                "Completed Courses",
                str(len(student.completed_course_ids)),
                f"{len(student.bookmarked_course_ids)} bookmarked",
            ),
        ]

        for idx, (label, big_val, sub_val) in enumerate(headlines):
            card = ttk.Frame(stats_frame, style="Card.TFrame", padding=(18, 16))
            card.grid(
                row=0,
                column=idx,
                sticky="nsew",
                padx=(0 if idx == 0 else 8, 0 if idx == 2 else 8),
            )
            ttk.Label(card, text=label, style="Muted.TLabel").pack(anchor="w")
            ttk.Label(card, text=big_val, style="StatHero.TLabel").pack(anchor="w", pady=(6, 4))
            ttk.Label(card, text=sub_val, style="Body.TLabel").pack(anchor="w")

        # Next Recommended Milestone Card (from A* Roadmap)
        next_card = ttk.Frame(self, style="Card.TFrame", padding=(20, 18))
        next_card.grid(row=2, column=0, sticky="ew", pady=(0, 18))
        next_card.columnconfigure(0, weight=1)

        ttk.Label(
            next_card,
            text="Next A* Roadmap Milestone",
            style="SectionTitle.TLabel",
        ).grid(row=0, column=0, sticky="w")

        next_skill = roadmap.next_recommended_skill or "Configure your profile to compute your A* path"
        ttk.Label(
            next_card,
            text=next_skill,
            style="CardTitle.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(6, 4))

        ttk.Label(
            next_card,
            text=roadmap.explanation,
            style="Muted.TLabel",
            wraplength=760,
        ).grid(row=2, column=0, sticky="w")

        ttk.Button(
            next_card,
            text="View Full Roadmap",
            style="Secondary.TButton",
            command=lambda: self.on_navigate("roadmap"),
        ).grid(row=0, column=1, rowspan=3, sticky="e")

        # Forward-Chaining Rule Engine Preview (Top 3 Rules)
        rules_card = ttk.Frame(self, style="Card.TFrame", padding=(20, 18))
        rules_card.grid(row=3, column=0, sticky="ew")
        rules_card.columnconfigure(0, weight=1)

        ttk.Label(
            rules_card,
            text="Rule Engine Inference Trace",
            style="SectionTitle.TLabel",
        ).grid(row=0, column=0, sticky="w", pady=(0, 8))

        inferred = self.ctx.recommendation_engine.rule_engine.infer_recommended_skill_targets(
            student
        )[:3]
        if not student.is_configured:
            ttk.Label(
                rules_card,
                text="No student profile facts loaded yet. Add your career goal and skills in Profile.",
                style="Muted.TLabel",
            ).grid(row=1, column=0, sticky="w")
        else:
            for r_idx, item in enumerate(inferred, start=1):
                ttk.Label(
                    rules_card,
                    text=f"• {item['target_skill']} ({item['status']})",
                    style="BodyBold.TLabel",
                ).grid(row=r_idx * 2 - 1, column=0, sticky="w", pady=(4, 0))
                ttk.Label(
                    rules_card,
                    text=f"  {item['rule']}",
                    style="Muted.TLabel",
                    wraplength=820,
                ).grid(row=r_idx * 2, column=0, sticky="w", pady=(0, 4))
