"""
Course domain models representing real YouTube educational videos and metadata.
No pricing or artificial rating fields exist.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class VideoMetrics:
    """Genuine YouTube video engagement and duration metrics."""
    view_count: Optional[int] = None
    like_count: Optional[int] = None
    comment_count: Optional[int] = None
    duration_iso: str = ""
    duration_seconds: int = 0
    duration_formatted: str = "Duration unavailable"

    @property
    def duration_hours(self) -> float:
        if self.duration_seconds <= 0:
            return 0.0
        return round(self.duration_seconds / 3600.0, 2)

    @property
    def formatted_views(self) -> str:
        if self.view_count is None:
            return "Views unavailable"
        if self.view_count >= 1_000_000:
            return f"{self.view_count / 1_000_000:.1f}M views"
        if self.view_count >= 1_000:
            return f"{self.view_count / 1_000:.1f}K views"
        return f"{self.view_count} views"


@dataclass
class Course:
    """
    Represents a genuine educational course or tutorial retrieved from YouTube.
    Never fabricates URLs, ratings, or popularity-based durations.
    """
    video_id: str
    title: str
    channel_title: str
    description: str = ""
    category: str = "Computer Science"
    difficulty: str = "Beginner"
    content_type: str = "Tutorial"  # "Complete Course", "In-Depth Tutorial", or "Concept Overview"
    topics: List[str] = field(default_factory=list)
    prerequisites: List[str] = field(default_factory=list)
    published_at: str = ""
    thumbnail_url: str = ""
    language: str = "English"
    metrics: VideoMetrics = field(default_factory=VideoMetrics)

    @property
    def course_id(self) -> str:
        return self.video_id

    @property
    def youtube_url(self) -> str:
        return f"https://www.youtube.com/watch?v={self.video_id}"

    @property
    def embed_url(self) -> str:
        return f"https://www.youtube.com/embed/{self.video_id}"

    @property
    def duration_hours(self) -> float:
        return self.metrics.duration_hours

    @property
    def duration_formatted(self) -> str:
        return self.metrics.duration_formatted

    @property
    def view_count(self) -> Optional[int]:
        return self.metrics.view_count

    @property
    def formatted_views(self) -> str:
        return self.metrics.formatted_views

    def to_text_document(self) -> str:
        """Combines course title, topics, category, and description for TF-IDF analysis."""
        topic_str = " ".join(self.topics)
        prereq_str = " ".join(self.prerequisites)
        return f"{self.title} {self.category} {topic_str} {prereq_str} {self.description}".strip()
