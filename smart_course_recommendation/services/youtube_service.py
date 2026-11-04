"""
YouTube Data API v3 Service.
Fetches genuine educational courses and tutorials directly from YouTube's
`search` and `videos` endpoints using a configured YOUTUBE_API_KEY.

Strict Academic & Technical Guarantees:
- Never fabricates YouTube URLs or video IDs.
- Never invents artificial ratings or fake view counts.
- Parses real ISO-8601 durations from `contentDetails.duration`.
- Requires a valid live YOUTUBE_API_KEY for searches.
"""

import json
import os
from typing import Any, Dict, List, Optional, Tuple
import urllib.error
import urllib.parse
import urllib.request

from ai.knowledge_base import KnowledgeBase
from config import YOUTUBE_API_KEY, YOUTUBE_SEARCH_URL, YOUTUBE_VIDEOS_URL
from models.course import Course, VideoMetrics
from utils.helpers import format_published_date, parse_iso8601_duration
from utils.validators import (
    is_meaningful_educational_query,
    is_valid_youtube_video_id,
)


class YouTubeServiceError(Exception):
    """Raised when the YouTube Data API v3 key is missing, invalid, or quota-limited."""

    def __init__(self, message: str, code: str = "API_ERROR") -> None:
        super().__init__(message)
        self.code = code


