import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  date,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum("user_role", ["owner", "member"]);

export const ideaCategoryEnum = pgEnum("idea_category", [
  "ebook",
  "course",
  "template",
  "saas_tool",
  "ai_app",
  "calculator",
  "tracker",
  "community",
  "membership",
  "coaching",
  "printable",
  "other",
]);

export const ideaStatusEnum = pgEnum("idea_status", [
  "detected",
  "reviewing",
  "approved",
  "declined",
  "archived",
  "incubating",
]);

export const opportunityTypeEnum = pgEnum("opportunity_type", [
  "proven_model",
  "gap_opportunity",
  "emerging_trend",
  "first_mover",
  "improvement",
]);

export const signalContentTypeEnum = pgEnum("signal_content_type", [
  "question",
  "product_listing",
  "discussion",
  "review",
  "tutorial",
  "news",
  "launch",
  "complaint",
  "trend_data",
  "competitor_product",
]);

export const sourcePlatformEnum = pgEnum("source_platform", [
  "reddit",
  "google_trends",
  "youtube",
  "tiktok",
  "twitter",
  "facebook",
  "telegram",
  "etsy",
  "whop",
  "amazon",
  "gumroad",
  "blackhatworld",
  "forum",
  "rss",
  "website",
]);

export const crawlFrequencyEnum = pgEnum("crawl_frequency", [
  "hourly",
  "every_4h",
  "every_12h",
  "daily",
  "weekly",
]);

export const crawlMethodEnum = pgEnum("crawl_method", [
  "api",
  "html_scrape",
  "rss",
  "puppeteer",
]);

export const senderTypeEnum = pgEnum("sender_type", ["user", "brain"]);

export const ruleTypeEnum = pgEnum("rule_type", [
  "golden",
  "general",
  "preference",
]);

export const ruleDirectionEnum = pgEnum("rule_direction", [
  "boost",
  "penalize",
  "block",
  "require",
]);

export const ruleSourceEnum = pgEnum("rule_source", [
  "manual",
  "ai_suggested",
  "learned",
]);

export const patternTypeEnum = pgEnum("pattern_type", [
  "category_preference",
  "sub_niche_preference",
  "price_range",
  "product_type",
  "trend_threshold",
  "competition_tolerance",
]);

export const discoveryMethodEnum = pgEnum("discovery_method", [
  "manual",
  "auto_discovered",
]);

export const watchPriorityEnum = pgEnum("watch_priority", [
  "high",
  "medium",
  "low",
]);

export const priceModelEnum = pgEnum("price_model", [
  "one_time",
  "subscription",
  "free",
  "freemium",
  "unknown",
]);

export const competitorProductStatusEnum = pgEnum("competitor_product_status", [
  "active",
  "removed",
  "price_changed",
]);

export const trendSourceEnum = pgEnum("trend_source", [
  "google_trends",
  "reddit_volume",
  "youtube_views",
  "tiktok_views",
  "etsy_search",
  "amazon_search",
]);

export const trendPeriodEnum = pgEnum("trend_period", [
  "daily",
  "weekly",
  "monthly",
]);

export const annotationTypeEnum = pgEnum("annotation_type", [
  "note",
  "research",
  "concern",
  "opportunity",
  "action_item",
]);

// ============================================================
// TABLES
// ============================================================

// 1. users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("member"),
  avatarUrl: text("avatar_url"),
  preferences: jsonb("preferences").default({}),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 2. ideas
