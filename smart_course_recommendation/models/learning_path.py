"""
Learning path and roadmap graph models used by BFS, DFS, and A* Search algorithms.
"""

from dataclasses import dataclass, field
from typing import List, Optional
from .course import Course


@dataclass
class LearningNode:
    """Represents a skill milestone in the prerequisite knowledge graph."""
    skill_name: str
    category: str
    difficulty: str  # Beginner, Intermediate, Advanced
    estimated_hours: float
    prerequisites: List[str] = field(default_factory=list)
    is_acquired: bool = False
    is_next_recommended: bool = False
    path_cost_g: float = 0.0
    heuristic_h: float = 0.0
    total_cost_f: float = 0.0
    recommended_courses: List[Course] = field(default_factory=list)


@dataclass
class LearningEdge:
    """Directed prerequisite edge: source_skill -> target_skill."""
    source_skill: str
    target_skill: str
    transition_cost: float = 1.0


@dataclass
class LearningRoadmap:
    """Encapsulates a generated learning path produced by BFS, DFS, or A* Search."""
    career_goal: str
    algorithm_used: str  # "BFS", "DFS", or "A*"
    ordered_nodes: List[LearningNode] = field(default_factory=list)
    edges: List[LearningEdge] = field(default_factory=list)
    alternative_paths: List[List[str]] = field(default_factory=list)
    total_estimated_hours: float = 0.0
    total_path_cost: float = 0.0
    next_recommended_skill: Optional[str] = None
    explanation: str = ""
