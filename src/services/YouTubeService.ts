import { Course, UserProfile, YouTubeSearchResponse, RecommendationWeights } from "../types";
import { RecommendationEngine, UserPreferences, DEFAULT_WEIGHTS } from "../utils/recommender";

/**
 * OOP Class: YouTubeService
 * Client-side service that communicates with the backend YouTube Data API v3 proxy,
 * manages client-side request deduplication and caching, and handles API error states.
 */
export class YouTubeService {
  private cache: Map<string, { timestamp: number; data: YouTubeSearchResponse }> = new Map();
  private readonly cacheTtlMs = 10 * 60 * 1000; // 10 minutes

  public async searchCourses(params: {
    query?: string;
    category?: string;
    skillLevel?: "All" | "Beginner" | "Intermediate" | "Advanced";
    maxResults?: number;
    simulateError?: string;
    forceRefresh?: boolean;
  }): Promise<YouTubeSearchResponse> {
    const cleanQuery = (params.query || "").trim();
    const category = params.category || "All";
    const skillLevel = params.skillLevel || "All";
    const maxResults = params.maxResults || 18;
    const simulateError = params.simulateError || "";

    const cacheKey = `${cleanQuery.toLowerCase()}|${category.toLowerCase()}|${skillLevel.toLowerCase()}|${maxResults}|${simulateError}`;

    if (!params.forceRefresh && !simulateError) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
        return { ...cached.data, cached: true };
      }
    }

    const searchParams = new URLSearchParams();
    if (cleanQuery) searchParams.set("q", cleanQuery);
    if (category && category !== "All") searchParams.set("category", category);
    if (skillLevel && skillLevel !== "All") searchParams.set("level", skillLevel);
    searchParams.set("maxResults", String(maxResults));
    if (simulateError) searchParams.set("simulateError", simulateError);
    if (params.forceRefresh) searchParams.set("refresh", "1");

    try {
      const response = await fetch(`/api/youtube/search?${searchParams.toString()}`);
      const data: YouTubeSearchResponse = await response.json();

      if (!response.ok || data.error) {
        return {
          courses: [],
          count: 0,
          source: data.source || "youtube_data_api_v3",
          error: data.error || `YouTube API request failed (HTTP ${response.status})`,
          errorCode: data.errorCode || "NETWORK_ERROR",
        };
      }

      const validCourses = (data.courses || []).filter(
        (c) => (c.duration_hours || 0) >= 10 / 60
      );
      const filteredData: YouTubeSearchResponse = {
        ...data,
        courses: validCourses,
        count: validCourses.length,
      };

      if (!simulateError && filteredData.courses.length > 0) {
        this.cache.set(cacheKey, { timestamp: Date.now(), data: filteredData });
      }

      return filteredData;
    } catch (err: any) {
      return {
        courses: [],
        count: 0,
        source: "youtube_data_api_v3",
        error:
          err?.message ||
          "Network error while connecting to YouTube course service. Please check your connection and try again.",
        errorCode: "NETWORK_ERROR",
      };
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

/**
 * OOP Class: CourseController
 * Connects the UI with YouTubeService, UserPreferences, and RecommendationEngine.
 */
export class CourseController {
  private youtubeService: YouTubeService;
  private recommendationEngine: RecommendationEngine;

  constructor(weights: RecommendationWeights = DEFAULT_WEIGHTS) {
    this.youtubeService = new YouTubeService();
    this.recommendationEngine = new RecommendationEngine(weights);
  }

  public updateWeights(weights: RecommendationWeights): void {
    this.recommendationEngine.setWeights(weights);
  }

  public async fetchPersonalizedCatalog(
    profile: UserProfile,
    forceRefresh: boolean = false
  ): Promise<YouTubeSearchResponse> {
    const prefs = new UserPreferences(profile);
    const profileQueries = prefs.buildProfileSearchQueries();
    const queriesToRun = profileQueries.length > 0 ? profileQueries : [prefs.buildSearchQuery()];

    const responses = await Promise.all(
      queriesToRun.map((q, idx) =>
        this.youtubeService.searchCourses({
          query: q,
          skillLevel: prefs.preferredDifficulty,
          maxResults: idx === 0 ? 14 : 10,
          forceRefresh,
        })
      )
    );

    const validResponses = responses.filter((r) => !r.error && r.courses && r.courses.length > 0);
    if (validResponses.length === 0) {
      const firstErr = responses.find((r) => r.error);
      return (
        firstErr || {
          courses: [],
          count: 0,
          source: "youtube_data_api_v3",
          error: "No relevant courses found. Try adjusting your profile interests or skills.",
        }
      );
    }

    // Deduplicate courses by video_id / course_id while preserving order across profile facets
    const seenIds = new Set<string>();
    const mergedCourses: Course[] = [];
    for (const res of validResponses) {
      for (const course of res.courses) {
        const key = course.video_id || course.course_id;
        if (key && !seenIds.has(key)) {
          seenIds.add(key);
          mergedCourses.push(course);
        }
      }
    }

    const ranked = this.recommendationEngine.rankCourses(profile, mergedCourses, 24);
    return {
      ...validResponses[0],
      courses: ranked,
      count: ranked.length,
    };
  }

  public async searchByTopicAndFilters(
    profile: UserProfile,
    options: {
      query?: string;
      category?: string;
      skillLevel?: "All" | "Beginner" | "Intermediate" | "Advanced";
      simulateError?: string;
      forceRefresh?: boolean;
    }
  ): Promise<YouTubeSearchResponse> {
    const response = await this.youtubeService.searchCourses({
      query: options.query,
      category: options.category,
      skillLevel: options.skillLevel,
      maxResults: 18,
      simulateError: options.simulateError,
      forceRefresh: options.forceRefresh,
    });

    if (response.error) {
      return response;
    }

    const ranked = this.recommendationEngine.rankCourses(
      profile,
      response.courses,
      18,
      options.query
    );

    return {
      ...response,
      courses: ranked,
      count: ranked.length,
    };
  }
}

export const defaultCourseController = new CourseController();
