/**
 * Scoring Engine
 *
 * The core scoring engine that evaluates ideas across 5 dimensions using
 * heuristic analysis of the idea's data, linked signals, and contextual
 * information. In production, this will also invoke the Tier 2 LLM for
 * richer scoring. Currently operates in mock/heuristic mode.
 */

import {
  mockIdeas,
  mockSignals,
  mockTrends,
  mockCompetitors,
  mockRules,
  mockFeedbackPatterns,
} from "@/mock/data";
import { calculateConfidence } from "@/lib/scoring/confidence";
import { applyGoldenRules } from "@/lib/scoring/golden-rules";
import { applyFeedbackPatterns } from "@/lib/scoring/feedback-patterns";
import type { ScoreResult, ScoredIdea } from "@/lib/scoring/golden-rules";

export type { ScoreResult, ScoredIdea };

// ============================================================
// Category-based constants
// ============================================================

/**
 * Build effort scores by category (higher = easier to build).
 */
const CATEGORY_BUILD_EFFORT: Record<string, number> = {
  printable: 90,
  template: 85,
  calculator: 80,
  ebook: 75,
  tracker: 65,
  course: 55,
  saas_tool: 50,
  community: 48,
  membership: 45,
  ai_app: 40,
  coaching: 42,
  other: 60,
};

/**
 * Base revenue potential by category.
 * SaaS and AI apps score highest due to recurring revenue;
 * printables and templates lowest due to low price points.
 */
const CATEGORY_REVENUE_BASE: Record<string, number> = {
  saas_tool: 75,
  ai_app: 78,
  membership: 72,
  community: 68,
  coaching: 70,
  course: 65,
  tracker: 60,
  calculator: 55,
  ebook: 45,
  template: 35,
  printable: 25,
  other: 50,
};

// ============================================================
// Dimension scorers
// ============================================================

/**
 * Score demand based on signal count, engagement metrics, and source diversity.
 */
function scoreDemand(
  signals: typeof mockSignals
): number {
  if (signals.length === 0) return 10;

  // Signal count component (0-40)
  let countScore: number;
  if (signals.length >= 20) countScore = 40;
  else if (signals.length >= 10) countScore = 32;
  else if (signals.length >= 5) countScore = 24;
  else if (signals.length >= 3) countScore = 16;
  else countScore = 8;

  // Engagement sum component (0-35)
  let totalEngagement = 0;
  for (const signal of signals) {
    const metrics = signal.engagementMetrics as Record<string, number> | undefined;
    if (!metrics) continue;
    totalEngagement +=
      (metrics.upvotes ?? 0) +
      (metrics.likes ?? 0) * 0.5 +
      (metrics.comments ?? 0) * 2 +
      (metrics.views ?? 0) * 0.001 +
      (metrics.shares ?? 0) * 3;
  }

  let engagementScore: number;
  if (totalEngagement >= 5000) engagementScore = 35;
  else if (totalEngagement >= 2000) engagementScore = 28;
  else if (totalEngagement >= 500) engagementScore = 20;
  else if (totalEngagement >= 100) engagementScore = 12;
  else engagementScore = 5;

  // Source diversity component (0-25)
  const uniqueSources = new Set(signals.map((s) => s.source));
  let diversityScore: number;
  if (uniqueSources.size >= 4) diversityScore = 25;
  else if (uniqueSources.size >= 3) diversityScore = 20;
  else if (uniqueSources.size >= 2) diversityScore = 12;
  else diversityScore = 5;

  return Math.min(100, countScore + engagementScore + diversityScore);
}

/**
 * Score competition (inverse of competitor product count for similar category/peptides).
 * Higher score = less competition = more opportunity.
 */
function scoreCompetition(
  category: string,
  peptideFocus: string[]
): number {
  // Count competitor products in the same category or covering the same peptides
  let matchingProducts = 0;

  for (const competitor of mockCompetitors) {
    if (!competitor.active) continue;

    for (const product of competitor.products ?? []) {
      const categoryMatch = product.category === category;
      const peptideOverlap = (product.peptidesCovered ?? []).some(
        (p: string) => peptideFocus.includes(p)
      );

      if (categoryMatch || peptideOverlap) {
        matchingProducts++;
      }
    }
  }

  // Convert to a score: fewer competitors = higher score
  if (matchingProducts === 0) return 95;
  if (matchingProducts === 1) return 85;
  if (matchingProducts <= 3) return 72;
  if (matchingProducts <= 5) return 58;
  if (matchingProducts <= 8) return 42;
  if (matchingProducts <= 12) return 28;
  return 15;
}