export const ideas = pgTable(
  "ideas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    summary: text("summary"),
    category: ideaCategoryEnum("category").notNull(),
    peptideFocus: text("peptide_focus")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    subNiche: varchar("sub_niche", { length: 255 }),
    opportunityType: opportunityTypeEnum("opportunity_type").notNull(),
    status: ideaStatusEnum("status").notNull().default("detected"),
    scoreOverall: decimal("score_overall", { precision: 5, scale: 2 }),
    scoreDemand: decimal("score_demand", { precision: 5, scale: 2 }),
    scoreCompetition: decimal("score_competition", { precision: 5, scale: 2 }),
    scoreRevenue: decimal("score_revenue", { precision: 5, scale: 2 }),
    scoreBuildEffort: decimal("score_build_effort", { precision: 5, scale: 2 }),
    scoreTrend: decimal("score_trend", { precision: 5, scale: 2 }),
    scoreReasoning: text("score_reasoning"),
    confidence: decimal("confidence", { precision: 5, scale: 2 }),
    evidenceCount: integer("evidence_count").notNull().default(0),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    sourceSignalsCount: integer("source_signals_count").notNull().default(0),
    firstDetectedAt: timestamp("first_detected_at", { withTimezone: true }).notNull().defaultNow(),
    lastSignalAt: timestamp("last_signal_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ideas_slug_idx").on(table.slug),
    index("ideas_status_idx").on(table.status),
    index("ideas_category_idx").on(table.category),
    index("ideas_score_idx").on(table.scoreOverall),
    index("ideas_created_idx").on(table.createdAt),
  ]
);

// 3. signals
export const signals = pgTable(
  "signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaId: uuid("idea_id").references(() => ideas.id),
    source: sourcePlatformEnum("source").notNull(),
    sourceUrl: varchar("source_url", { length: 2000 }),
    sourceTitle: varchar("source_title", { length: 1000 }),
    sourceAuthor: varchar("source_author", { length: 500 }),
    contentSummary: text("content_summary"),
    contentType: signalContentTypeEnum("content_type").notNull(),
    relevanceScore: decimal("relevance_score", { precision: 5, scale: 2 }),
    engagementMetrics: jsonb("engagement_metrics").default({}),
    peptidesMentioned: text("peptides_mentioned")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    rawData: jsonb("raw_data").default({}),
    processed: boolean("processed").notNull().default(false),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
    sourcePublishedAt: timestamp("source_published_at", { withTimezone: true }),
  },
  (table) => [
    index("signals_idea_id_idx").on(table.ideaId),
    index("signals_source_idx").on(table.source),
    index("signals_processed_idx").on(table.processed),
    index("signals_detected_idx").on(table.detectedAt),
  ]
);

// 4. sources
export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  platform: sourcePlatformEnum("platform").notNull(),
  urlPattern: varchar("url_pattern", { length: 2000 }),
  crawlFrequency: crawlFrequencyEnum("crawl_frequency").notNull().default("daily"),
  crawlMethod: crawlMethodEnum("crawl_method").notNull().default("html_scrape"),
  authConfig: jsonb("auth_config").default({}),
  searchQueries: text("search_queries")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  lastCrawledAt: timestamp("last_crawled_at", { withTimezone: true }),
  lastError: text("last_error"),
  signalsTotal: integer("signals_total").notNull().default(0),
  signalsRelevant: integer("signals_relevant").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  priority: integer("priority").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 5. conversations
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaId: uuid("idea_id").references(() => ideas.id),
    title: varchar("title", { length: 500 }),
    participants: uuid("participants")
      .array()
      .notNull()
      .default(sql`ARRAY[]::uuid[]`),
    messageCount: integer("message_count").notNull().default(0),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("conversations_idea_idx").on(table.ideaId),
    index("conversations_last_msg_idx").on(table.lastMessageAt),
  ]
);

// 6. messages
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderType: senderTypeEnum("sender_type").notNull(),
    senderId: uuid("sender_id").references(() => users.id),
    content: text("content").notNull(),
    contextSnapshot: jsonb("context_snapshot"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_created_idx").on(table.createdAt),
  ]
);

// 7. golden_rules
export const goldenRules = pgTable(
  "golden_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ruleText: text("rule_text").notNull(),
    ruleType: ruleTypeEnum("rule_type").notNull().default("general"),
    direction: ruleDirectionEnum("direction").notNull(),
    weight: decimal("weight", { precision: 3, scale: 2 }).notNull().default("1.00"),
    source: ruleSourceEnum("source").notNull().default("manual"),
    learnedFrom: jsonb("learned_from"),
    approved: boolean("approved").notNull().default(true),
    active: boolean("active").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rules_active_idx").on(table.active)]
);

