"""
Input validation utilities for YouTube video IDs, search queries, and student profile inputs.
"""

import re

VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")

NON_EDUCATIONAL_KEYWORDS = {
    "cat prank",
    "dog compilation",
    "mukbang",
    "celebrity gossip",
    "fortnite montage",
    "tiktok dance",
    "makeup haul",
    "funny fails",
    "prank video",
    "music video official",
}


def is_valid_youtube_video_id(video_id: str) -> bool:
    """Checks that a string is a genuine 11-character YouTube video ID."""
    if not video_id or not isinstance(video_id, str):
        return False
    return bool(VIDEO_ID_PATTERN.match(video_id.strip()))


def is_meaningful_educational_query(query: str) -> bool:
    """
    Validates that a user search query is not gibberish or purely entertainment-related.
    """
    if not query or not isinstance(query, str):
        return False
    q = query.strip().lower()
    if len(q) < 2:
        return False

    alpha_only = re.sub(r"[^a-z]", "", q)
    if len(alpha_only) >= 7 and not re.search(r"[aeiouy]", alpha_only):
        return False
    if re.search(r"[bcdfghjklmnpqrstvwxz]{6,}", alpha_only):
        return False

    for kw in NON_EDUCATIONAL_KEYWORDS:
        if kw in q:
            return False

    return True


def validate_skill_score(score: float | int | str) -> float:
    """Clamps a numeric skill score to [0.0, 100.0]."""
    try:
        val = float(score)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(100.0, val))
