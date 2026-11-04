"""
Views 5 & 6: Skill Gap Analysis View and Dynamic Learning Roadmap View (BFS, DFS, A* Search).
"""

import tkinter as tk
from tkinter import ttk


class SkillGapView(ttk.Frame):
    """View 5: Quantitative & Fuzzy Skill Gap Analysis comparing student skills vs career ontology."""

    def __init__(self, parent: tk.Widget, app_context) -> None:
        super().__init__(parent, style="Canvas.TFrame", padding=(24, 20))
        self.ctx = app_context
        self._build_ui()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)
        student = self.ctx.student
        report = self.ctx.skill_analyzer.analyze(student)

        ttk.Label(self, text="Skill Gap", style="PageTitle.TLabel").grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            self,
            text=f"Target Role: {report.career_goal}  ·  Overall Readiness: {report.overall_readiness_percent:.1f}%",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 16))

        sections = [
            ("Missing Core & Secondary Skills", report.missing_skills),
            ("In-Progress / Partial Skills", report.partial_skills),
            ("Acquired Skills", report.acquired_skills),
        ]

        for s_idx, (sec_title, items) in enumerate(sections, start=2):
            card = ttk.Frame(self, style="Card.TFrame", padding=(18, 14))
            card.grid(row=s_idx, column=0, sticky="ew", pady=(0, 12))
            card.columnconfigure(0, weight=1)

            ttk.Label(card, text=f"{sec_title} ({len(items)})", style="SectionTitle.TLabel").grid(
                row=0, column=0, sticky="w", pady=(0, 8)
            )

            if not items:
                ttk.Label(card, text="None in this category.", style="Muted.TLabel").grid(
                    row=1, column=0, sticky="w"
                )
                continue

            for idx, item in enumerate(items, start=1):
                row = ttk.Frame(card, style="Surface.TFrame")
                row.grid(row=idx, column=0, sticky="ew", pady=3)
                row.columnconfigure(1, weight=1)

                prereq_tag = (
                    "Ready"
                    if item.prerequisites_satisfied
                    else f"Needs: {', '.join(item.missing_prerequisites)}"
                )
                ttk.Label(
                    row,
                    text=f"{item.skill_name} [{item.priority}] — {item.current_score:.0f}% / {item.target_score:.0f}% ({item.linguistic_level})",
                    style="BodyBold.TLabel",
                ).grid(row=0, column=0, sticky="w", padx=(0, 12))

                bar = ttk.Progressbar(
                    row,
                    orient="horizontal",
                    length=140,
                    mode="determinate",
                    maximum=100,
                    value=item.current_score,
                )
                bar.grid(row=0, column=1, sticky="w", padx=(0, 12))

                ttk.Label(row, text=prereq_tag, style="Muted.TLabel").grid(
                    row=0, column=2, sticky="e"
                )