/**
 * Score revenue potential based on category and opportunity type.
 */
function scoreRevenue(
  category: string,
  opportunityType: string,
  signals: typeof mockSignals
): number {
  const base = CATEGORY_REVENUE_BASE[category] ?? 50;

  // Opportunity type modifiers
  let typeModifier = 0;
  switch (opportunityType) {
    case "proven_model":
      typeModifier = 5; // Validated revenue model
      break;
    case "gap_opportunity":
      typeModifier = 8; // Unmet demand = pricing power
      break;
    case "first_mover":
      typeModifier = 10; // Can set the price
      break;
    case "emerging_trend":
      typeModifier = 3; // Uncertain market size
      break;
    case "improvement":
      typeModifier = 0; // Must compete on execution
      break;
  }

  // Check if any signals indicate willingness to pay
  let paymentSignal = 0;
  for (const signal of signals) {
    const metrics = signal.engagementMetrics as Record<string, number> | undefined;
    if (!metrics) continue;

    // Competitor products with good reviews indicate market exists
    if (signal.contentType === "competitor_product") {
      if ((metrics.reviewCount ?? 0) > 50) paymentSignal += 5;
      if ((metrics.rating ?? 0) >= 4.0) paymentSignal += 3;
    }

    // High search volume for solution-oriented queries
    if ((metrics.searchVolume ?? 0) > 1000) paymentSignal += 5;
  }

  paymentSignal = Math.min(paymentSignal, 15);

  return Math.min(100, base + typeModifier + paymentSignal);
}

/**
 * Score build effort based on category complexity.
 */
function scoreBuildEffort(category: string): number {
  return CATEGORY_BUILD_EFFORT[category] ?? 60;
}

/**
 * Score trend based on trend snapshots for related keywords.
 */
function scoreTrend(peptideFocus: string[], category: string): number {
  // Find the most recent trend snapshots for peptides and category-related keywords
  const relevantKeywords = [
    ...peptideFocus,
    // Add category-related search terms
    ...(category === "calculator" ? ["peptide calculator"] : []),
  ];

  // Get the latest snapshot for each relevant keyword
  const latestDeltas: number[] = [];

  for (const keyword of relevantKeywords) {
    const snapshots = mockTrends
      .filter(
        (t) =>
          (t.keyword as string)?.toLowerCase() === keyword.toLowerCase()
      )
      .sort(
        (a, b) =>
          new Date(b.capturedAt as string).getTime() -
          new Date(a.capturedAt as string).getTime()
      );

    if (snapshots.length > 0 && snapshots[0].deltaPercent) {
      latestDeltas.push(parseFloat(String(snapshots[0].deltaPercent)));
    }
  }

  if (latestDeltas.length === 0) {
    // No trend data: return a neutral score
    return 50;
  }

  // Average the deltas
  const avgDelta =
    latestDeltas.reduce((sum, d) => sum + d, 0) / latestDeltas.length;

  // Convert delta percentage to trend score
  if (avgDelta >= 30) return 95;
  if (avgDelta >= 20) return 85;
  if (avgDelta >= 10) return 75;
  if (avgDelta >= 5) return 65;
  if (avgDelta >= 0) return 55;
  if (avgDelta >= -5) return 45;
  if (avgDelta >= -10) return 35;
  if (avgDelta >= -20) return 25;
  return 15;
}

// ============================================================
// Main scoring function
// ============================================================

/**
 * Score an idea across 5 dimensions using heuristic analysis.
 *
 * In mock mode, this uses the idea's existing data and linked signals
 * to compute scores. In production, it would also invoke the Tier 2 LLM
 * for richer reasoning.
 *
 * After computing raw scores, applies golden rules and feedback patterns
 * as modifiers.
 */
