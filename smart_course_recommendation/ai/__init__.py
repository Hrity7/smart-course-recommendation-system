"""
Artificial Intelligence package implementing:
- Module 1: Problem Solving & Search Methodologies (BFS, DFS, A*, Heuristic Search)
- Module 3: Knowledge Representation & Rule-Based Reasoning
- Module 4: Statistical Reasoning (Bayesian Reasoning & Fuzzy Logic)
- Content-Based Filtering (TF-IDF Vectorization & Cosine Similarity)
"""

from .knowledge_base import KnowledgeBase, SkillMetadata
from .rule_engine import RuleEngine, InferenceRule, RuleMatch
from .search_algorithms import SearchAlgorithms
from .bayesian_reasoning import BayesianReasoner
from .fuzzy_logic import FuzzyLogicEngine
from .skill_analyzer import SkillAnalyzer, SkillGapReport
from .roadmap_generator import RoadmapGenerator
from .recommendation_engine import RecommendationEngine

__all__ = [
    "KnowledgeBase",
    "SkillMetadata",
    "RuleEngine",
    "InferenceRule",
    "RuleMatch",
    "SearchAlgorithms",
    "BayesianReasoner",
    "FuzzyLogicEngine",
    "SkillAnalyzer",
    "SkillGapReport",
    "RoadmapGenerator",
    "RecommendationEngine",
]
