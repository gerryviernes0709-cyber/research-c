CREATE TYPE "public"."annotation_type" AS ENUM('note', 'research', 'concern', 'opportunity', 'action_item');--> statement-breakpoint
CREATE TYPE "public"."competitor_product_status" AS ENUM('active', 'removed', 'price_changed');--> statement-breakpoint
CREATE TYPE "public"."crawl_frequency" AS ENUM('hourly', 'every_4h', 'every_12h', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."crawl_method" AS ENUM('api', 'html_scrape', 'rss', 'puppeteer');--> statement-breakpoint
CREATE TYPE "public"."discovery_method" AS ENUM('manual', 'auto_discovered');--> statement-breakpoint
CREATE TYPE "public"."idea_category" AS ENUM('ebook', 'course', 'template', 'saas_tool', 'ai_app', 'calculator', 'tracker', 'community', 'membership', 'coaching', 'printable', 'other');--> statement-breakpoint
CREATE TYPE "public"."idea_status" AS ENUM('detected', 'reviewing', 'approved', 'declined', 'archived', 'incubating');--> statement-breakpoint
CREATE TYPE "public"."opportunity_type" AS ENUM('proven_model', 'gap_opportunity', 'emerging_trend', 'first_mover', 'improvement');--> statement-breakpoint
CREATE TYPE "public"."pattern_type" AS ENUM('category_preference', 'sub_niche_preference', 'price_range', 'product_type', 'trend_threshold', 'competition_tolerance');--> statement-breakpoint
CREATE TYPE "public"."price_model" AS ENUM('one_time', 'subscription', 'free', 'freemium', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."rule_direction" AS ENUM('boost', 'penalize', 'block', 'require');--> statement-breakpoint
CREATE TYPE "public"."rule_source" AS ENUM('manual', 'ai_suggested', 'learned');--> statement-breakpoint
CREATE TYPE "public"."rule_type" AS ENUM('golden', 'general', 'preference');--> statement-breakpoint
CREATE TYPE "public"."sender_type" AS ENUM('user', 'brain');--> statement-breakpoint
CREATE TYPE "public"."signal_content_type" AS ENUM('question', 'product_listing', 'discussion', 'review', 'tutorial', 'news', 'launch', 'complaint', 'trend_data', 'competitor_product');--> statement-breakpoint
CREATE TYPE "public"."source_platform" AS ENUM('reddit', 'google_trends', 'youtube', 'tiktok', 'twitter', 'facebook', 'telegram', 'etsy', 'whop', 'amazon', 'gumroad', 'blackhatworld', 'forum', 'rss', 'website');--> statement-breakpoint
CREATE TYPE "public"."trend_period" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."trend_source" AS ENUM('google_trends', 'reddit_volume', 'youtube_views', 'tiktok_views', 'etsy_search', 'amazon_search');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."watch_priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "annotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"annotation_type" "annotation_type" DEFAULT 'note' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitor_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competitor_id" uuid NOT NULL,
	"name" varchar(500) NOT NULL,
	"url" varchar(2000),
	"category" "idea_category",
	"price" numeric(10, 2),
	"price_model" "price_model",
	"description_summary" text,
	"peptides_covered" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"estimated_sales" integer,
	"rating" numeric(3, 2),
	"review_count" integer,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_checked_at" timestamp with time zone,
	"status" "competitor_product_status" DEFAULT 'active' NOT NULL,
	"price_history" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" varchar(2000),
	"platform" varchar(100),
	"discovery_method" "discovery_method" DEFAULT 'manual' NOT NULL,
	"products_tracked" integer DEFAULT 0 NOT NULL,
	"last_checked_at" timestamp with time zone,
	"notes" text,
	"watch_priority" "watch_priority" DEFAULT 'medium' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_id" uuid,
	"title" varchar(500),
	"participants" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"title" varchar(255),
	"summary_html" text,
	"ideas_featured" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
	"signals_processed" integer DEFAULT 0 NOT NULL,
	"new_ideas_count" integer DEFAULT 0 NOT NULL,
	"score_threshold_used" numeric(5, 2),
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pattern_description" text NOT NULL,
	"pattern_type" "pattern_type" NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb,
	"confidence" numeric(5, 2) DEFAULT '0' NOT NULL,
	"applied_count" integer DEFAULT 0 NOT NULL,
	"override_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"suggested_as_rule" boolean DEFAULT false NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_applied_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "golden_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_text" text NOT NULL,
	"rule_type" "rule_type" DEFAULT 'general' NOT NULL,
	"direction" "rule_direction" NOT NULL,
	"weight" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"source" "rule_source" DEFAULT 'manual' NOT NULL,
	"learned_from" jsonb,
	"approved" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"summary" text,
	"category" "idea_category" NOT NULL,
	"peptide_focus" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"sub_niche" varchar(255),
	"opportunity_type" "opportunity_type" NOT NULL,
	"status" "idea_status" DEFAULT 'detected' NOT NULL,
	"score_overall" numeric(5, 2),
	"score_demand" numeric(5, 2),
	"score_competition" numeric(5, 2),
	"score_revenue" numeric(5, 2),
	"score_build_effort" numeric(5, 2),
	"score_trend" numeric(5, 2),
	"score_reasoning" text,
	"confidence" numeric(5, 2),
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"source_signals_count" integer DEFAULT 0 NOT NULL,
	"first_detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signal_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_type" "sender_type" NOT NULL,
	"sender_id" uuid,
	"content" text NOT NULL,
	"context_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_id" uuid,
	"source" "source_platform" NOT NULL,
	"source_url" varchar(2000),
	"source_title" varchar(1000),
	"source_author" varchar(500),
	"content_summary" text,
	"content_type" "signal_content_type" NOT NULL,
	"relevance_score" numeric(5, 2),
	"engagement_metrics" jsonb DEFAULT '{}'::jsonb,
	"peptides_mentioned" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"raw_data" jsonb DEFAULT '{}'::jsonb,
	"processed" boolean DEFAULT false NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"platform" "source_platform" NOT NULL,
	"url_pattern" varchar(2000),
	"crawl_frequency" "crawl_frequency" DEFAULT 'daily' NOT NULL,
	"crawl_method" "crawl_method" DEFAULT 'html_scrape' NOT NULL,
	"auth_config" jsonb DEFAULT '{}'::jsonb,
	"search_queries" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"last_crawled_at" timestamp with time zone,
	"last_error" text,
	"signals_total" integer DEFAULT 0 NOT NULL,
	"signals_relevant" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trend_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" varchar(255) NOT NULL,
	"source" "trend_source" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"previous_value" numeric(10, 2),
	"delta_percent" numeric(5, 2),
	"period" "trend_period" DEFAULT 'daily' NOT NULL,
	"raw_data" jsonb DEFAULT '{}'::jsonb,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"avatar_url" text,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_products" ADD CONSTRAINT "competitor_products_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "golden_rules" ADD CONSTRAINT "golden_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_created_idx" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_entity_idx" ON "activity_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "annotations_idea_idx" ON "annotations" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "comp_products_competitor_idx" ON "competitor_products" USING btree ("competitor_id");--> statement-breakpoint
CREATE INDEX "conversations_idea_idx" ON "conversations" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "conversations_last_msg_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "digests_date_idx" ON "digests" USING btree ("date");--> statement-breakpoint
CREATE INDEX "rules_active_idx" ON "golden_rules" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "ideas_slug_idx" ON "ideas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ideas_status_idx" ON "ideas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ideas_category_idx" ON "ideas" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ideas_score_idx" ON "ideas" USING btree ("score_overall");--> statement-breakpoint
CREATE INDEX "ideas_created_idx" ON "ideas" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_created_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "signals_idea_id_idx" ON "signals" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "signals_source_idx" ON "signals" USING btree ("source");--> statement-breakpoint
CREATE INDEX "signals_processed_idx" ON "signals" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "signals_detected_idx" ON "signals" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "trends_keyword_date_idx" ON "trend_snapshots" USING btree ("keyword","captured_at");--> statement-breakpoint
CREATE INDEX "trends_source_idx" ON "trend_snapshots" USING btree ("source");