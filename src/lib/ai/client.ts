import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// ============================================================
// Task types mapped to model tiers
// ============================================================

export type TaskType =
  | "extract_signals"
  | "summarize_page"
  | "categorize_content"
  | "deduplicate_check"
  | "score_idea"
  | "analyze_trend"
  | "compare_competitors"
  | "compile_digest"
  | "cross_reference"
  | "brain_conversation"
  | "deep_analysis"
  | "rule_reasoning"
  | "generate_brief";

export interface ModelConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  tier: 1 | 2 | 3;
}

// ============================================================
// Tier definitions
// ============================================================
// Tier 1: Bulk processing (Kimi/Qwen via OpenAI-compatible API)
//   - High volume, low cost. Signal extraction, page summarization,
//     content categorization, dedup checks.
// Tier 2: Analysis (Claude Haiku)
//   - Scoring, trend analysis, competitor comparison, digest compilation,
//     cross-referencing.
// Tier 3: Brain (Claude Sonnet)
//   - Conversational AI, deep analysis, rule reasoning, brief generation.
// ============================================================

const TIER_1_TASKS: TaskType[] = [
  "extract_signals",
  "summarize_page",
  "categorize_content",
  "deduplicate_check",
];

const TIER_2_TASKS: TaskType[] = [
  "score_idea",
  "analyze_trend",
  "compare_competitors",
  "compile_digest",
  "cross_reference",
];

const TIER_3_TASKS: TaskType[] = [
  "brain_conversation",
  "deep_analysis",
  "rule_reasoning",
  "generate_brief",
];

const TIER_1_CONFIG: ModelConfig = {
  model: process.env.TIER1_MODEL || "qwen-turbo",
  maxTokens: 2048,
  temperature: 0.3,
  tier: 1,
};

const TIER_2_CONFIG: ModelConfig = {
  model: "claude-3-5-haiku-20241022",
  maxTokens: 4096,
  temperature: 0.4,
  tier: 2,
};

const TIER_3_CONFIG: ModelConfig = {
  model: "claude-sonnet-4-20250514",
  maxTokens: 8192,
  temperature: 0.7,
  tier: 3,
};

/**
 * Select the appropriate model configuration for a given task type.
 * Tasks are routed to the cheapest tier that can handle them well.
 */
export function selectModel(task: TaskType): ModelConfig {
  if ((TIER_1_TASKS as string[]).includes(task)) return { ...TIER_1_CONFIG };
  if ((TIER_2_TASKS as string[]).includes(task)) return { ...TIER_2_CONFIG };
  if ((TIER_3_TASKS as string[]).includes(task)) return { ...TIER_3_CONFIG };

  // Default to Tier 2 for unknown tasks
  return { ...TIER_2_CONFIG };
}

// ============================================================
// Client singletons
// ============================================================

let _anthropicClient: Anthropic | null = null;
let _tier1Client: OpenAI | null = null;

/**
 * Get the Anthropic client for Tier 2 (Haiku) and Tier 3 (Sonnet) tasks.
 * Creates a singleton instance on first call.
 */
export function getAnthropicClient(): Anthropic {
  if (_anthropicClient) return _anthropicClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn(
      "[PeptideIQ AI] ANTHROPIC_API_KEY is not set. Anthropic client will be created but API calls will fail."
    );
  }

  _anthropicClient = new Anthropic({
    apiKey: apiKey || "missing-key",
  });

  return _anthropicClient;
}

/**
 * Get the Tier 1 client (OpenAI-compatible) for bulk processing tasks.
 * Connects to Kimi, Qwen, or any OpenAI-compatible API endpoint.
 */
export function getTier1Client(): OpenAI {
  if (_tier1Client) return _tier1Client;

  const apiKey = process.env.TIER1_API_KEY;
  const baseURL = process.env.TIER1_BASE_URL || "https://api.openai.com/v1";

  if (!apiKey) {
    console.warn(
      "[PeptideIQ AI] TIER1_API_KEY is not set. Tier 1 client will be created but API calls will fail."
    );
  }

  _tier1Client = new OpenAI({
    apiKey: apiKey || "missing-key",
    baseURL,
  });

  return _tier1Client;
}

/**
 * Convenience: run a Tier 2 or Tier 3 completion via the Anthropic client.
 * Returns the text response.
 */
export async function runAnthropicCompletion(params: {
  task: TaskType;
  systemPrompt: string;
  userMessage: string;
  maxTokensOverride?: number;
  temperatureOverride?: number;
}): Promise<string> {
  const config = selectModel(params.task);
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: config.model,
    max_tokens: params.maxTokensOverride ?? config.maxTokens,
    temperature: params.temperatureOverride ?? config.temperature,
    system: params.systemPrompt,
    messages: [{ role: "user", content: params.userMessage }],
  });

  const block = response.content[0];
  if (block.type === "text") {
    return block.text;
  }

  return "";
}

/**
 * Convenience: run a Tier 1 completion via the OpenAI-compatible client.
 * Returns the text response.
 */
export async function runTier1Completion(params: {
  systemPrompt: string;
  userMessage: string;
  maxTokensOverride?: number;
  temperatureOverride?: number;
}): Promise<string> {
  const config = selectModel("extract_signals"); // Tier 1
  const client = getTier1Client();

  const response = await client.chat.completions.create({
    model: config.model,
    max_tokens: params.maxTokensOverride ?? config.maxTokens,
    temperature: params.temperatureOverride ?? config.temperature,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userMessage },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

/**
 * Stream a Tier 3 (Brain) conversation via the Anthropic client.
 * Returns an async iterable of text deltas.
 */
export async function streamBrainConversation(params: {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokensOverride?: number;
}): Promise<AsyncIterable<string>> {
  const config = selectModel("brain_conversation");
  const client = getAnthropicClient();

  const stream = client.messages.stream({
    model: config.model,
    max_tokens: params.maxTokensOverride ?? config.maxTokens,
    temperature: config.temperature,
    system: params.systemPrompt,
    messages: params.messages,
  });

  async function* textDeltas() {
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }

  return textDeltas();
}
