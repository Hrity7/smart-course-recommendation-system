"""
Dynamic Learning Roadmap Generator using BFS, DFS, and A* Search algorithms.
Builds personalized prerequisite learning graphs based on career goal, current skills,
and completed courses.
"""

from typing import List, Optional, Set

from models.course import Course
from models.learning_path import LearningEdge, LearningNode, LearningRoadmap
from models.student import Student
from .knowledge_base import KnowledgeBase
from .search_algorithms import SearchAlgorithms


class RoadmapGenerator:
    """
    Constructs dynamic LearningRoadmap instances using:
    - 'A*': Optimal path minimizing cumulative cost g(n) + heuristic h(n)
    - 'BFS': Shortest prerequisite chain (level-by-level topological breadth-first search)
    - 'DFS': Alternative deep exploration paths
    """

    def __init__(
        self, knowledge_base: KnowledgeBase, search_algorithms: SearchAlgorithms
    ) -> None:
        self.kb = knowledge_base
        self.search = search_algorithms

    def generate_roadmap(
        self,
        student: Student,
        algorithm: str = "A*",
        available_courses: Optional[List[Course]] = None,
        target_skill_override: Optional[str] = None,
    ) -> LearningRoadmap:
        career = student.career_goal.strip() or "AI Engineer"
        core_skills, sec_skills = self.kb.get_career_skills(career)

        acquired: Set[str] = {
            name for name, prof in student.skills.items() if prof.score >= 65.0
        }

        # Also infer acquired skills from completed courses if available
        if available_courses and student.completed_course_ids:
            completed_set = set(student.completed_course_ids)
            for c in available_courses:
                if c.video_id in completed_set:
                    for topic in c.topics:
                        acquired.add(topic)

        target_skills = (
            [target_skill_override]
            if target_skill_override and self.kb.get_skill(target_skill_override)
            else core_skills
        )

        algo_key = algorithm.strip().upper()
        node_metrics = {}
        alternative_paths: List[List[str]] = []

        if algo_key == "BFS":
            # Combine shortest prerequisite paths for all target skills in level-order
            ordered_unacquired: List[str] = []
            for t_sk in target_skills:
                sub_path = self.search.bfs_shortest_prerequisite_path(acquired, t_sk)
                for sk in sub_path:
                    if sk not in ordered_unacquired and sk not in acquired:
                        ordered_unacquired.append(sk)
            ordered_sequence = [sk for sk in core_skills if sk in acquired] + ordered_unacquired
            algo_label = "BFS (Shortest Prerequisite Path)"
            explanation = (
                f"BFS explored prerequisite layers breadth-first to find the shortest "
                f"{len(ordered_unacquired)}-step learning sequence toward {career}."
            )
        elif algo_key == "DFS":
            alt_paths = self.search.dfs_explore_alternative_paths(
                acquired, target_skills, max_paths=3
            )
            alternative_paths = alt_paths
            chosen = alt_paths[0] if alt_paths else []
            ordered_sequence = [sk for sk in core_skills if sk in acquired] + chosen
            algo_label = "DFS (Alternative Deep Track Exploration)"
            explanation = (
                f"DFS explored {len(alt_paths)} alternative valid prerequisite branches "
                f"by traversing deep specialization chains before switching tracks."
            )
        else:
            # Default: A* Search
            a_star_seq, node_metrics = self.search.a_star_optimal_roadmap(
                student, target_skills
            )
            alternative_paths = self.search.dfs_explore_alternative_paths(
                acquired, target_skills, max_paths=2
            )
            ordered_sequence = [sk for sk in core_skills if sk in acquired] + a_star_seq
            algo_label = "A* Search (Optimal Cost + Heuristic Path)"
            explanation = (
                f"A* Search minimized f(n) = g(n) + h(n) across study duration and "
                f"difficulty transition penalties for {career}."
            )

        # Build LearningNode objects and directed edges
        nodes: List[LearningNode] = []
        edges: List[LearningEdge] = []
        total_hours = 0.0
        total_cost = 0.0
        next_recommended: Optional[str] = None

        for sk_name in ordered_sequence:
            meta = self.kb.get_skill(sk_name)
            if not meta:
                continue
            is_acq = sk_name in acquired
            is_next = False
            if not is_acq and next_recommended is None:
                is_next = True
                next_recommended = sk_name

            m = node_metrics.get(sk_name, {})
            g_val = m.get("g", 0.0 if is_acq else meta.estimated_hours)
            h_val = m.get("h", 0.0)
            f_val = m.get("f", g_val + h_val)

            if not is_acq:
                total_hours += meta.estimated_hours
                total_cost = max(total_cost, g_val)

            matched_courses: List[Course] = []
            if available_courses:
                matched_courses = [
                    c for c in available_courses if sk_name in c.topics
                ][:3]

            nodes.append(
                LearningNode(
                    skill_name=sk_name,
                    category=meta.category,
                    difficulty=meta.difficulty,
                    estimated_hours=meta.estimated_hours,
                    prerequisites=list(meta.prerequisites),
                    is_acquired=is_acq,
                    is_next_recommended=is_next,
                    path_cost_g=round(g_val, 2),
                    heuristic_h=round(h_val, 2),
                    total_cost_f=round(f_val, 2),
                    recommended_courses=matched_courses,
                )
            )

            for prereq in meta.prerequisites:
                if prereq in ordered_sequence:
                    edges.append(
                        LearningEdge(
                            source_skill=prereq,
                            target_skill=sk_name,
                            transition_cost=meta.estimated_hours,
                        )
                    )

        return LearningRoadmap(
            career_goal=career,
            algorithm_used=algo_label,
            ordered_nodes=nodes,
            edges=edges,
            alternative_paths=alternative_paths,
            total_estimated_hours=round(total_hours, 1),
            total_path_cost=round(total_cost, 2),
            next_recommended_skill=next_recommended,
            explanation=explanation,
        )
