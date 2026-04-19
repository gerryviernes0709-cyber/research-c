// Re-export all schema types
export type {
  User,
  NewUser,
  Idea,
  NewIdea,
  Signal,
  NewSignal,
  Source,
  NewSource,
  Conversation,
  Message,
  GoldenRule,
  NewGoldenRule,
  FeedbackPattern,
  Competitor,
  NewCompetitor,
  CompetitorProduct,
  Digest,
  TrendSnapshot,
  Annotation,
  ActivityLogEntry,
} from "@/lib/db/schema";

// Idea with related data
export interface IdeaWithSignals {
  idea: import("@/lib/db/schema").Idea;
  signals: import("@/lib/db/schema").Signal[];
  annotations: import("@/lib/db/schema").Annotation[];
}

// Brain chat types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export type ConversationMode =
  | "global"
  | "idea"
  | "comparison"
  | "strategy"
  | "explore";

// SSE event types
export type SSEEventType =
  | "idea.created"
  | "idea.updated"
  | "idea.scored"
  | "signal.created"
  | "signal.processed"
  | "source.health_changed"
  | "digest.generated"
  | "competitor.alert";

export interface SSEEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

// Scoring types
export interface ScoreBreakdown {
  demand: number;
  competition: number;
  revenue: number;
  buildEffort: number;
  trend: number;
  overall: number;
  reasoning: string;
  confidence: number;
}

// Dashboard stats
export interface DashboardStats {
  totalIdeas: number;
  ideasByStatus: Record<string, number>;
  signalsToday: number;
  activeSources: number;
  approvalRate: number;
  avgScore: number;
}

// Trend data for charts
export interface TrendDataPoint {
  date: string;
  value: number;
  keyword: string;
  source: string;
}

// Competitor with products
export interface CompetitorWithProducts {
  competitor: import("@/lib/db/schema").Competitor;
  products: import("@/lib/db/schema").CompetitorProduct[];
}
