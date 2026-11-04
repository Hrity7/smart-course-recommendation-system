"""
View 2: Student Profile View for Tkinter/ttk.
Starts strictly empty on first launch. Allows editing student name, career goal,
interests, learning preferences, and technical skills with Fuzzy linguistic feedback.
"""

import tkinter as tk
from tkinter import ttk
from typing import Callable

from config import CAREER_GOALS, DIFFICULTY_LEVELS, LEARNING_PREFERENCES


class ProfileView(ttk.Frame):
    """Student Profile & Skill Proficiency Editor with real-time Fuzzy Logic linguistic labels."""

    def __init__(
        self,
        parent: tk.Widget,
        app_context,
        on_profile_saved: Callable[[], None],
    ) -> None:
        super().__init__(parent, style="Canvas.TFrame", padding=(24, 20))
        self.ctx = app_context
        self.on_profile_saved = on_profile_saved
        self.status_var = tk.StringVar(value="")
        self._build_ui()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)
        self.columnconfigure(1, weight=1)
        student = self.ctx.student

        # Header
        hdr = ttk.Frame(self, style="Canvas.TFrame")
        hdr.grid(row=0, column=0, columnspan=2, sticky="ew", pady=(0, 16))
        hdr.columnconfigure(0, weight=1)

        ttk.Label(hdr, text="Student Profile", style="PageTitle.TLabel").grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            hdr,
            text="Configure your career goal, interests, and skill proficiencies for AI reasoning.",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 0))

        ttk.Button(
            hdr,
            text="Save Profile",
            style="Primary.TButton",
            command=self._save_profile,
        ).grid(row=0, column=1, rowspan=2, sticky="e")

        # Left Column: Personal & Career Preferences
        left_card = ttk.Frame(self, style="Card.TFrame", padding=(18, 16))
        left_card.grid(row=1, column=0, sticky="nsew", padx=(0, 10))
        left_card.columnconfigure(1, weight=1)

        ttk.Label(left_card, text="Learner Details", style="SectionTitle.TLabel").grid(
            row=0, column=0, columnspan=2, sticky="w", pady=(0, 12)
        )

        ttk.Label(left_card, text="Full Name:", style="Body.TLabel").grid(
            row=1, column=0, sticky="w", pady=6, padx=(0, 10)
        )
        self.name_var = tk.StringVar(value=student.name)
        ttk.Entry(left_card, textvariable=self.name_var, width=32).grid(
            row=1, column=1, sticky="ew", pady=6
        )

        ttk.Label(left_card, text="Career Goal:", style="Body.TLabel").grid(
            row=2, column=0, sticky="w", pady=6, padx=(0, 10)
        )
        self.career_var = tk.StringVar(value=student.career_goal)
        career_cb = ttk.Combobox(
            left_card,
            textvariable=self.career_var,
            values=CAREER_GOALS,
            width=30,
        )
        career_cb.grid(row=2, column=1, sticky="ew", pady=6)

        ttk.Label(left_card, text="Interests (comma-separated):", style="Body.TLabel").grid(
            row=3, column=0, sticky="w", pady=6, padx=(0, 10)
        )
        self.interests_var = tk.StringVar(value=", ".join(student.interests))
        ttk.Entry(left_card, textvariable=self.interests_var, width=32).grid(
            row=3, column=1, sticky="ew", pady=6
        )

        ttk.Label(left_card, text="Learning Objectives:", style="Body.TLabel").grid(
            row=4, column=0, sticky="w", pady=6, padx=(0, 10)
        )
        self.objectives_var = tk.StringVar(value=student.learning_objectives)
        ttk.Entry(left_card, textvariable=self.objectives_var, width=32).grid(
            row=4, column=1, sticky="ew", pady=6
        )

        ttk.Label(left_card, text="Preferred Difficulty:", style="Body.TLabel").grid(
            row=5, column=0, sticky="w", pady=6, padx=(0, 10)
        )
        self.diff_var = tk.StringVar(value=student.preferences.preferred_difficulty)
        ttk.Combobox(
            left_card,
            textvariable=self.diff_var,
            values=DIFFICULTY_LEVELS,
            state="readonly",
            width=28,
        ).grid(row=5, column=1, sticky="ew", pady=6)

        ttk.Label(left_card, text="Preferred Course Length (hrs):", style="Body.TLabel").grid(
            row=6, column=0, sticky="w", pady=6, padx=(0, 10)
        )
        self.duration_var = tk.DoubleVar(value=student.preferences.preferred_duration_hours)
        ttk.Spinbox(
            left_card,
            from_=0.5,
            to=24.0,
            increment=0.5,
            textvariable=self.duration_var,
            width=10,
        ).grid(row=6, column=1, sticky="w", pady=6)

        ttk.Label(left_card, text="Weekly Study Hours:", style="Body.TLabel").grid(
            row=7, column=0, sticky="w", pady=6, padx=(0, 10)
        )
        self.weekly_var = tk.IntVar(value=student.preferences.weekly_study_hours)
        ttk.Spinbox(
            left_card,
            from_=1,
            to=60,
            increment=1,
            textvariable=self.weekly_var,
            width=10,
        ).grid(row=7, column=1, sticky="w", pady=6)

        ttk.Label(left_card, text="Learning Style:", style="Body.TLabel").grid(
            row=8, column=0, sticky="w", pady=6, padx=(0, 10)
        )
        self.style_var = tk.StringVar(value=student.preferences.learning_style)
        ttk.Combobox(
            left_card,
            textvariable=self.style_var,
            values=LEARNING_PREFERENCES,
            state="readonly",
            width=28,
        ).grid(row=8, column=1, sticky="ew", pady=6)

        self.full_course_var = tk.BooleanVar(value=student.preferences.prefer_full_courses)
        ttk.Checkbutton(
            left_card,
            text="Prefer comprehensive full-length YouTube courses",
            variable=self.full_course_var,
        ).grid(row=9, column=0, columnspan=2, sticky="w", pady=(8, 4))

        # Right Column: Technical Skills & Fuzzy Proficiency Manager
        right_card = ttk.Frame(self, style="Card.TFrame", padding=(18, 16))
        right_card.grid(row=1, column=1, sticky="nsew", padx=(10, 0))
        right_card.columnconfigure(0, weight=1)

        ttk.Label(
            right_card,
            text="Technical Skills & Fuzzy Proficiency",
            style="SectionTitle.TLabel",
        ).grid(row=0, column=0, sticky="w", pady=(0, 10))

        add_row = ttk.Frame(right_card, style="Surface.TFrame")
        add_row.grid(row=1, column=0, sticky="ew", pady=(0, 10))
        add_row.columnconfigure(0, weight=1)

        all_kb_skills = self.ctx.kb.get_all_skill_names()
        self.new_skill_var = tk.StringVar(value=all_kb_skills[0] if all_kb_skills else "")
        skill_cb = ttk.Combobox(
            add_row,
            textvariable=self.new_skill_var,
            values=all_kb_skills,
            width=26,
        )
        skill_cb.grid(row=0, column=0, sticky="ew", padx=(0, 8))

        self.new_score_var = tk.DoubleVar(value=50.0)
        score_spin = ttk.Spinbox(
            add_row,
            from_=5.0,
            to=100.0,
            increment=5.0,
            textvariable=self.new_score_var,
            width=6,
        )
        score_spin.grid(row=0, column=1, padx=(0, 8))

        ttk.Button(
            add_row,
            text="Add / Update Skill",
            style="Secondary.TButton",
            command=self._add_or_update_skill,
        ).grid(row=0, column=2)

        self.skills_list_frame = ttk.Frame(right_card, style="Surface.TFrame")
        self.skills_list_frame.grid(row=2, column=0, sticky="nsew")
        self._refresh_skills_list()

        # Status message
        ttk.Label(
            self, textvariable=self.status_var, style="Success.TLabel"
        ).grid(row=2, column=0, columnspan=2, sticky="w", pady=(12, 0))

    def _refresh_skills_list(self) -> None:
        for child in self.skills_list_frame.winfo_children():
            child.destroy()

        student = self.ctx.student
        if not student.skills:
            ttk.Label(
                self.skills_list_frame,
                text="No skills added yet. Select a skill above to register your proficiency.",
                style="Muted.TLabel",
            ).pack(anchor="w", pady=8)
            return

        for s_name, prof in sorted(student.skills.items()):
            fuzzy_deg = self.ctx.recommendation_engine.fuzzy.fuzzify_skill(prof.score)
            dom_label = self.ctx.recommendation_engine.fuzzy.dominant_linguistic_label(prof.score)
            row = ttk.Frame(self.skills_list_frame, style="Surface.TFrame")
            row.pack(fill="x", pady=3)

            ttk.Label(
                row,
                text=f"{s_name} — {prof.score:.0f}% ({dom_label} | μB={fuzzy_deg['Beginner']:.2f}, μI={fuzzy_deg['Intermediate']:.2f}, μA={fuzzy_deg['Advanced']:.2f})",
                style="Body.TLabel",
            ).pack(side="left")

            ttk.Button(
                row,
                text="Remove",
                style="Secondary.TButton",
                command=lambda n=s_name: self._remove_skill(n),
            ).pack(side="right")

    def _add_or_update_skill(self) -> None:
        sk = self.new_skill_var.get().strip()
        if not sk:
            return
        try:
            score = float(self.new_score_var.get())
        except ValueError:
            score = 50.0
        meta = self.ctx.kb.get_skill(sk)
        cat = meta.category if meta else "General"
        self.ctx.student.set_skill(sk, score, category=cat)
        self._refresh_skills_list()

    def _remove_skill(self, skill_name: str) -> None:
        self.ctx.student.remove_skill(skill_name)
        self._refresh_skills_list()

    def _save_profile(self) -> None:
        student = self.ctx.student
        student.name = self.name_var.get().strip()
        student.career_goal = self.career_var.get().strip()
        student.interests = [
            i.strip() for i in self.interests_var.get().split(",") if i.strip()
        ]
        student.learning_objectives = self.objectives_var.get().strip()
        student.preferences.preferred_difficulty = self.diff_var.get().strip() or "Beginner"
        try:
            student.preferences.preferred_duration_hours = float(self.duration_var.get())
        except ValueError:
            student.preferences.preferred_duration_hours = 3.0
        try:
            student.preferences.weekly_study_hours = int(self.weekly_var.get())
        except ValueError:
            student.preferences.weekly_study_hours = 8
        student.preferences.learning_style = self.style_var.get().strip()
        student.preferences.prefer_full_courses = bool(self.full_course_var.get())

        self.ctx.student_repo.save_student(student)
        self.status_var.set("Profile saved to SQLite database.")
        self.on_profile_saved()
