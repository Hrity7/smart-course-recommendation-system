import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { Course } from "./src/types";
import { CourseModel } from "./src/utils/recommender";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

/**
 * Dedicated Configuration Handler for the Gemini API Key & Model.
 * Retrieves the key from environment variables (GEMINI_API_KEY, GOOGLE_API_KEY, API_KEY),
 * reloads .env if needed, strips surrounding quotes/whitespace, and validates format
 * before initiating any AI Advisor requests.
 */
class GeminiConfigHandler {
  private static readonly ENV_CANDIDATES = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "API_KEY"] as const;
  private static readonly PLACEHOLDERS = new Set([
    "",
    "your_gemini_api_key",
    "my_gemini_api_key",
    "your_api_key",
    "your_google_api_key",
    "insert_gemini_api_key_here",
    "replace_me",
    "none",
    "null",
    "undefined",
  ]);
  private static readonly KEY_PATTERN = /^[A-Za-z0-9_-]{20,}$/;
  private cachedClient: GoogleGenAI | null = null;
  private cachedKey: string = "";

  public sanitizeKey(raw?: string): string {
    if (!raw || typeof raw !== "string") return "";
    return raw.trim().replace(/^["']|["']$/g, "").trim();
  }

  public resolveFromEnvironment(): { apiKey: string; source: string } {
    dotenv.config({ override: false });
    for (const envName of GeminiConfigHandler.ENV_CANDIDATES) {
      const cleaned = this.sanitizeKey(process.env[envName]);
      if (cleaned) {
        return { apiKey: cleaned, source: envName };
      }
    }
    return { apiKey: "", source: "missing" };
  }

  public validate(): {
    isValid: boolean;
    apiKey: string;
    source: string;
    model: string;
    reason: string;
  } {
    const { apiKey, source } = this.resolveFromEnvironment();
    const rawModel = this.sanitizeKey(process.env.GEMINI_MODEL) || "gemini-3.8-flash";
    const model =
      rawModel.startsWith("gemini-1.5") || rawModel.startsWith("gemini-2.0")
        ? "gemini-3.8-flash"
        : rawModel;

    if (!apiKey) {
      return {
        isValid: false,
        apiKey: "",
        source,
        model,
        reason: "GEMINI_API_KEY is not set in environment variables.",
      };
    }

    if (GeminiConfigHandler.PLACEHOLDERS.has(apiKey.toLowerCase())) {
      return {
        isValid: false,
        apiKey: "",
        source,
        model,
        reason: "GEMINI_API_KEY contains a placeholder value.",
      };
    }

    if (!GeminiConfigHandler.KEY_PATTERN.test(apiKey)) {
      return {
        isValid: false,
        apiKey: "",
        source,
        model,
        reason: "GEMINI_API_KEY format is invalid.",
      };
    }

    return {
      isValid: true,
      apiKey,
      source,
      model,
      reason: "Valid Gemini API key.",
    };
  }

  public getValidatedClient(): GoogleGenAI | null {
    const validation = this.validate();
    if (!validation.isValid) {
      this.cachedClient = null;
      this.cachedKey = "";
      return null;
    }

    if (!this.cachedClient || this.cachedKey !== validation.apiKey) {
      this.cachedClient = new GoogleGenAI({
        apiKey: validation.apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      this.cachedKey = validation.apiKey;
    }

    return this.cachedClient;
  }
}

const geminiConfigHandler = new GeminiConfigHandler();

function getGeminiClient(): GoogleGenAI | null {
  return geminiConfigHandler.getValidatedClient();
}

app.get("/api/gemini/status", (_req, res) => {
  const status = geminiConfigHandler.validate();
  res.json({
    configured: status.isValid,
    source: status.source,
    model: status.model,
    reason: status.reason,
  });
});

class YouTubeApiError extends Error {
  public readonly code: "INVALID_API_KEY" | "QUOTA_EXCEEDED" | "NETWORK_ERROR" | "VALIDATION_ERROR";
  public readonly statusCode: number;

  constructor(
    message: string,
    code: "INVALID_API_KEY" | "QUOTA_EXCEEDED" | "NETWORK_ERROR" | "VALIDATION_ERROR",
    statusCode: number = 500
  ) {
    super(message);
    this.name = "YouTubeApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * OOP Class: ServerYouTubeService
 * Handles official YouTube Data API v3 requests (Search & Videos endpoints)
 * with live YouTube retrieval support, response validation, duration/view parsing,
 * unrelated topic filtering, and TTL caching.
 */
class ServerYouTubeService {
  private cache = new Map<
    string,
    { timestamp: number; courses: Course[]; source: "youtube_data_api_v3" | "youtube_live_search" }
  >();
  private readonly cacheTtlMs = 15 * 60 * 1000; // 15 minutes

  public getApiKey(): string {
    const key = (process.env.YOUTUBE_API_KEY || "").trim();
    if (!key || key === "YOUR_YOUTUBE_DATA_API_V3_KEY" || key === "MY_YOUTUBE_API_KEY") {
      return "";
    }
    return key;
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Parses ISO 8601 duration (e.g., PT2H14M35S) into human-readable string and hours float.
   */
  public parseIsoDuration(iso: string | undefined): { formatted: string; hours: number } {
    if (!iso || typeof iso !== "string") {
      return { formatted: "Duration unavailable", hours: 0 };
    }
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) {
      return { formatted: "Duration unavailable", hours: 0 };
    }
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);

    const totalHours = Number((hours + minutes / 60 + seconds / 3600).toFixed(3));
    if (hours > 0) {
      return {
        formatted: minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`,
        hours: totalHours,
      };
    }
    if (minutes > 0) {
      return {
        formatted: `${minutes}m`,
        hours: totalHours,
      };
    }
    return {
      formatted: `${seconds}s`,
      hours: totalHours,
    };
  }

  /**
   * Parses "HH:MM:SS" or "MM:SS" duration string into formatted label and hours float.
   */
  public parseClockDuration(clock: string | undefined): { formatted: string; hours: number } {
    if (!clock || typeof clock !== "string") {
      return { formatted: "Duration unavailable", hours: 0 };
    }
    const parts = clock.trim().split(":").map((n) => parseInt(n, 10));
    if (parts.some((n) => isNaN(n))) {
      return { formatted: clock, hours: 0 };
    }
    if (parts.length === 3) {
      const [h, m, s] = parts;
      const totalHours = Number((h + m / 60 + s / 3600).toFixed(3));
      return {
        formatted: m > 0 ? `${h}h ${m}m` : `${h}h`,
        hours: totalHours,
      };
    }
    if (parts.length === 2) {
      const [m, s] = parts;
      const totalHours = Number((m / 60 + s / 3600).toFixed(3));
      return {
        formatted: `${m}m`,
        hours: totalHours,
      };
    }
    return { formatted: clock, hours: 0 };
  }

  public parseViewCountText(viewText: string | undefined): number {
    if (!viewText || typeof viewText !== "string") return 0;
    const digits = viewText.replace(/[^0-9]/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  /**
   * Checks if the user's search query is clearly unrelated to educational/technical learning
   * or is gibberish, so we don't return random videos for unrelated queries.
   */
  public isUnrelatedSearchQuery(rawQuery: string): boolean {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return false;

    // Gibberish check (long consonant clusters or random characters with no vowels)
    const alphaOnly = q.replace(/[^a-z]/g, "");
    if (alphaOnly.length >= 7 && !/[aeiouy]/.test(alphaOnly)) {
      return true;
    }
    if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(alphaOnly)) {
      return true;
    }

    // Explicitly unrelated non-educational entertainment/lifestyle queries
    const unrelatedKeywords = [
      "cat prank",
      "dog compilation",
      "mukbang",
      "celebrity gossip",
      "fortnite montage",
      "minecraft survival let's play",
      "tiktok dance",
      "makeup haul",
      "horoscope reading",
      "ufo sighting",
      "funny fails",
      "pizza recipe",
      "baking sourdough",
      "knitting sweater",
      "gossip drama",
      "unboxing iphone prank",
    ];
    if (unrelatedKeywords.some((kw) => q.includes(kw))) {
      return true;
    }

    return false;
  }

  /**
   * Validates that a retrieved YouTube video is a genuine educational course/tutorial
   * and matches the user's topic query.
   */
  public isRelevantEducationalVideo(
    title: string,
    description: string,
    durationHours: number,
    rawQuery: string
  ): boolean {
    const combined = `${title} ${description}`.toLowerCase();

    // Ignore any video which is under 10 minutes (< 10/60 hours)
    if (!durationHours || durationHours < 10 / 60) {
      return false;
    }

    if (
      /\b(official music video|lyric video|movie trailer|prank|mukbang|tiktok compilation|funny moments|gameplay walkthrough|unboxing)\b/i.test(
        combined
      )
    ) {
      return false;
    }

    // Require educational signal in title or description
    const hasEducationalSignal =
      /\b(course|tutorial|learn|programming|developer|development|engineering|science|bootcamp|lecture|training|guide|crash course|for beginners|full course|masterclass|explained|fundamentals|introduction|architecture|algorithms|data|ai|machine learning|code|coding|software|web|java|python|javascript|sql|cloud|cybersecurity|devops|math|statistics)\b/i.test(
        combined
      );

    if (!hasEducationalSignal) {
      return false;
    }

    // Verify topical overlap with user's raw search query if provided
    if (rawQuery && rawQuery.trim().length > 0) {
      const stopWords = new Set([
        "course",
        "courses",
        "tutorial",
        "tutorials",
        "full",
        "for",
        "beginners",
        "beginner",
        "intermediate",
        "advanced",
        "learn",
        "learning",
        "the",
        "and",
        "in",
        "to",
        "of",
        "with",
        "how",
        "online",
        "free",
        "video",
        "videos",
        "class",
      ]);
      const queryTokens = (rawQuery.toLowerCase().match(/\b[a-z0-9+#.-]{2,}\b/g) || []).filter(
        (t) => !stopWords.has(t)
      );

      if (queryTokens.length > 0) {
        const hasMatch = queryTokens.some((token) => combined.includes(token));
        if (!hasMatch) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Builds a validated Course object from raw YouTube video metadata.
   */
  private mapToCourse(params: {
    videoId: string;
    title: string;
    channelTitle: string;
    description: string;
    durationFormatted: string;
    durationHours: number;
    viewCount: number;
    publishedAt: string;
    thumbnailUrl: string;
    queryHint?: string;
    levelHint?: "Beginner" | "Intermediate" | "Advanced";
  }): Course | null {
    const cleanId = (params.videoId || "").trim();
    if (!CourseModel.isValidVideoId(cleanId)) {
      return null;
    }

    const title = (params.title || "").trim();
    if (!title) return null;

    const channelTitle = (params.channelTitle || "YouTube Educator").trim();
    const description =
      (params.description || "").trim() ||
      `Educational video course "${title}" published by ${channelTitle} on YouTube.`;

    const category = CourseModel.inferCategory(title, description, params.queryHint);
    const difficulty = CourseModel.inferDifficulty(
      title,
      description,
      params.levelHint || "Beginner"
    );
    const skills = CourseModel.extractSkills(title, description, category);
    const formattedViews = CourseModel.formatViews(params.viewCount);
    const rating = 0;

    const thumbnailUrl =
      params.thumbnailUrl || `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;

    return {
      course_id: cleanId,
      video_id: cleanId,
      title,
      platform: "YouTube",
      channel_title: channelTitle,
      instructor: channelTitle,
      category,
      description,
      skills,
      difficulty,
      duration: params.durationFormatted || "Duration unavailable",
      duration_hours: params.durationHours || 1.5,
      rating,
      num_reviews: params.viewCount || 0,
      view_count: params.viewCount || 0,
      formatted_views: formattedViews,
      published_at: params.publishedAt || "Publication date unavailable",
      thumbnail_url: thumbnailUrl,
      course_url: `https://www.youtube.com/watch?v=${cleanId}`,
      embed_url: `https://www.youtube.com/embed/${cleanId}`,
      language: "English",
      certificate: "YouTube Course",
      career_outcomes: `${category} Specialist, Software Engineer`,
    };
  }

  /**
   * 1. Official YouTube Data API v3 retrieval (Search + Videos endpoints)
   */
  public async fetchFromYouTubeDataApiV3(
    searchQuery: string,
    rawUserQuery: string,
    maxResults: number,
    apiKey: string,
    levelHint?: "Beginner" | "Intermediate" | "Advanced"
  ): Promise<Course[]> {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("videoEmbeddable", "true");
    searchUrl.searchParams.set("relevanceLanguage", "en");
    searchUrl.searchParams.set("maxResults", String(Math.min(25, Math.max(5, maxResults))));
    searchUrl.searchParams.set("q", searchQuery);
    searchUrl.searchParams.set("key", apiKey);

    let searchRes: Response;
    try {
      searchRes = await fetch(searchUrl.toString());
    } catch (err: any) {
      throw new YouTubeApiError(
        "Network failure while connecting to YouTube Data API v3.",
        "NETWORK_ERROR",
        503
      );
    }

    const searchJson: any = await searchRes.json().catch(() => ({}));

    if (!searchRes.ok) {
      const errReason = searchJson?.error?.errors?.[0]?.reason || "";
      const errMsg = searchJson?.error?.message || "";

      if (
        searchRes.status === 400 ||
        errReason === "keyInvalid" ||
        errReason === "badRequest" ||
        errMsg.toLowerCase().includes("api key not valid")
      ) {
        throw new YouTubeApiError(
          "Invalid YouTube Data API v3 key. Please verify YOUTUBE_API_KEY in your .env configuration.",
          "INVALID_API_KEY",
          400
        );
      }

      if (
        searchRes.status === 403 ||
        errReason === "quotaExceeded" ||
        errReason === "dailyLimitExceeded" ||
        errMsg.toLowerCase().includes("quota")
      ) {
        throw new YouTubeApiError(
          "YouTube Data API v3 daily quota limit has been reached. Please wait for quota reset or check your Google Cloud quota settings.",
          "QUOTA_EXCEEDED",
          429
        );
      }

      throw new YouTubeApiError(
        errMsg || `YouTube Data API v3 returned HTTP ${searchRes.status}`,
        "NETWORK_ERROR",
        searchRes.status
      );
    }

    const items = Array.isArray(searchJson?.items) ? searchJson.items : [];
    const videoIds: string[] = items
      .map((item: any) => item?.id?.videoId)
      .filter((id: any): id is string => CourseModel.isValidVideoId(id));

    if (videoIds.length === 0) {
      return [];
    }

    // Call Videos endpoint to get contentDetails (duration) and statistics (viewCount)
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "snippet,contentDetails,statistics");
    videosUrl.searchParams.set("id", videoIds.join(","));
    videosUrl.searchParams.set("key", apiKey);

    const videosRes = await fetch(videosUrl.toString());
    const videosJson: any = await videosRes.json().catch(() => ({}));

    if (!videosRes.ok) {
      throw new YouTubeApiError(
        videosJson?.error?.message || "Failed to fetch video details from YouTube Data API v3.",
        "NETWORK_ERROR",
        videosRes.status
      );
    }

    const videoItems = Array.isArray(videosJson?.items) ? videosJson.items : [];
    const courses: Course[] = [];

    for (const v of videoItems) {
      const videoId = v?.id;
      const snippet = v?.snippet || {};
      const contentDetails = v?.contentDetails || {};
      const statistics = v?.statistics || {};

      const { formatted: durationFormatted, hours: durationHours } = this.parseIsoDuration(
        contentDetails.duration
      );
      const title = snippet.title || "";
      const description = snippet.description || "";

      if (!this.isRelevantEducationalVideo(title, description, durationHours, rawUserQuery)) {
        continue;
      }

      const publishedDate = snippet.publishedAt
        ? new Date(snippet.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Publication date unavailable";

      const thumbnailUrl =
        snippet?.thumbnails?.high?.url ||
        snippet?.thumbnails?.medium?.url ||
        snippet?.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const viewCount = parseInt(statistics.viewCount || "0", 10) || 0;

      const course = this.mapToCourse({
        videoId,
        title,
        channelTitle: snippet.channelTitle || "YouTube Educator",
        description,
        durationFormatted,
        durationHours,
        viewCount,
        publishedAt: publishedDate,
        thumbnailUrl,
        queryHint: rawUserQuery,
        levelHint,
      });

      if (course) {
        courses.push(course);
      }
    }

    return courses;
  }

  /**
   * 2. Live YouTube Direct Search Retrieval (used when YOUTUBE_API_KEY is not configured in .env)
   * Queries YouTube's live search endpoint directly and extracts genuine YouTube videos.
   */
  public async fetchFromYouTubeLiveSearch(
    searchQuery: string,
    rawUserQuery: string,
    maxResults: number,
    levelHint?: "Beginner" | "Intermediate" | "Advanced"
  ): Promise<Course[]> {
    let response: Response;
    try {
      response = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20240726.00.00",
              hl: "en",
              gl: "US",
            },
          },
          query: searchQuery,
        }),
      });
    } catch (err: any) {
      throw new YouTubeApiError(
        "Network failure while connecting to YouTube search service.",
        "NETWORK_ERROR",
        503
      );
    }

    if (!response.ok) {
      throw new YouTubeApiError(
        `YouTube search returned HTTP ${response.status}`,
        "NETWORK_ERROR",
        response.status
      );
    }

    const data: any = await response.json();
    const sections =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
        ?.contents || [];

    const courses: Course[] = [];
    const seenIds = new Set<string>();

    for (const section of sections) {
      const items = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const v = item?.videoRenderer;
        if (!v) continue;

        const videoId = v.videoId;
        if (!CourseModel.isValidVideoId(videoId) || seenIds.has(videoId)) {
          continue;
        }

        const title = v.title?.runs?.map((r: any) => r.text).join("") || "";
        const channelTitle =
          v.ownerText?.runs?.[0]?.text ||
          v.longBylineText?.runs?.[0]?.text ||
          "YouTube Educator";
        const durationClock = v.lengthText?.simpleText || "";
        // Skip livestreams without duration or very short clips
        if (!durationClock) continue;

        const { formatted: durationFormatted, hours: durationHours } =
          this.parseClockDuration(durationClock);

        const descRuns =
          v.detailedMetadataSnippets?.[0]?.snippetText?.runs ||
          v.descriptionSnippet?.runs ||
          [];
        const description = descRuns.map((r: any) => r.text).join("").trim();

        if (!this.isRelevantEducationalVideo(title, description, durationHours, rawUserQuery)) {
          continue;
        }

        const viewText = v.viewCountText?.simpleText || v.shortViewCountText?.simpleText || "";
        const viewCount = this.parseViewCountText(viewText);
        const publishedAt = v.publishedTimeText?.simpleText || "Published on YouTube";
        const thumbnails = v.thumbnail?.thumbnails || [];
        const bestThumb =
          thumbnails[thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        const course = this.mapToCourse({
          videoId,
          title,
          channelTitle,
          description,
          durationFormatted,
          durationHours,
          viewCount,
          publishedAt,
          thumbnailUrl: bestThumb,
          queryHint: rawUserQuery,
          levelHint,
        });

        if (course) {
          seenIds.add(videoId);
          courses.push(course);
          if (courses.length >= maxResults) break;
        }
      }
      if (courses.length >= maxResults) break;
    }

    return courses;
  }

  /**
   * Unified search method with caching, error simulation for testing, and validation.
   */
  public async searchEducationalVideos(options: {
    query?: string;
    category?: string;
    skillLevel?: string;
    maxResults?: number;
    simulateError?: string;
    forceRefresh?: boolean;
  }): Promise<{
    courses: Course[];
    source: "youtube_data_api_v3" | "youtube_live_search";
    cached: boolean;
    effectiveQuery: string;
  }> {
    // Support explicit diagnostic error testing (Scenarios 7 & 8)
    if (options.simulateError === "INVALID_API_KEY") {
      // Perform a real call to YouTube Data API v3 with an invalid key to verify error handling
      await this.fetchFromYouTubeDataApiV3(
        "Python course",
        "Python",
        5,
        "INVALID_KEY_FOR_TESTING_12345"
      );
    }
    if (options.simulateError === "QUOTA_EXCEEDED") {
      throw new YouTubeApiError(
        "YouTube Data API v3 daily quota limit has been exhausted (HTTP 403 quotaExceeded). Please wait for quota reset or check your Google Cloud Console quota settings.",
        "QUOTA_EXCEEDED",
        429
      );
    }
    if (options.simulateError === "NETWORK_ERROR") {
      throw new YouTubeApiError(
        "Network failure while communicating with YouTube Data API v3 endpoints.",
        "NETWORK_ERROR",
        503
      );
    }

    const rawQuery = (options.query || "").trim();
    const category = (options.category || "").trim();
    const skillLevel = (options.skillLevel || "").trim();
    const maxResults = Math.min(24, Math.max(6, options.maxResults || 15));

    // Check if the user entered an unrelated or gibberish query (Scenario 6)
    if (rawQuery && this.isUnrelatedSearchQuery(rawQuery)) {
      return {
        courses: [],
        source: this.getApiKey() ? "youtube_data_api_v3" : "youtube_live_search",
        cached: false,
        effectiveQuery: rawQuery,
      };
    }

    // Build effective educational YouTube search query
    const queryParts: string[] = [];
    if (rawQuery) {
      queryParts.push(rawQuery);
    } else if (category && category !== "All") {
      queryParts.push(category);
    } else {
      queryParts.push("Python Computer Science Data Science");
    }

    if (
      skillLevel &&
      skillLevel !== "All" &&
      !rawQuery.toLowerCase().includes(skillLevel.toLowerCase())
    ) {
      queryParts.push(`for ${skillLevel.toLowerCase()}s`);
    }

    const combinedLower = queryParts.join(" ").toLowerCase();
    if (!combinedLower.includes("course") && !combinedLower.includes("tutorial")) {
      queryParts.push("full course tutorial");
    }

    const effectiveQuery = queryParts.join(" ").replace(/\s+/g, " ").trim();
    const cacheKey = `${effectiveQuery.toLowerCase()}|${category.toLowerCase()}|${skillLevel.toLowerCase()}|${maxResults}`;

    if (!options.forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
        return {
          courses: cached.courses,
          source: cached.source,
          cached: true,
          effectiveQuery,
        };
      }
    }

    const levelHint =
      skillLevel === "Beginner" || skillLevel === "Intermediate" || skillLevel === "Advanced"
        ? skillLevel
        : undefined;

    const apiKey = this.getApiKey();
    let courses: Course[] = [];
    let source: "youtube_data_api_v3" | "youtube_live_search" = "youtube_data_api_v3";

    if (apiKey) {
      try {
        courses = await this.fetchFromYouTubeDataApiV3(
          effectiveQuery,
          rawQuery || category,
          maxResults,
          apiKey,
          levelHint
        );
        source = "youtube_data_api_v3";
      } catch (apiErr) {
        if (options.simulateError) {
          throw apiErr;
        }
        // Fallback to live YouTube direct search if API key quota is exceeded or restricted
        courses = await this.fetchFromYouTubeLiveSearch(
          effectiveQuery,
          rawQuery || category,
          maxResults,
          levelHint
        );
        source = "youtube_live_search";
      }

      if (courses.length === 0 && !options.simulateError) {
        courses = await this.fetchFromYouTubeLiveSearch(
          effectiveQuery,
          rawQuery || category,
          maxResults,
          levelHint
        );
        if (courses.length > 0) {
          source = "youtube_live_search";
        }
      }
    } else {
      courses = await this.fetchFromYouTubeLiveSearch(
        effectiveQuery,
        rawQuery || category,
        maxResults,
        levelHint
      );
      source = "youtube_live_search";
    }

    if (courses.length > 0) {
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        courses,
        source,
      });
    }

    return {
      courses,
      source,
      cached: false,
      effectiveQuery,
    };
  }
}

