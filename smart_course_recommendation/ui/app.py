"""
Main Tkinter/ttk Application Window (`SmartCourseApp`) managing the 10-view navigation,
application context, scrollable workspace canvas, and Light/Dark theme token styling.
"""

import tkinter as tk
from tkinter import ttk
from typing import Dict

from ai.fuzzy_logic import FuzzyLogicEngine
from ai.knowledge_base import KnowledgeBase
from ai.recommendation_engine import RecommendationEngine
from ai.roadmap_generator import RoadmapGenerator
from ai.search_algorithms import SearchAlgorithms
from ai.skill_analyzer import SkillAnalyzer
from config import (
    APP_NAME,
    DEFAULT_WINDOW_SIZE,
    MIN_WINDOW_HEIGHT,
    MIN_WINDOW_WIDTH,
    THEMES,
)
from database.db_manager import DatabaseManager
from database.repositories import (
    CourseRepository,
    ProgressRepository,
    RecommendationHistoryRepository,
    StudentRepository,
)
from services.course_service import CourseService
from services.gemini_service import GeminiService
from services.youtube_service import YouTubeService
from .analytics import (
    AIAssistantView,
    AnalyticsView,
    MyLearningView,
    SettingsView,
)
from .dashboard import DashboardView
from .explore import ExploreView
from .profile import ProfileView
from .recommendations import RecommendationsView
from .roadmap import RoadmapView, SkillGapView


class AppContext:
    """Dependency injection container holding repositories, AI modules, and active student."""

    def __init__(self, db_path=None) -> None:
        self.db = DatabaseManager(db_path=db_path)
        self.student_repo = StudentRepository(self.db)
        self.course_repo = CourseRepository(self.db)
        self.progress_repo = ProgressRepository(self.db)
        self.history_repo = RecommendationHistoryRepository(self.db)

        self.kb = KnowledgeBase()
        self.fuzzy = FuzzyLogicEngine()
        self.search_algorithms = SearchAlgorithms(self.kb)
        self.skill_analyzer = SkillAnalyzer(self.kb, self.fuzzy)
        self.roadmap_generator = RoadmapGenerator(self.kb, self.search_algorithms)
        self.recommendation_engine = RecommendationEngine(self.kb)

        self.youtube_service = YouTubeService(knowledge_base=self.kb)
        self.gemini_service = GeminiService()
        self.course_service = CourseService(
            youtube_service=self.youtube_service,
            course_repo=self.course_repo,
            history_repo=self.history_repo,
            recommendation_engine=self.recommendation_engine,
            knowledge_base=self.kb,
        )

        # Initializes strictly empty on first launch
        self.student = self.student_repo.get_or_create_active_student()
        self.theme_mode = "light"

    @property
    def current_theme(self) -> Dict[str, str]:
        return THEMES[self.theme_mode]


