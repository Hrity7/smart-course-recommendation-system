import { Course } from "../types";

/**
 * All hardcoded demo courses have been completely removed.
 * Courses are retrieved dynamically from YouTube via YouTubeService.
 */
export const INITIAL_COURSES: Course[] = [];

/**
 * Helper to detect and purge any legacy demo courses stored in localStorage.
 */
export function isLegacyDemoCourse(courseOrId: Course | string | undefined | null): boolean {
  if (!courseOrId) return true;
  if (typeof courseOrId === "string") {
    return courseOrId.startsWith("CRS-");
  }
  return (
    courseOrId.course_id.startsWith("CRS-") ||
    courseOrId.course_url.includes("demo.courses.edu") ||
    !courseOrId.course_url.includes("youtube.com/watch?v=")
  );
}