class RoadmapView(ttk.Frame):
    """
    View 6: Interactive Learning Roadmap generated dynamically via:
    - A* Search (f(n) = g(n) + h(n))
    - BFS (Shortest Prerequisite Path)
    - DFS (Alternative Deep Learning Paths)
    """

    def __init__(self, parent: tk.Widget, app_context) -> None:
        super().__init__(parent, style="Canvas.TFrame", padding=(24, 20))
        self.ctx = app_context
        self.algo_var = tk.StringVar(value="A*")
        self._build_ui()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)

        hdr = ttk.Frame(self, style="Canvas.TFrame")
        hdr.grid(row=0, column=0, sticky="ew", pady=(0, 14))
        hdr.columnconfigure(0, weight=1)

        ttk.Label(hdr, text="Roadmap", style="PageTitle.TLabel").grid(
            row=0, column=0, sticky="w"
        )
        ttk.Label(
            hdr,
            text="Dynamic prerequisite graph search using Module 1 AI Search Methodologies.",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 0))

        # Algorithm Selector (A*, BFS, DFS)
        algo_bar = ttk.Frame(hdr, style="Canvas.TFrame")
        algo_bar.grid(row=0, column=1, rowspan=2, sticky="e")

        for algo in ("A*", "BFS", "DFS"):
            ttk.Radiobutton(
                algo_bar,
                text=algo,
                value=algo,
                variable=self.algo_var,
                command=self._render_roadmap,
            ).pack(side="left", padx=6)

        self.roadmap_container = ttk.Frame(self, style="Canvas.TFrame")
        self.roadmap_container.grid(row=1, column=0, sticky="nsew")
        self.roadmap_container.columnconfigure(0, weight=1)

        self._render_roadmap()

    def _render_roadmap(self) -> None:
        for child in self.roadmap_container.winfo_children():
            child.destroy()

        cached_courses = self.ctx.course_repo.get_all_cached_courses(limit=50)
        roadmap = self.ctx.roadmap_generator.generate_roadmap(
            self.ctx.student,
            algorithm=self.algo_var.get(),
            available_courses=cached_courses,
        )

        summary_card = ttk.Frame(self.roadmap_container, style="Card.TFrame", padding=(16, 12))
        summary_card.grid(row=0, column=0, sticky="ew", pady=(0, 14))
        summary_card.columnconfigure(0, weight=1)

        ttk.Label(
            summary_card,
            text=f"{roadmap.algorithm_used}  ·  Remaining Study: {roadmap.total_estimated_hours:.0f}h",
            style="SectionTitle.TLabel",
        ).grid(row=0, column=0, sticky="w")
        ttk.Label(
            summary_card,
            text=roadmap.explanation,
            style="Muted.TLabel",
            wraplength=820,
        ).grid(row=1, column=0, sticky="w", pady=(4, 0))

        # Render ordered milestone nodes
        for idx, node in enumerate(roadmap.ordered_nodes, start=1):
            node_card = ttk.Frame(self.roadmap_container, style="Card.TFrame", padding=(16, 12))
            node_card.grid(row=idx, column=0, sticky="ew", pady=(0, 8))
            node_card.columnconfigure(0, weight=1)

            status_tag = (
                "Acquired"
                if node.is_acquired
                else ("Next Recommended Step" if node.is_next_recommended else "Pending")
            )
            title_line = f"{idx}. {node.skill_name}  [{node.difficulty} · {node.estimated_hours:.0f}h · {status_tag}]"
            ttk.Label(node_card, text=title_line, style="CardTitle.TLabel").grid(
                row=0, column=0, sticky="w"
            )

            prereq_str = ", ".join(node.prerequisites) if node.prerequisites else "None (Root Skill)"
            cost_str = (
                f"g(n)={node.path_cost_g:.1f}, h(n)={node.heuristic_h:.1f}, f(n)={node.total_cost_f:.1f}"
            )
            ttk.Label(
                node_card,
                text=f"Prerequisites: {prereq_str}   |   Search Metrics: {cost_str}",
                style="Muted.TLabel",
            ).grid(row=1, column=0, sticky="w", pady=(3, 0))

            btn_lbl = "Mark Pending" if node.is_acquired else "Mark Acquired"
            ttk.Button(
                node_card,
                text=btn_lbl,
                style="Secondary.TButton",
                command=lambda sk=node.skill_name, acq=node.is_acquired: self._toggle_skill_acquired(
                    sk, acq
                ),
            ).grid(row=0, column=1, rowspan=2, sticky="e")

        # Alternative DFS paths if available
        if roadmap.alternative_paths and len(roadmap.alternative_paths) > 1:
            alt_card = ttk.Frame(self.roadmap_container, style="Card.TFrame", padding=(16, 12))
            alt_card.grid(row=len(roadmap.ordered_nodes) + 1, column=0, sticky="ew", pady=(8, 0))
            ttk.Label(
                alt_card,
                text="Alternative Valid DFS Prerequisite Paths",
                style="SectionTitle.TLabel",
            ).pack(anchor="w", pady=(0, 6))
            for p_idx, path_list in enumerate(roadmap.alternative_paths[:3], start=1):
                ttk.Label(
                    alt_card,
                    text=f"Path {p_idx}: " + " -> ".join(path_list),
                    style="Muted.TLabel",
                    wraplength=820,
                ).pack(anchor="w", pady=2)

    def _toggle_skill_acquired(self, skill_name: str, currently_acquired: bool) -> None:
        meta = self.ctx.kb.get_skill(skill_name)
        cat = meta.category if meta else "General"
        if currently_acquired:
            self.ctx.student.set_skill(skill_name, 20.0, category=cat)
        else:
            self.ctx.student.set_skill(skill_name, 85.0, category=cat)
        self.ctx.student_repo.save_student(self.ctx.student)
        self._render_roadmap()
