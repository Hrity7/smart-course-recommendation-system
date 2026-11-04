export interface Course {
  course_id: string;
  video_id?: string;
  title: string;
  platform: string;
  channel_title?: string;
  category: string;
  description: string;
  skills: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  duration_hours: number;
  rating: number;
  num_reviews: number;
  view_count?: number;
  formatted_views?: string;
  published_at?: string;
  thumbnail_url?: string;
  embed_url?: string;
  instructor: string;
  language: string;
  course_url: string;
  certificate: string;
  career_outcomes: string;
  recommendation_score?: number;
  why_recommended?: string;
}

export interface YouTubeSearchResponse {
  courses: Course[];
  count: number;
  source: "youtube_data_api_v3" | "youtube_live_search";
  cached?: boolean;
  query?: string;
  error?: string;
  errorCode?: "INVALID_API_KEY" | "QUOTA_EXCEEDED" | "NETWORK_ERROR" | "EMPTY_RESULTS" | "VALIDATION_ERROR";
}

export interface UserProfile {
  name: string;
  age?: number;
  education: string;
  profession: string;
  skills: string;
  interests: string;
  career_goal: string;
  experience_level: "Beginner" | "Intermediate" | "Advanced";
  preferred_difficulty: "Beginner" | "Intermediate" | "Advanced";
  learning_format: string;
  weekly_hours: number;
  duration_preference: string;
  platforms: string;
}

export interface RecommendationWeights {
  interest_match: number;
  skill_match: number;
  career_goal_match: number;
  difficulty_match: number;
  rating_match: number;
  duration_match: number;
}

export interface LearningCourse {
  course: Course;
  status: "not_started" | "in_progress" | "completed";
  progress_percent: number;
  hours_spent: number;
  started_at: string;
  completed_at?: string;
}

export interface RoadmapStep {
  id: number;
  step_number: number;
  title: string;
  description: string;
  skills: string;
  recommended_course_id?: string;
  recommended_course?: Course;
  completed: boolean;
}

