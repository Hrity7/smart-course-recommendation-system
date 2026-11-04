"""
Configuration, constants, and design tokens for the Smart Course Recommendation System.
"""

import os
from pathlib import Path
from typing import Dict, List

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "smart_courses.db"

APP_NAME = "Smart Course Recommendation System"
APP_VERSION = "3.0.0"
DEFAULT_WINDOW_SIZE = "1360x860"
MIN_WINDOW_WIDTH = 1100
MIN_WINDOW_HEIGHT = 720

# Environment API Keys (never hardcode secrets)
YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "").strip()
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"

# Supported Academic & Technical Categories
EDUCATIONAL_CATEGORIES: List[str] = [
    "All",
    "Artificial Intelligence",
    "Machine Learning",
    "Data Science",
    "Web Development",
    "Computer Science",
    "Programming Languages",
    "Cybersecurity",
    "Cloud Computing",
]

DIFFICULTY_LEVELS: List[str] = [
    "Beginner",
    "Intermediate",
    "Advanced",
]

CAREER_GOALS: List[str] = [
    "AI Engineer",
    "Machine Learning Engineer",
    "Data Scientist",
    "Full-Stack Web Developer",
    "Software Engineer",
    "Cybersecurity Analyst",
    "Cloud Architect",
]

LEARNING_PREFERENCES: List[str] = [
    "Hands-on Projects",
    "Comprehensive Full Courses",
    "Concise Concept Tutorials",
    "Mathematical & Theoretical Depth",
]

# Design System Tokens (Calm, Accessible Light & Dark Themes for Tkinter/ttk)
THEMES: Dict[str, Dict[str, str]] = {
    "light": {
        "bg_canvas": "#F8FAFC",
        "bg_surface": "#FFFFFF",
        "bg_subtle": "#F1F5F9",
        "bg_sidebar": "#0F172A",
        "fg_sidebar": "#F8FAFC",
        "fg_sidebar_muted": "#94A3B8",
        "fg_primary": "#0F172A",
        "fg_secondary": "#475569",
        "fg_muted": "#64748B",
        "accent": "#2563EB",
        "accent_hover": "#1D4ED8",
        "accent_fg": "#FFFFFF",
        "border": "#E2E8F0",
        "success": "#16A34A",
        "warning": "#D97706",
        "error": "#DC2626",
    },
    "dark": {
        "bg_canvas": "#0F172A",
        "bg_surface": "#1E293B",
        "bg_subtle": "#334155",
        "bg_sidebar": "#020617",
        "fg_sidebar": "#F8FAFC",
        "fg_sidebar_muted": "#94A3B8",
        "fg_primary": "#F8FAFC",
        "fg_secondary": "#CBD5E1",
        "fg_muted": "#94A3B8",
        "accent": "#3B82F6",
        "accent_hover": "#2563EB",
        "accent_fg": "#FFFFFF",
        "border": "#334155",
        "success": "#22C55E",
        "warning": "#F59E0B",
        "error": "#EF4444",
    },
}