class YouTubeService:
    """
    Object-Oriented client for YouTube Data API v3 (`search.list` and `videos.list`).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        knowledge_base: Optional[KnowledgeBase] = None,
    ) -> None:
        self._explicit_key = api_key
        self.kb = knowledge_base or KnowledgeBase()

    @property
    def api_key(self) -> str:
        key = (
            self._explicit_key
            if self._explicit_key is not None
            else os.getenv("YOUTUBE_API_KEY", YOUTUBE_API_KEY)
        ).strip()
        if key in ("YOUR_YOUTUBE_DATA_API_V3_KEY", "MY_YOUTUBE_API_KEY", ""):
            return ""
        return key

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _http_get_json(self, base_url: str, params: Dict[str, Any]) -> Dict[str, Any]:
        query_string = urllib.parse.urlencode(params)
        full_url = f"{base_url}?{query_string}"
        req = urllib.request.Request(
            full_url,
            headers={"Accept": "application/json", "User-Agent": "SmartCourseRecommender/3.0"},
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw)
        except urllib.error.HTTPError as http_err:
            raw_body = ""
            try:
                raw_body = http_err.read().decode("utf-8")
            except Exception:
                pass
            self._raise_http_error(http_err.code, raw_body)
            return {}
        except urllib.error.URLError as url_err:
            raise YouTubeServiceError(
                f"Network error while connecting to YouTube Data API v3: {url_err.reason}",
                code="NETWORK_ERROR",
            ) from url_err

    def search_courses(
        self,
        query: str,
        category: str = "All",
        difficulty: str = "All",
        language: str = "English",
        prefer_full_courses: bool = False,
        max_results: int = 12,
    ) -> List[Course]:
        """
        Queries YouTube Data API v3 for real educational videos matching the user's filters.
        Raises YouTubeServiceError if YOUTUBE_API_KEY is not configured or API returns an error.
        """
        if not self.is_configured():
            raise YouTubeServiceError(
                "YOUTUBE_API_KEY is not configured. Please set a valid YouTube Data API v3 key "
                "in your .env file or Settings tab to retrieve live YouTube courses.",
                code="MISSING_API_KEY",
            )

        raw_q = (query or "").strip()
        if raw_q and not is_meaningful_educational_query(raw_q):
            return []

        search_q = self._build_educational_query(
            raw_q, category, difficulty, prefer_full_courses
        )

        search_params: Dict[str, Any] = {
            "part": "snippet",
            "q": search_q,
            "type": "video",
            "videoEmbeddable": "true",
            "relevanceLanguage": "en" if language.lower().startswith("en") else "en",
            "maxResults": min(25, max(5, max_results * 2)),
            "key": self.api_key,
        }
        if prefer_full_courses:
            search_params["videoDuration"] = "long"

        search_data = self._http_get_json(YOUTUBE_SEARCH_URL, search_params)
        items = search_data.get("items", [])

        video_ids: List[str] = []
        seen_ids = set()
        for item in items:
            vid = item.get("id", {}).get("videoId", "")
            if is_valid_youtube_video_id(vid) and vid not in seen_ids:
                seen_ids.add(vid)
                video_ids.append(vid)

        if not video_ids:
            return []

        videos_params = {
            "part": "snippet,contentDetails,statistics",
            "id": ",".join(video_ids),
            "key": self.api_key,
        }
        videos_data = self._http_get_json(YOUTUBE_VIDEOS_URL, videos_params)

        courses: List[Course] = []
        seen_titles = set()

        for v_item in videos_data.get("items", []):
            course = self._parse_video_item(
                v_item,
                category_hint=category,
                difficulty_hint=difficulty,
                raw_query=raw_q,
            )
            if course is None:
                continue

            norm_title = course.title.lower().strip()
            if norm_title in seen_titles:
                continue
            seen_titles.add(norm_title)

            courses.append(course)
            if len(courses) >= max_results:
                break

        return courses

    @staticmethod
    def _build_educational_query(
        raw_query: str,
        category: str,
        difficulty: str,
        prefer_full_courses: bool,
    ) -> str:
        parts: List[str] = []
        if raw_query:
            parts.append(raw_query)
        elif category and category != "All":
            parts.append(category)
        else:
            parts.append("Computer Science Artificial Intelligence Programming")

        if difficulty and difficulty != "All":
            if difficulty.lower() not in " ".join(parts).lower():
                parts.append(difficulty.lower())

        combined_lower = " ".join(parts).lower()
        if prefer_full_courses and "full course" not in combined_lower:
            parts.append("full course")
        elif "course" not in combined_lower and "tutorial" not in combined_lower:
            parts.append("course tutorial")

        return " ".join(parts).strip()

    @staticmethod
    def _raise_http_error(status_code: int, raw_body: str) -> None:
        try:
            err_payload = json.loads(raw_body).get("error", {})
            message = err_payload.get("message", f"HTTP {status_code}")
            reasons = [e.get("reason", "") for e in err_payload.get("errors", [])]
        except Exception:
            message = f"HTTP {status_code}"
            reasons = []

        if status_code == 400 or "keyInvalid" in reasons:
            raise YouTubeServiceError(
                "Invalid YouTube Data API v3 key. Please verify YOUTUBE_API_KEY in your .env file.",
                code="INVALID_API_KEY",
            )
        if (
            status_code == 403
            or "quotaExceeded" in reasons
            or "dailyLimitExceeded" in reasons
        ):
            raise YouTubeServiceError(
                "YouTube Data API v3 quota limit reached (HTTP 403). Please wait for quota reset or check Google Cloud Console.",
                code="QUOTA_EXCEEDED",
            )
        raise YouTubeServiceError(
            f"YouTube Data API v3 error: {message}", code="API_ERROR"
        )

    def _parse_video_item(
        self,
        item: dict,
        category_hint: str = "All",
        difficulty_hint: str = "All",
        raw_query: str = "",
    ) -> Optional[Course]:
        vid = item.get("id", "")
        if not is_valid_youtube_video_id(vid):
            return None

        snippet = item.get("snippet", {})
        content_details = item.get("contentDetails", {})
        statistics = item.get("statistics", {})

        title = (snippet.get("title") or "").strip()
        channel_title = (snippet.get("channelTitle") or "YouTube Educator").strip()
        description = (snippet.get("description") or "").strip()

        if not title:
            return None

        duration_iso = content_details.get("duration") or ""
        duration_seconds, duration_formatted = parse_iso8601_duration(duration_iso)

        if 0 < duration_seconds < 180:
            return None

        if not self._is_educational_content(title, description, raw_query):
            return None

        view_count_raw = statistics.get("viewCount")
        view_count = int(view_count_raw) if view_count_raw is not None else None
        like_count_raw = statistics.get("likeCount")
        like_count = int(like_count_raw) if like_count_raw is not None else None
        comment_count_raw = statistics.get("commentCount")
        comment_count = (
            int(comment_count_raw) if comment_count_raw is not None else None
        )

        thumbnails = snippet.get("thumbnails", {})
        thumb_url = (
            thumbnails.get("high", {}).get("url")
            or thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
            or f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
        )

        published_at = format_published_date(snippet.get("publishedAt") or "")
        inferred_difficulty = self._infer_difficulty(
            title, description, difficulty_hint
        )
        inferred_category = self._infer_category(title, description, category_hint)
        content_type = self._classify_content_type(title, duration_seconds)
        topics = self.kb.extract_skills_from_text(title, description)
        prerequisites = self.kb.infer_course_prerequisites(
            topics, inferred_difficulty
        )

        metrics = VideoMetrics(
            view_count=view_count,
            like_count=like_count,
            comment_count=comment_count,
            duration_iso=duration_iso,
            duration_seconds=duration_seconds,
            duration_formatted=duration_formatted,
        )

        return Course(
            video_id=vid,
            title=title,
            channel_title=channel_title,
            description=description,
            category=inferred_category,
            difficulty=inferred_difficulty,
            content_type=content_type,
            topics=topics,
            prerequisites=prerequisites,
            published_at=published_at,
            thumbnail_url=thumb_url,
            language="English",
            metrics=metrics,
        )

    @staticmethod
    def _is_educational_content(
        title: str, description: str, raw_query: str
    ) -> bool:
        combined = f"{title} {description}".lower()
        banned_terms = (
            "official music video",
            "lyric video",
            "movie trailer",
            "prank",
            "mukbang",
            "tiktok compilation",
            "gameplay walkthrough",
        )
        if any(term in combined for term in banned_terms):
            return False

        edu_terms = (
            "course",
            "tutorial",
            "learn",
            "programming",
            "engineering",
            "science",
            "lecture",
            "bootcamp",
            "training",
            "guide",
            "introduction",
            "fundamentals",
            "explained",
            "python",
            "machine learning",
            "artificial intelligence",
            "data",
            "algorithm",
            "web",
            "developer",
            "software",
            "sql",
            "math",
            "linear algebra",
            "statistics",
            "security",
            "cloud",
        )
        return any(term in combined for term in edu_terms)

    @staticmethod
    def _infer_difficulty(
        title: str, description: str, hint: str = "All"
    ) -> str:
        text = f"{title} {description[:300]}".lower()
        if any(
            w in text
            for w in (
                "advanced",
                "deep dive",
                "production",
                "architecture",
                "research",
                "mastering",
                "from scratch in pytorch",
            )
        ):
            return "Advanced"
        if any(
            w in text
            for w in (
                "beginner",
                "for beginners",
                "introduction",
                "intro to",
                "basics",
                "101",
                "crash course",
                "getting started",
                "zero to",
            )
        ):
            return "Beginner"
        if any(
            w in text
            for w in ("intermediate", "hands-on", "applied", "projects", "practical")
        ):
            return "Intermediate"
        if hint in ("Beginner", "Intermediate", "Advanced"):
            return hint
        return "Beginner"

    @staticmethod
    def _infer_category(
        title: str, description: str, hint: str = "All"
    ) -> str:
        text = f"{title} {description[:300]}".lower()
        if any(w in text for w in ("deep learning", "neural network", "nlp", "llm", "artificial intelligence", "generative ai")):
            return "Artificial Intelligence"
        if any(w in text for w in ("machine learning", "scikit-learn", "regression", "classification", "mlops")):
            return "Machine Learning"
        if any(w in text for w in ("data science", "pandas", "numpy", "statistics", "probability", "data analysis", "sql")):
            return "Data Science"
        if any(w in text for w in ("html", "css", "javascript", "react", "frontend", "backend", "full stack", "web development")):
            return "Web Development"
        if any(w in text for w in ("security", "cybersecurity", "penetration", "cryptography", "owasp")):
            return "Cybersecurity"
        if any(w in text for w in ("cloud", "aws", "kubernetes", "docker", "devops", "system design")):
            return "Cloud Computing"
        if any(w in text for w in ("data structures", "algorithms", "operating system", "computer science")):
            return "Computer Science"
        if any(w in text for w in ("python", "java", "c++", "rust", "golang", "programming")):
            return "Programming Languages"
        if hint and hint != "All":
            return hint
        return "Computer Science"

    @staticmethod
    def _classify_content_type(title: str, duration_seconds: int) -> str:
        t_lower = title.lower()
        if duration_seconds >= 5400 or "full course" in t_lower or "bootcamp" in t_lower:
            return "Complete Course"
        if duration_seconds >= 1500:
            return "In-Depth Tutorial"
        return "Concept Overview"
