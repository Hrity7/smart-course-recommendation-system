"""
Lightweight Tooltip widget for Tkinter/ttk controls to support progressive disclosure.
"""

import tkinter as tk
from typing import Optional


class Tooltip:
    """Attaches a clean hover tooltip to any Tkinter widget."""

    def __init__(self, widget: tk.Widget, text: str) -> None:
        self.widget = widget
        self.text = text
        self.tip_window: Optional[tk.Toplevel] = None
        self.widget.bind("<Enter>", self.show_tip, add="+")
        self.widget.bind("<Leave>", self.hide_tip, add="+")

    def show_tip(self, event=None) -> None:
        if self.tip_window or not self.text:
            return
        x = self.widget.winfo_rootx() + 18
        y = self.widget.winfo_rooty() + self.widget.winfo_height() + 4
        self.tip_window = tw = tk.Toplevel(self.widget)
        tw.wm_overrideredirect(True)
        tw.wm_geometry(f"+{x}+{y}")
        label = tk.Label(
            tw,
            text=self.text,
            justify="left",
            background="#0F172A",
            foreground="#F8FAFC",
            relief="solid",
            borderwidth=1,
            font=("Segoe UI", 9),
            padx=8,
            pady=4,
            wraplength=320,
        )
        label.pack()

    def hide_tip(self, event=None) -> None:
        if self.tip_window:
            self.tip_window.destroy()
            self.tip_window = None
