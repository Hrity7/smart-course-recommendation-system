"""
Smart Course Recommendation System — Main Entry Point.
Launches the Python OOP Tkinter/ttk desktop application.
"""

import sys
from pathlib import Path

# Ensure package root is on sys.path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ui.app import SmartCourseApp


def main() -> None:
    app = SmartCourseApp()
    app.mainloop()


if __name__ == "__main__":
    main()
