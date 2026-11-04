"""
Visual AI Score Breakdown widget for Tkinter/ttk displaying transparent mathematical sub-scores.
"""

import tkinter as tk
from tkinter import ttk
from models.recommendation import ScoreBreakdown


class ScoreBreakdownPanel(ttk.Frame):
    """Renders horizontal progress bars for TF-IDF, Skill-Gap, Fuzzy, Bayesian, and Prerequisite scores."""

    def __init__(
        self, parent: tk.Widget, breakdown: ScoreBreakdown, theme: dict
    ) -> None:
        super().__init__(parent, style="Surface.TFrame", padding=(10, 8))
        self.breakdown = breakdown
        self.theme = theme
        self._build()

    def _build(self) -> None:
        metrics = [
            ("TF-IDF Similarity", self.breakdown.tfidf_cosine_similarity),
            ("Skill-Gap Alignment", self.breakdown.skill_gap_alignment),
            ("Prerequisite Match", self.breakdown.prerequisite_compatibility),
            ("Fuzzy Difficulty Fit", self.breakdown.fuzzy_difficulty_compatibility),
            ("Bayesian Suitability", self.breakdown.bayesian_suitability_posterior),
            ("Career Goal Fit", self.breakdown.career_goal_alignment),
        ]

        for row_idx, (label_text, val) in enumerate(metrics):
            col_offset = (row_idx % 2) * 3
            grid_row = row_idx // 2

            lbl = ttk.Label(
                self,
                text=f"{label_text}:",
                style="Muted.TLabel",
            )
            lbl.grid(row=grid_row, column=col_offset, sticky="w", padx=(0, 6), pady=2)

            bar = ttk.Progressbar(
                self,
                orient="horizontal",
                length=90,
                mode="determinate",
                maximum=100,
                value=max(0.0, min(100.0, val * 100.0)),
            )
            bar.grid(row=grid_row, column=col_offset + 1, sticky="ew", padx=(0, 6), pady=2)

            val_lbl = ttk.Label(
                self,
                text=f"{val:.2f}",
                style="BodyBold.TLabel",
            )
            val_lbl.grid(row=grid_row, column=col_offset + 2, sticky="w", padx=(0, 18), pady=2)