const youtubeService = new ServerYouTubeService();

// 1. YouTube Search & Recommendation Endpoint (supports both /api/youtube/search and /api/youtube/courses)
const handleYouTubeSearchRequest: express.RequestHandler = async (req, res) => {
  try {
    const query =
      typeof req.query.q === "string"
        ? req.query.q
        : typeof req.query.query === "string"
        ? req.query.query
        : "";
    const category = typeof req.query.category === "string" ? req.query.category : "All";
    const skillLevel =
      typeof req.query.level === "string"
        ? req.query.level
        : typeof req.query.skillLevel === "string"
        ? req.query.skillLevel
        : "All";
    const maxResults = parseInt(String(req.query.maxResults || "18"), 10) || 18;
    const simulateError = typeof req.query.simulateError === "string" ? req.query.simulateError : "";
    const forceRefresh = req.query.refresh === "1";

    const result = await youtubeService.searchEducationalVideos({
      query,
      category,
      skillLevel,
      maxResults,
      simulateError,
      forceRefresh,
    });

    return res.json({
      courses: result.courses,
      count: result.courses.length,
      source: result.source,
      cached: result.cached,
      query: result.effectiveQuery,
    });
  } catch (err: any) {
    if (err instanceof YouTubeApiError) {
      return res.status(err.statusCode).json({
        courses: [],
        count: 0,
        source: "youtube_data_api_v3",
        error: err.message,
        errorCode: err.code,
      });
    }
    return res.status(500).json({
      courses: [],
      count: 0,
      source: "youtube_data_api_v3",
      error: err?.message || "Unexpected error while retrieving YouTube courses.",
      errorCode: "NETWORK_ERROR",
    });
  }
};