class SmartCourseApp(tk.Tk):
    """Main Tkinter/ttk Desktop Application Window with 10 views and Light/Dark themes."""

    NAV_ITEMS = [
        ("dashboard", "Dashboard"),
        ("profile", "Profile"),
        ("explore", "Explore"),
        ("recommendations", "For You"),
        ("skill_gap", "Skill Gap"),
        ("roadmap", "Roadmap"),
        ("my_learning", "My Learning"),
        ("analytics", "Analytics"),
        ("ai_assistant", "AI Advisor"),
        ("settings", "Settings"),
    ]

    def __init__(self, db_path=None) -> None:
        super().__init__()
        self.title(APP_NAME)
        self.geometry(DEFAULT_WINDOW_SIZE)
        self.minsize(MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT)

        self.ctx = AppContext(db_path=db_path)
        self.active_view_key = "dashboard"
        self.nav_buttons: Dict[str, tk.Button] = {}

        self.style = ttk.Style(self)
        try:
            self.style.theme_use("clam")
        except tk.TclError:
            pass

        self._apply_theme_styles()
        self._build_shell()
        self.show_view("dashboard")

    def _apply_theme_styles(self) -> None:
        t = self.ctx.current_theme
        self.configure(bg=t["bg_canvas"])

        self.style.configure("Canvas.TFrame", background=t["bg_canvas"])
        self.style.configure("Surface.TFrame", background=t["bg_surface"])
        self.style.configure(
            "Card.TFrame",
            background=t["bg_surface"],
            relief="solid",
            borderwidth=1,
        )

        self.style.configure(
            "PageTitle.TLabel",
            background=t["bg_canvas"],
            foreground=t["fg_primary"],
            font=("Segoe UI", 18, "bold"),
        )
        self.style.configure(
            "SectionTitle.TLabel",
            background=t["bg_surface"],
            foreground=t["fg_primary"],
            font=("Segoe UI", 12, "bold"),
        )
        self.style.configure(
            "CardTitle.TLabel",
            background=t["bg_surface"],
            foreground=t["fg_primary"],
            font=("Segoe UI", 11, "bold"),
        )
        self.style.configure(
            "StatHero.TLabel",
            background=t["bg_surface"],
            foreground=t["accent"],
            font=("Segoe UI", 22, "bold"),
        )
        self.style.configure(
            "Body.TLabel",
            background=t["bg_surface"],
            foreground=t["fg_primary"],
            font=("Segoe UI", 10),
        )
        self.style.configure(
            "BodyBold.TLabel",
            background=t["bg_surface"],
            foreground=t["fg_primary"],
            font=("Segoe UI", 10, "bold"),
        )
        self.style.configure(
            "Muted.TLabel",
            background=t["bg_surface"],
            foreground=t["fg_muted"],
            font=("Segoe UI", 9),
        )
        self.style.configure(
            "AccentBadge.TLabel",
            background=t["accent"],
            foreground=t["accent_fg"],
            font=("Segoe UI", 9, "bold"),
            padding=(8, 3),
        )
        self.style.configure(
            "Success.TLabel",
            background=t["bg_canvas"],
            foreground=t["success"],
            font=("Segoe UI", 10, "bold"),
        )

        self.style.configure(
            "Primary.TButton",
            background=t["accent"],
            foreground=t["accent_fg"],
            font=("Segoe UI", 10, "bold"),
            padding=(12, 6),
        )
        self.style.map(
            "Primary.TButton",
            background=[("active", t["accent_hover"]), ("disabled", t["border"])],
            foreground=[("disabled", t["fg_muted"])],
        )

        self.style.configure(
            "Secondary.TButton",
            background=t["bg_subtle"],
            foreground=t["fg_primary"],
            font=("Segoe UI", 9),
            padding=(10, 5),
        )
        self.style.map(
            "Secondary.TButton",
            background=[("active", t["border"])],
        )

    def _build_shell(self) -> None:
        self.columnconfigure(1, weight=1)
        self.rowconfigure(0, weight=1)

        t = self.ctx.current_theme

        # Left Navigation Sidebar
        self.sidebar = tk.Frame(self, bg=t["bg_sidebar"], width=220, padx=14, pady=20)
        self.sidebar.grid(row=0, column=0, sticky="ns")
        self.sidebar.grid_propagate(False)

        brand_lbl = tk.Label(
            self.sidebar,
            text="CourseAI",
            bg=t["bg_sidebar"],
            fg=t["fg_sidebar"],
            font=("Segoe UI", 15, "bold"),
            anchor="w",
        )
        brand_lbl.pack(fill="x", pady=(0, 20))

        for key, label in self.NAV_ITEMS:
            btn = tk.Button(
                self.sidebar,
                text=label,
                anchor="w",
                relief="flat",
                bd=0,
                padx=12,
                pady=8,
                bg=t["bg_sidebar"],
                fg=t["fg_sidebar_muted"],
                activebackground=t["accent"],
                activeforeground=t["accent_fg"],
                font=("Segoe UI", 10),
                cursor="hand2",
                command=lambda k=key: self.show_view(k),
            )
            btn.pack(fill="x", pady=2)
            self.nav_buttons[key] = btn

        # Right Scrollable Main Workspace
        self.main_outer = ttk.Frame(self, style="Canvas.TFrame")
        self.main_outer.grid(row=0, column=1, sticky="nsew")
        self.main_outer.columnconfigure(0, weight=1)
        self.main_outer.rowconfigure(0, weight=1)

        self.canvas = tk.Canvas(
            self.main_outer, bg=t["bg_canvas"], highlightthickness=0
        )
        self.scrollbar = ttk.Scrollbar(
            self.main_outer, orient="vertical", command=self.canvas.yview
        )
        self.viewport = ttk.Frame(self.canvas, style="Canvas.TFrame")

        self.viewport.bind(
            "<Configure>",
            lambda _e: self.canvas.configure(scrollregion=self.canvas.bbox("all")),
        )
        self.canvas_window = self.canvas.create_window(
            (0, 0), window=self.viewport, anchor="nw"
        )
        self.canvas.bind(
            "<Configure>",
            lambda e: self.canvas.itemconfig(self.canvas_window, width=e.width),
        )
        self.canvas.configure(yscrollcommand=self.scrollbar.set)

        self.canvas.grid(row=0, column=0, sticky="nsew")
        self.scrollbar.grid(row=0, column=1, sticky="ns")

    def show_view(self, view_key: str) -> None:
        self.active_view_key = view_key
        t = self.ctx.current_theme

        for k, btn in self.nav_buttons.items():
            if k == view_key:
                btn.configure(
                    bg=t["accent"],
                    fg=t["accent_fg"],
                    font=("Segoe UI", 10, "bold"),
                )
            else:
                btn.configure(
                    bg=t["bg_sidebar"],
                    fg=t["fg_sidebar_muted"],
                    font=("Segoe UI", 10),
                )

        for child in self.viewport.winfo_children():
            child.destroy()

        self.viewport.columnconfigure(0, weight=1)

        if view_key == "dashboard":
            view = DashboardView(self.viewport, self.ctx, on_navigate=self.show_view)
        elif view_key == "profile":
            view = ProfileView(
                self.viewport,
                self.ctx,
                on_profile_saved=lambda: None,
            )
        elif view_key == "explore":
            view = ExploreView(self.viewport, self.ctx)
        elif view_key == "recommendations":
            view = RecommendationsView(self.viewport, self.ctx)
        elif view_key == "skill_gap":
            view = SkillGapView(self.viewport, self.ctx)
        elif view_key == "roadmap":
            view = RoadmapView(self.viewport, self.ctx)
        elif view_key == "my_learning":
            view = MyLearningView(self.viewport, self.ctx)
        elif view_key == "analytics":
            view = AnalyticsView(self.viewport, self.ctx)
        elif view_key == "ai_assistant":
            view = AIAssistantView(self.viewport, self.ctx)
        else:
            view = SettingsView(
                self.viewport,
                self.ctx,
                on_toggle_theme=self.toggle_theme,
                on_reset_db=self._reset_database,
            )

        view.grid(row=0, column=0, sticky="nsew")
        self.canvas.yview_moveto(0.0)

    def toggle_theme(self) -> None:
        self.ctx.theme_mode = "dark" if self.ctx.theme_mode == "light" else "light"
        self._apply_theme_styles()
        t = self.ctx.current_theme
        self.canvas.configure(bg=t["bg_canvas"])
        self.sidebar.configure(bg=t["bg_sidebar"])
        self.show_view(self.active_view_key)

    def _reset_database(self) -> None:
        self.ctx.db.reset_all_data()
        self.ctx.student = self.ctx.student_repo.get_or_create_active_student()
        self.show_view("dashboard")
