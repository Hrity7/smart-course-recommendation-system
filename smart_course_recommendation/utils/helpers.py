"""
Formatting, ISO-8601 duration parsing, and background worker thread helpers.
"""

import re
import threading
from datetime import datetime
from typing import Any, Callable, Optional, Tuple

ISO_DURATION_REGEX = re.compile(
    r"^PT(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?$"
)


def parse_iso8601_duration(iso_str: str) -> Tuple[int, str]:
    """
    Parses a YouTube ISO-8601 duration string (e.g., 'PT3H45M12S')
    into (total_seconds, formatted_label).
    Never guesses duration from popularity.
    """
    if not iso_str or not isinstance(iso_str, str):
        return 0, "Duration unavailable"

    match = ISO_DURATION_REGEX.match(iso_str.strip())
    if not match:
        return 0, "Duration unavailable"

    hours = int(match.group("hours") or 0)
    minutes = int(match.group("minutes") or 0)
    seconds = int(match.group("seconds") or 0)
    total_seconds = hours * 3600 + minutes * 60 + seconds

    if total_seconds <= 0:
        return 0, "Duration unavailable"

    if hours > 0:
        label = f"{hours}h {minutes}m" if minutes > 0 else f"{hours}h"
    elif minutes > 0:
        label = f"{minutes}m"
    else:
        label = f"{seconds}s"

    return total_seconds, label


def format_view_count(view_count: Optional[int]) -> str:
    """Formats an integer YouTube view count into a readable string."""
    if view_count is None:
        return "Views unavailable"
    try:
        count = int(view_count)
    except (TypeError, ValueError):
        return "Views unavailable"
    if count >= 1_000_000:
        return f"{count / 1_000_000:.1f}M views"
    if count >= 1_000:
        return f"{count / 1_000:.1f}K views"
    return f"{count} views"


def format_published_date(iso_date: str) -> str:
    """Formats an ISO-8601 publication timestamp into 'MMM DD, YYYY'."""
    if not iso_date:
        return "Date unavailable"
    try:
        cleaned = iso_date.replace("Z", "+00:00")
        dt = datetime.fromisoformat(cleaned)
        return dt.strftime("%b %d, %Y")
    except Exception:
        return iso_date[:10]


def run_in_background(
    task_fn: Callable[[], Any],
    on_success: Optional[Callable[[Any], None]] = None,
    on_error: Optional[Callable[[Exception], None]] = None,
    tk_root: Any = None,
) -> threading.Thread:
    """
    Executes a blocking network or AI task on a daemon thread and marshals
    callbacks safely back onto the Tkinter main loop if tk_root is provided.
    """
    def _worker() -> None:
        try:
            result = task_fn()
            if on_success:
                if tk_root is not None:
                    tk_root.after(0, lambda: on_success(result))
                else:
                    on_success(result)
        except Exception as exc:
            if on_error:
                if tk_root is not None:
                    tk_root.after(0, lambda: on_error(exc))
                else:
                    on_error(exc)

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    return thread
