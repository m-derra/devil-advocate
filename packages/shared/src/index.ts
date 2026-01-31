// Session Types
export interface Session {
  id: string;
  projectIdea: string;
  projectUrl?: string;
  screenshots?: Screenshot[];
  hackathonContext?: string;
  status: SessionStatus;
  critiques: CritiqueResult[];
  rebuttals: RebuttalResult[];
  createdAt: Date;
  completedAt?: Date;
}

export interface Screenshot {
  type: "desktop" | "mobile" | "uploaded";
  data: string; // base64
  label?: string;
}

export type SessionStatus =
  | "pending"
  | "analyzing"
  | "critiquing"
  | "rebutting"
  | "completed"
  | "error";

// Critique Types
export type CritiqueType = "technical" | "business" | "ux" | "pitch";

export type Severity = "critical" | "major" | "minor" | "suggestion";

export interface Critique {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  impact: string;
  recommendation?: string;
}

export interface CritiqueResult {
  type: CritiqueType;
  agentName: string;
  critiques: Critique[];
  summary: string;
  completedAt: Date;
}

export interface RebuttalResult {
  critiqueId: string;
  critiqueType: CritiqueType;
  defense: string;
  keyPoints: string[];
  suggestedEvidence?: string;
}

// Feedback Types
export type FeedbackType = "feature_request" | "bug_report" | "general";
export type FeedbackCategory = "ui" | "agents" | "output" | "performance" | "other";

export interface Feedback {
  id: string;
  sessionId?: string;
  type: FeedbackType;
  category?: FeedbackCategory;
  description: string;
  url?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreateFeedbackInput {
  sessionId?: string;
  type: FeedbackType;
  category?: FeedbackCategory;
  description: string;
  url?: string;
  userAgent?: string;
}

// Micro-feedback for critique accuracy
export type AccuracyRating = "accurate" | "somewhat" | "inaccurate";

export interface CritiqueMicroFeedback {
  critiqueId: string;
  sessionId: string;
  rating: AccuracyRating;
}

// SSE Event Types
export type SSEEventType =
  | "session:created"
  | "session:status"
  | "critique:start"
  | "critique:progress"
  | "critique:complete"
  | "rebuttal:start"
  | "rebuttal:progress"
  | "rebuttal:complete"
  | "session:complete"
  | "session:error";

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: Date;
}

// API Request/Response Types
export interface CreateSessionRequest {
  projectIdea: string;
  projectUrl?: string;
  screenshots?: string[]; // base64 encoded images
}

export interface CreateSessionResponse {
  sessionId: string;
}

export interface SessionResponse extends Session {}

export interface FeedbackListResponse {
  feedback: Feedback[];
  total: number;
}

// Agent Types
export interface AgentConfig {
  name: string;
  systemPrompt: string;
  type: CritiqueType;
}

export interface AgentContext {
  sessionId: string;
  projectIdea: string;
  hackathonContext?: string;
  screenshots?: Screenshot[];
}

export interface AgentOutput {
  critiques: Critique[];
  summary: string;
}