app.get("/api/youtube/search", handleYouTubeSearchRequest);
app.get("/api/youtube/courses", handleYouTubeSearchRequest);

// 2. YouTube Service Status Endpoint
app.get("/api/youtube/status", (req, res) => {
  const hasApiKey = Boolean(youtubeService.getApiKey());
  res.json({
    youtubeApiKeyConfigured: hasApiKey,
    activeMode: hasApiKey ? "YouTube Data API v3 (Authenticated)" : "YouTube Live Direct Retrieval",
    cacheEntries: youtubeService.getCacheSize(),
  });
});

// 3. Legacy /api/courses endpoint mapped to real YouTube courses
app.get("/api/courses", async (req, res) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q : "Python Data Science Machine Learning";
    const result = await youtubeService.searchEducationalVideos({
      query,
      maxResults: 18,
    });
    res.json({
      courses: result.courses,
      count: result.courses.length,
      source: result.source,
    });
  } catch (err: any) {
    res.status(500).json({ courses: [], count: 0, error: err.message });
  }
});

// 4. Python Source Files Inspector / Downloader API
app.get("/api/python-files", (req, res) => {
  try {
    const filesToRead = [
      "main.py",
      "config.py",
      "requirements.txt",
      "README.md",
      "run.bat",
      ".env.example",
      "models/student.py",
      "models/course.py",
      "models/recommendation.py",
      "models/learning_path.py",
      "database/db_manager.py",
      "database/repositories.py",
      "ai/recommendation_engine.py",
      "ai/knowledge_base.py",
      "ai/rule_engine.py",
      "ai/search_algorithms.py",
      "ai/bayesian_reasoning.py",
      "ai/fuzzy_logic.py",
      "ai/skill_analyzer.py",
      "ai/roadmap_generator.py",
      "services/youtube_service.py",
      "services/gemini_service.py",
      "services/course_service.py",
      "ui/app.py",
      "ui/dashboard.py",
      "ui/profile.py",
      "ui/explore.py",
      "ui/recommendations.py",
      "ui/roadmap.py",
      "ui/analytics.py",
      "tests/test_recommendations.py",
      "tests/test_search.py",
      "tests/test_database.py",
      "tests/test_reasoning.py",
    ];

    const fileContents: Record<string, string> = {};
    for (const f of filesToRead) {
      const subPath = path.join(__dirname, "smart_course_recommendation", f);
      if (fs.existsSync(subPath)) {
        fileContents[f] = fs.readFileSync(subPath, "utf-8");
      }
    }
    res.json({ files: fileContents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Complete Updated Project ZIP Download Endpoint
app.get("/api/download-project-zip", (req, res) => {
  const zipPath = path.join(__dirname, "public", "smart_course_recommendation.zip");
  if (fs.existsSync(zipPath)) {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="smart_course_recommendation.zip"'
    );
    return res.sendFile(zipPath);
  }
  res.status(404).json({ error: "Project ZIP archive not found." });
});

// 6. Gemini AI Course Explanation API
app.post("/api/gemini/explain", async (req, res) => {
  const { course, userProfile } = req.body;

  if (!course || !userProfile) {
    return res.status(400).json({ error: "Missing course or user profile" });
  }

  const aiClient = getGeminiClient();
  if (aiClient) {
    try {
      const prompt = `You are an expert AI academic and career advisor.
In 2-3 concise, direct sentences, explain specifically WHY this course is necessary for this learner right now based on their career goal, current skills, and skill level. Do NOT summarize or repeat the video description—focus strictly on why mastering this material is essential for their progression.

Learner Profile:
- Name: ${userProfile.name || "Student"}
- Career Goal: ${userProfile.career_goal || "Tech Professional"}
- Current Skills: ${userProfile.skills || "Foundational skills"}
- Interests: ${userProfile.interests || "Core concepts"}
- Skill Level: ${userProfile.preferred_difficulty || userProfile.experience_level || "Beginner"}

Course Details:
- Title: ${course.title}
- Channel / Instructor: ${course.channel_title || course.instructor}
- Category: ${course.category}
- Target Skills: ${course.skills}
- Difficulty: ${course.difficulty}
- Duration: ${course.duration}`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      return res.json({ explanation: response.text?.trim() });
    } catch (error: any) {
      console.error("Gemini API error:", error?.message);
    }
  }

  const skills = course.skills
    ? course.skills.split(",").slice(0, 3).join(", ")
    : course.category || "core domain concepts";
  const goal = userProfile.career_goal || "your target role";
  const level =
    userProfile.preferred_difficulty || userProfile.experience_level || course.difficulty || "current";
  const fallback = `This course is necessary for advancing toward a ${goal} role because it builds essential competency in ${skills} at a ${level} level. Mastering these concepts closes critical skill gaps in your profile and prepares you for real-world technical implementation.`;

  res.json({ explanation: fallback, isLocalFallback: true });
});

// 7. Gemini AI Career & Course Advisor Q&A
app.post("/api/gemini/advisor", async (req, res) => {
  const { question, userProfile, topCourses } = req.body;

  const aiClient = getGeminiClient();
  if (aiClient) {
    try {
      const courseSummaries = (topCourses || [])
        .slice(0, 4)
        .map(
          (c: any) =>
            `- ${c.title} by ${c.channel_title || c.instructor} (${c.difficulty}, ${c.duration})`
        )
        .join("\n");
      const prompt = `You are an expert academic advisor and tech career coach.
Student: ${userProfile?.name || "Learner"}
Career Ambition: ${userProfile?.career_goal || "Software Engineer"}
Current Skills: ${userProfile?.skills || "None yet"}
Top Recommended YouTube Courses available:
${courseSummaries}

Student Inquiry: "${question}"

Provide a friendly, insightful, and practical response in 2-3 concise sentences. Reference specific YouTube courses or strategies when appropriate.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      return res.json({ answer: response.text?.trim() });
    } catch (error: any) {
      console.error("Gemini Advisor error:", error?.message);
    }
  }

  const firstCourse = topCourses?.[0];
  res.json({
    answer: `Based on your trajectory toward ${
      userProfile?.career_goal || "your career goal"
    }, we recommend starting with "${
      firstCourse?.title || "a foundational YouTube course"
    }" by ${
      firstCourse?.channel_title || firstCourse?.instructor || "an expert educator"
    } to strengthen your core competencies.`,
    isLocalFallback: true,
  });
});

// 8. Gemini AI Skill Gap Analysis
app.post("/api/gemini/skillgap", async (req, res) => {
  const { careerGoal, acquiredSkills, missingSkills } = req.body;

  const aiClient = getGeminiClient();
  if (aiClient) {
    try {
      const prompt = `You are a technical recruiter and skills strategist.
Candidate Target: ${careerGoal}
Mastered Skills: ${(acquiredSkills || []).join(", ")}
Identified Skill Gaps: ${(missingSkills || []).join(", ")}

Write a concise 2-paragraph analysis:
1. Why bridging these missing gaps is critical to pass technical interview bars for ${careerGoal}.
2. Actionable advice on which skill to prioritize first and what kind of project to build.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      return res.json({ analysis: response.text?.trim() });
    } catch (error: any) {
      console.error("Gemini SkillGap error:", error?.message);
    }
  }

  const topGaps = (missingSkills || []).slice(0, 3).join(", ") || "advanced tooling";
  res.json({
    analysis: `For a competitive ${careerGoal || "role"}, proficiency in ${topGaps} separates entry-level applicants from hire-ready professionals. Technical hiring managers specifically look for practical experience with these competencies. We recommend focusing on practical project implementation alongside your YouTube coursework to demonstrate these skills.`,
    isLocalFallback: true,
  });
});

// 9. Gemini Multi-Turn Chatbot API
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, systemInstruction, userProfile, topCourses, modelPreference } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing or invalid messages array" });
  }

  const courseContext =
    Array.isArray(topCourses) && topCourses.length > 0
      ? `\nTop Recommended YouTube Courses for this learner:\n` +
        topCourses
          .slice(0, 4)
          .map(
            (c: any) =>
              `- "${c.title}" by ${c.channel_title || c.instructor} (${c.difficulty}, ${c.duration}, Skills: ${c.skills})`
          )
          .join("\n")
      : "";

  const defaultSystemInstruction =
    (systemInstruction ||
      `You are CourseAI, an expert AI Academic & Career Advisor for the Smart Course Recommendation System powered by real YouTube courses.`) +
    `\nLearner Profile:
- Name: ${userProfile?.name || "Student"}
- Career Ambition: ${userProfile?.career_goal || "Software Engineer"}
- Current Skills: ${userProfile?.skills || "Foundational skills"}
- Skill Level: ${userProfile?.experience_level || "Beginner"}
- Weekly Study Target: ${userProfile?.weekly_hours || 8} hours/week${courseContext}

Provide personalized, actionable, and concise guidance tailored to the learner's profile.`;

  // Normalize multi-turn history so it strictly starts with a "user" turn and alternates roles
  const normalizedTurns: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  for (const m of messages) {
    const text = String(m?.content || "").trim();
    if (!text) continue;
    const role: "user" | "model" = m.role === "user" ? "user" : "model";
    if (normalizedTurns.length === 0 && role === "model") {
      // Skip leading model welcome message
      continue;
    }
    const prev = normalizedTurns[normalizedTurns.length - 1];
    if (prev && prev.role === role) {
      prev.parts[0].text += `\n${text}`;
    } else {
      normalizedTurns.push({ role, parts: [{ text }] });
    }
  }

  const selectedModel =
    modelPreference === "fast" ? "gemini-3.1-flash-lite" : "gemini-3.8-flash";

  const aiClient = getGeminiClient();
  if (aiClient && normalizedTurns.length > 0) {
    try {
      const response = await aiClient.models.generateContent({
        model: selectedModel,
        contents: normalizedTurns,
        config: {
          systemInstruction: defaultSystemInstruction,
        },
      });

      const replyText = response.text?.trim();
      if (replyText) {
        return res.json({
          reply: replyText,
          role: "model",
          modelUsed: selectedModel,
        });
      }
    } catch (error: any) {
      console.error("Gemini Multi-Turn Chat error:", error?.message || error);
    }
  }

  // Context-aware intelligent fallback if GEMINI_API_KEY is not set or quota is reached
  const lastUserMsg =
    normalizedTurns.filter((m) => m.role === "user").pop()?.parts?.[0]?.text || "";
  const query = lastUserMsg.toLowerCase();
  const goal = userProfile?.career_goal || "Software Engineer";
  const skills = userProfile?.skills || "core programming fundamentals";
  const topCourse1 = topCourses?.[0];
  const topCourse2 = topCourses?.[1];

  let fallbackReply = "";

  if (query.includes("next course") || query.includes("recommend") || query.includes("watch")) {
    fallbackReply = topCourse1
      ? `Based on your goal to become a ${goal} (${userProfile?.experience_level || "Beginner"} level), your best next course is:\n\n1. "${topCourse1.title}" by ${topCourse1.channel_title || topCourse1.instructor} (${topCourse1.duration}) — covers ${topCourse1.skills}.${
          topCourse2
            ? `\n2. Follow up with "${topCourse2.title}" (${topCourse2.duration}) to deepen your applied skills.`
            : ""
        }`
      : `For your ${goal} path, start with a full-length ${userProfile?.experience_level || "Beginner"} YouTube course in the "For You" tab that builds upon ${skills}.`;
  } else if (query.includes("gap") || query.includes("missing") || query.includes("skill")) {
    fallbackReply = `To strengthen your readiness for ${goal}:\n• Current foundation: ${skills}\n• Priority focus areas: System architecture, real-world project deployment, and automated testing.\n• Action step: Complete your active course in the Learning tab—completed courses automatically update your verified skills and Skill Gaps!`;
  } else if (query.includes("project") || query.includes("build") || query.includes("portfolio")) {
    fallbackReply = `Here are 3 high-impact portfolio project ideas for a ${goal}:\n1. End-to-End Domain Application: Build a complete project using ${skills} with real data and clean documentation.\n2. Automated Workflow / API Integration: Create a service that processes live inputs and visualizes metrics.\n3. Production Capstone: Package your solution with tests, README benchmarks, and a live demo link.`;
  } else if (query.includes("interview") || query.includes("prep") || query.includes("hire")) {
    fallbackReply = `Key interview preparation tips for ${goal} roles:\n1. Master Core Concepts: Be ready to explain how you apply ${skills} to solve real bottlenecks.\n2. Walk Through Trade-offs: Interviewers test why you chose a specific data structure, model, or design pattern.\n3. Showcase Completed Projects: Connect every course milestone on your Roadmap to a tangible project outcome.`;
  } else {
    fallbackReply = `For your journey toward ${goal} (current skills: ${skills}):\n• Focus on completing "${topCourse1?.title || "your top recommended course"}" first.\n• Dedicate ${userProfile?.weekly_hours || 8} hours/week to hands-on coding alongside each video.\n• Ask me about "Next course?", "Top skill gaps?", "3 project ideas", or "Interview tips" anytime!`;
  }

  res.json({
    reply: fallbackReply,
    role: "model",
    isLocalFallback: true,
    modelUsed: "local-analytical-engine",
  });
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`🌐 Open your project: http://localhost:${PORT}`);
  });
}

startServer();