// 8. feedback_patterns
export const feedbackPatterns = pgTable("feedback_patterns", {
  id: uuid("id").primaryKey().defaultRandom(),
  patternDescription: text("pattern_description").notNull(),
  patternType: patternTypeEnum("pattern_type").notNull(),
  evidence: jsonb("evidence").default([]),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull().default("0"),
  appliedCount: integer("applied_count").notNull().default(0),
  overrideCount: integer("override_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  suggestedAsRule: boolean("suggested_as_rule").notNull().default(false),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  lastAppliedAt: timestamp("last_applied_at", { withTimezone: true }),
});

// 9. competitors
export const competitors = pgTable("competitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 2000 }),
  platform: varchar("platform", { length: 100 }),
  discoveryMethod: discoveryMethodEnum("discovery_method").notNull().default("manual"),
  productsTracked: integer("products_tracked").notNull().default(0),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  notes: text("notes"),
  watchPriority: watchPriorityEnum("watch_priority").notNull().default("medium"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 10. competitor_products
export const competitorProducts = pgTable(
  "competitor_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    competitorId: uuid("competitor_id")
      .notNull()
      .references(() => competitors.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 500 }).notNull(),
    url: varchar("url", { length: 2000 }),
    category: ideaCategoryEnum("category"),
    price: decimal("price", { precision: 10, scale: 2 }),
    priceModel: priceModelEnum("price_model"),
    descriptionSummary: text("description_summary"),
    peptidesCovered: text("peptides_covered")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    estimatedSales: integer("estimated_sales"),
    rating: decimal("rating", { precision: 3, scale: 2 }),
    reviewCount: integer("review_count"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    status: competitorProductStatusEnum("status").notNull().default("active"),
    priceHistory: jsonb("price_history").default([]),
  },
  (table) => [
    index("comp_products_competitor_idx").on(table.competitorId),
  ]
);

// 11. digests
export const digests = pgTable(
  "digests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: date("date").notNull(),
    title: varchar("title", { length: 255 }),
    summaryHtml: text("summary_html"),
    ideasFeatured: uuid("ideas_featured")
      .array()
      .notNull()
      .default(sql`ARRAY[]::uuid[]`),
    signalsProcessed: integer("signals_processed").notNull().default(0),
    newIdeasCount: integer("new_ideas_count").notNull().default(0),
    scoreThresholdUsed: decimal("score_threshold_used", { precision: 5, scale: 2 }),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("digests_date_idx").on(table.date)]
);

// 12. trend_snapshots
export const trendSnapshots = pgTable(
  "trend_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    keyword: varchar("keyword", { length: 255 }).notNull(),
    source: trendSourceEnum("source").notNull(),
    value: decimal("value", { precision: 10, scale: 2 }).notNull(),
    previousValue: decimal("previous_value", { precision: 10, scale: 2 }),
    deltaPercent: decimal("delta_percent", { precision: 5, scale: 2 }),
    period: trendPeriodEnum("period").notNull().default("daily"),
    rawData: jsonb("raw_data").default({}),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("trends_keyword_date_idx").on(table.keyword, table.capturedAt),
    index("trends_source_idx").on(table.source),
  ]
);

// 13. annotations
export const annotations = pgTable(
  "annotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    annotationType: annotationTypeEnum("annotation_type").notNull().default("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("annotations_idea_idx").on(table.ideaId)]
);

// 14. activity_log
export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: uuid("entity_id"),
    details: jsonb("details").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("activity_created_idx").on(table.createdAt),
    index("activity_entity_idx").on(table.entityType, table.entityId),
  ]
);

// ============================================================
// TYPE EXPORTS
// ============================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;
export type Signal = typeof signals.$inferSelect;
export type NewSignal = typeof signals.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type GoldenRule = typeof goldenRules.$inferSelect;
export type NewGoldenRule = typeof goldenRules.$inferInsert;
export type FeedbackPattern = typeof feedbackPatterns.$inferSelect;
export type Competitor = typeof competitors.$inferSelect;
export type NewCompetitor = typeof competitors.$inferInsert;
export type CompetitorProduct = typeof competitorProducts.$inferSelect;
export type Digest = typeof digests.$inferSelect;
export type TrendSnapshot = typeof trendSnapshots.$inferSelect;
export type Annotation = typeof annotations.$inferSelect;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