export async function scoreIdea(ideaId: string): Promise<ScoreResult> {
  const idea = mockIdeas.find((i) => i.id === ideaId);
  if (!idea) {
    throw new Error(`Idea "${ideaId}" not found`);
  }

  const signals = mockSignals.filter((s) => s.ideaId === ideaId);
  const category = (idea.category as string) ?? "other";
  const peptideFocus = (idea.peptideFocus as string[]) ?? [];
  const opportunityType = (idea.opportunityType as string) ?? "improvement";

  // ── Compute raw dimension scores ──
  const demand = scoreDemand(signals);
  const competition = scoreCompetition(category, peptideFocus);
  const revenue = scoreRevenue(category, opportunityType, signals);
  const buildEffort = scoreBuildEffort(category);
  const trend = scoreTrend(peptideFocus, category);

  // ── Compute overall (weighted average, equal 20% weights) ──
  const overall = Math.round(
    (demand * 0.2 +
      competition * 0.2 +
      revenue * 0.2 +
      buildEffort * 0.2 +
      trend * 0.2) *
      100
  ) / 100;

  // ── Compute confidence ──
  const confidence = calculateConfidence(signals);

  // ── Build reasoning ──
  const reasoning = buildReasoning({
    title: idea.title as string,
    demand,
    competition,
    revenue,
    buildEffort,
    trend,
    overall,
    confidence,
    signalCount: signals.length,
    category,
    peptideFocus,
  });

  // ── Build the scored idea for rule application ──
  const rawScores: ScoreResult = {
    overall: Math.round(overall),
    demand,
    competition,
    revenue,
    buildEffort,
    trend,
    reasoning,
    confidence,
  };

  const scoredIdea: ScoredIdea = {
    ideaId,
    scores: rawScores,
    category,
    peptideFocus,
    subNiche: idea.subNiche as string | undefined,
    opportunityType,
    tags: idea.tags as string[] | undefined,
    title: idea.title as string | undefined,
    summary: idea.summary as string | undefined,
    status: idea.status as string | undefined,
    reviewNote: idea.reviewNote as string | undefined,
  };

  // ── Apply golden rules ──
  const afterRules = applyGoldenRules(scoredIdea, mockRules);

  // ── Apply feedback patterns ──
  const afterPatterns = applyFeedbackPatterns(afterRules, mockFeedbackPatterns);

  return afterPatterns.scores;
}

// ============================================================
// Reasoning builder
// ============================================================

function buildReasoning(params: {
  title: string;
  demand: number;
  competition: number;
  revenue: number;
  buildEffort: number;
  trend: number;
  overall: number;
  confidence: number;
  signalCount: number;
  category: string;
  peptideFocus: string[];
}): string {
  const {
    title,
    demand,
    competition,
    revenue,
    buildEffort,
    trend,
    overall,
    confidence,
    signalCount,
    category,
    peptideFocus,
  } = params;

  // Find the strongest and weakest dimensions
  const dimensions = [
    { name: "demand", score: demand },
    { name: "competition", score: competition },
    { name: "revenue", score: revenue },
    { name: "build effort", score: buildEffort },
    { name: "trend", score: trend },
  ].sort((a, b) => b.score - a.score);

  const strongest = dimensions[0];
  const weakest = dimensions[dimensions.length - 1];

  const overallLabel =
    overall >= 75
      ? "strong opportunity"
      : overall >= 60
        ? "moderate opportunity"
        : overall >= 45
          ? "marginal opportunity"
          : "weak opportunity";

  const confidenceLabel =
    confidence >= 80
      ? "high confidence"
      : confidence >= 50
        ? "moderate confidence"
        : confidence >= 30
          ? "low confidence"
          : "very low confidence";

  return `"${title}" scores ${Math.round(overall)}/100 overall, a ${overallLabel} with ${confidenceLabel} (${confidence}%). Based on ${signalCount} signals for ${peptideFocus.join(", ") || "general peptides"} in the ${category} category. Strongest dimension: ${strongest.name} at ${strongest.score}/100. Weakest: ${weakest.name} at ${weakest.score}/100.`;
}

/**
 * Score all ideas and return sorted results.
 * Useful for dashboard and ranking views.
 */
export async function scoreAllIdeas(): Promise<
  { ideaId: string; title: string; scores: ScoreResult }[]
> {
  const results: { ideaId: string; title: string; scores: ScoreResult }[] = [];

  for (const idea of mockIdeas) {
    try {
      const scores = await scoreIdea(idea.id as string);
      results.push({
        ideaId: idea.id as string,
        title: idea.title as string,
        scores,
      });
    } catch {
      // Skip ideas that can't be scored
      continue;
    }
  }

  return results.sort((a, b) => b.scores.overall - a.scores.overall);
}
