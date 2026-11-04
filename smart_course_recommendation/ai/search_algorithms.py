"""
Module 1: Problem Solving Methodologies - Search Algorithms.
Implements:
1. Breadth-First Search (BFS): Finds the shortest prerequisite learning path (minimum hops).
2. Depth-First Search (DFS): Explores alternative prerequisite learning paths.
3. A* Search: Finds the cost-optimal learning path using actual path cost g(n) + admissible heuristic h(n).
4. Heuristic Search: Ranks candidate courses based on learner suitability and career alignment.
"""

from collections import deque
import heapq
from typing import Dict, List, Optional, Set, Tuple

from models.course import Course
from models.student import Student
from .knowledge_base import KnowledgeBase


class SearchAlgorithms:
    """
    Implements uninformed (BFS, DFS) and informed (A*, Heuristic Search) graph search
    algorithms over the skill prerequisite Knowledge Graph.
    """

    def __init__(self, knowledge_base: KnowledgeBase) -> None:
        self.kb = knowledge_base

    def bfs_shortest_prerequisite_path(
        self, acquired_skills: Set[str], target_skill: str
    ) -> List[str]:
        """
        Breadth-First Search (BFS):
        Finds the shortest sequence of prerequisite skills leading to `target_skill`.
        Also guarantees all required dependencies for `target_skill` are ordered level-by-level.
        """
        if not self.kb.get_skill(target_skill):
            return []

        if target_skill in acquired_skills:
            return [target_skill]

        # 1. If a direct shortest chain from any acquired skill (or root skill) to target_skill is requested:
        # We perform level-order BFS traversal from roots/acquired skills toward target_skill.
        ancestors = self.kb.get_all_ancestors(target_skill)
        relevant_nodes = (ancestors | {target_skill}) - acquired_skills
        if not relevant_nodes:
            return [target_skill]

        # Build in-degree map for topological BFS (Kahn's level-order BFS guarantees shortest prerequisite layers)
        in_degree: Dict[str, int] = {node: 0 for node in relevant_nodes}
        adj: Dict[str, List[str]] = {node: [] for node in relevant_nodes}

        for node in relevant_nodes:
            for prereq in self.kb.get_prerequisites(node):
                if prereq in relevant_nodes:
                    adj[prereq].append(node)
                    in_degree[node] += 1

        queue: deque[str] = deque(
            sorted([n for n, deg in in_degree.items() if deg == 0])
        )
        bfs_order: List[str] = []

        while queue:
            current = queue.popleft()
            bfs_order.append(current)
            for neighbor in sorted(adj.get(current, [])):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        return bfs_order

    def bfs_shortest_chain_between(
        self, start_skill: str, goal_skill: str
    ) -> List[str]:
        """
        Classic state-space BFS finding the minimum-edge path from `start_skill` to `goal_skill`
        in the prerequisite dependency graph.
        """
        if start_skill == goal_skill:
            return [start_skill]

        queue: deque[List[str]] = deque([[start_skill]])
        visited: Set[str] = {start_skill}

        while queue:
            path = queue.popleft()
            current = path[-1]
            for next_skill in self.kb.get_dependents(current):
                if next_skill == goal_skill:
                    return path + [next_skill]
                if next_skill not in visited:
                    visited.add(next_skill)
                    queue.append(path + [next_skill])
        return []

    def dfs_explore_alternative_paths(
        self, acquired_skills: Set[str], target_skills: List[str], max_paths: int = 3
    ) -> List[List[str]]:
        """
        Depth-First Search (DFS):
        Explores alternative valid topological orderings / deep specialization tracks
        for acquiring the required target skills.
        """
        needed: Set[str] = set()
        for t in target_skills:
            if self.kb.get_skill(t) and t not in acquired_skills:
                needed.add(t)
                needed.update(self.kb.get_all_ancestors(t) - acquired_skills)

        if not needed:
            return [target_skills[:]] if target_skills else []

        results: List[List[str]] = []

        def _dfs(current_path: List[str], completed: Set[str]) -> None:
            if len(results) >= max_paths:
                return
            if len(current_path) == len(needed):
                results.append(list(current_path))
                return

            # Find all currently unlocked skills whose prerequisites are satisfied
            available = [
                sk
                for sk in sorted(needed)
                if sk not in completed
                and all(
                    (p in acquired_skills or p in completed or p not in needed)
                    for p in self.kb.get_prerequisites(sk)
                )
            ]

            # Explore branches in depth-first manner
            for candidate in available:
                current_path.append(candidate)
                completed.add(candidate)
                _dfs(current_path, completed)
                completed.remove(candidate)
                current_path.pop()
                if len(results) >= max_paths:
                    return

        _dfs([], set())
        return results

    def a_star_optimal_roadmap(
        self,
        student: Student,
        target_skills: List[str],
    ) -> Tuple[List[str], Dict[str, Dict[str, float]]]:
        """
        A* Search Algorithm:
        Finds the optimal learning sequence minimizing f(n) = g(n) + h(n), where:
        - g(n): Actual cumulative cost (estimated study hours adjusted by student's existing partial skill
          and difficulty transition cost).
        - h(n): Admissible heuristic estimating remaining hours required for unlocked target career skills.

        Returns:
            (ordered_skill_list, node_metrics_map)
            where node_metrics_map[skill] = {"g": g_cost, "h": h_cost, "f": f_cost}
        """
        acquired = {
            name for name, prof in student.skills.items() if prof.score >= 65.0
        }
        needed: Set[str] = set()
        for t in target_skills:
            if self.kb.get_skill(t) and t not in acquired:
                needed.add(t)
                needed.update(self.kb.get_all_ancestors(t) - acquired)

        if not needed:
            return [], {}

        def step_cost(skill_name: str) -> float:
            meta = self.kb.get_skill(skill_name)
            if not meta:
                return 10.0
            existing_pct = student.get_skill_score(skill_name) / 100.0
            remaining_hours = meta.estimated_hours * max(0.2, 1.0 - existing_pct)
            diff_penalty = {"Beginner": 1.0, "Intermediate": 1.15, "Advanced": 1.3}.get(
                meta.difficulty, 1.0
            )
            return round(remaining_hours * diff_penalty, 2)

        def heuristic(completed_subset: frozenset[str]) -> float:
            # Admissible lower bound: sum of minimum base hours for remaining required skills
            rem = needed - completed_subset
            total_h = 0.0
            for sk in rem:
                meta = self.kb.get_skill(sk)
                base_h = meta.estimated_hours * 0.2 if meta else 2.0
                total_h += base_h
            return round(total_h, 2)

        initial_state = frozenset()
        initial_h = heuristic(initial_state)
        # Priority queue items: (f_cost, g_cost, tie_breaker, ordered_tuple, frozenset_state)
        open_heap: List[Tuple[float, float, int, Tuple[str, ...], frozenset[str]]] = [
            (initial_h, 0.0, 0, (), initial_state)
        ]
        best_g: Dict[frozenset[str], float] = {initial_state: 0.0}
        counter = 0

        best_sequence: List[str] = []
        while open_heap:
            f_val, g_val, _, seq, state = heapq.heappop(open_heap)

            if state == needed:
                best_sequence = list(seq)
                break

            if g_val > best_g.get(state, float("inf")):
                continue

            # Expand valid next skills whose prerequisites are satisfied
            unlocked = [
                sk
                for sk in sorted(needed)
                if sk not in state
                and all(
                    (p in acquired or p in state or p not in needed)
                    for p in self.kb.get_prerequisites(sk)
                )
            ]

            for next_sk in unlocked:
                next_state = state | {next_sk}
                new_g = round(g_val + step_cost(next_sk), 2)
                if new_g < best_g.get(next_state, float("inf")):
                    best_g[next_state] = new_g
                    h_val = heuristic(next_state)
                    new_f = round(new_g + h_val, 2)
                    counter += 1
                    heapq.heappush(
                        open_heap,
                        (new_f, new_g, counter, seq + (next_sk,), next_state),
                    )

        # Compute per-node g, h, f trace along the optimal path
        metrics: Dict[str, Dict[str, float]] = {}
        running_g = 0.0
        visited_set: Set[str] = set()
        for sk in best_sequence:
            c = step_cost(sk)
            running_g = round(running_g + c, 2)
            visited_set.add(sk)
            h_rem = heuristic(frozenset(visited_set))
            metrics[sk] = {
                "g": running_g,
                "h": h_rem,
                "f": round(running_g + h_rem, 2),
                "step_cost": c,
            }

        return best_sequence, metrics

    def heuristic_course_rank(
        self, student: Student, courses: List[Course]
    ) -> List[Tuple[Course, float]]:
        """
        Heuristic Search Ranking:
        Evaluates candidate courses using an informed evaluation function h_suitability(c)
        combining career core-skill coverage, prerequisite readiness, and duration fit.
        """
        core_skills, secondary_skills = self.kb.get_career_skills(
            student.career_goal or "AI Engineer"
        )
        missing_core = {sk for sk in core_skills if not student.has_skill(sk, 65.0)}
        missing_sec = {sk for sk in secondary_skills if not student.has_skill(sk, 65.0)}

        scored: List[Tuple[Course, float]] = []
        for course in courses:
            # 1. Core career gap coverage
            core_hits = sum(1 for t in course.topics if t in missing_core)
            sec_hits = sum(1 for t in course.topics if t in missing_sec)
            career_val = min(1.0, core_hits * 0.5 + sec_hits * 0.25)

            # 2. Prerequisite readiness
            if not course.prerequisites:
                prereq_val = 1.0
            else:
                satisfied = sum(
                    1 for p in course.prerequisites if student.has_skill(p, 35.0)
                )
                prereq_val = satisfied / len(course.prerequisites)

            # 3. Duration proximity to student's preferred session length
            pref_hours = max(0.5, student.preferences.preferred_duration_hours)
            if course.duration_hours > 0:
                diff_ratio = abs(course.duration_hours - pref_hours) / max(
                    pref_hours, course.duration_hours, 1.0
                )
                duration_val = max(0.2, 1.0 - diff_ratio * 0.6)
            else:
                duration_val = 0.5

            h_score = round(
                0.50 * career_val + 0.30 * prereq_val + 0.20 * duration_val, 4
            )
            scored.append((course, h_score))

        scored.sort(key=lambda item: item[1], reverse=True)
        return scored
