/**
 * Feedback Pattern Modifier
 *
 * Applies soft influence from learned user feedback patterns.
 * Unlike golden rules (hard constraints), feedback patterns are
 * probabilistic nudges based on observed user behavior.
 */

import type { ScoreResult, ScoredIdea } from "@/lib/scoring/golden-rules";

// Re-export for convenience
export type { ScoreResult, ScoredIdea };

interface PatternInput {
  id?: string;
  patternDescription?: string;
  patternType?: string;
  confidence?: string | number;
  active?: boolean;
  appliedCount?: number;
  overrideCount?: number;
}

// ============================================================
// Pattern matching
// ============================================================

/**
 * Determine if a feedback pattern is relevant to a given idea.
 * Matching is done by pattern type against the idea's corresponding field.
 */
function patternMatchesIdea(
  pattern: PatternInput,
  idea: ScoredIdea
): boolean {
  const patternType = pattern.patternType ?? "";
  const description = (pattern.patternDescription ?? "").toLowerCase();

  switch (patternType) {
    case "category_preference": {
      // Check if the pattern's described category matches the idea's category
      const category = (idea.category ?? "").toLowerCase();
      // Look for category keywords in the description
      if (
        (description.includes("ai-powered") ||
          description.includes("ai tools") ||
          description.includes("calculator")) &&
        ["ai_app", "calculator", "saas_tool"].includes(category)
      )
        return true;
      if (description.includes("ebook") && category === "ebook") return true;
      if (description.includes("course") && category === "course") return true;
      if (description.includes("printable") && category === "printable")
        return true;
      if (description.includes("saas") && category === "saas_tool") return true;
      if (description.includes("community") && category === "community")
        return true;
      if (description.includes("membership") && category === "membership")
        return true;
      if (description.includes("tracker") && category === "tracker")
        return true;
      return false;
    }

    case "sub_niche_preference": {
      const subNiche = (idea.subNiche ?? "").toLowerCase();
      // Check if the pattern mentions the idea's sub-niche
      if (description.includes("anti-aging") && subNiche.includes("anti-aging"))
        return true;
      if (
        description.includes("cognitive") &&
        subNiche.includes("cognitive")
      )
        return true;
      if (
        description.includes("weight loss") &&
        subNiche.includes("weight loss")
      )
        return true;
      if (
        description.includes("muscle recovery") &&
        subNiche.includes("muscle recovery")
      )
        return true;
      if (description.includes("sleep") && subNiche.includes("sleep"))
        return true;
      if (description.includes("immune") && subNiche.includes("immune"))
        return true;
      if (description.includes("longevity") && subNiche.includes("longevity"))
        return true;
      return false;
    }

    case "price_range": {
      // Price range patterns affect low-value product categories
      if (description.includes("under $15") || description.includes("low")) {
        const lowValueCategories = ["printable", "template"];
        if (lowValueCategories.includes(idea.category ?? "")) return true;
      }
      return false;
    }

    case "product_type": {
      // Generic product type matching
      const category = (idea.category ?? "").toLowerCase();
      if (description.includes(category)) return true;
      return false;
    }

    case "trend_threshold": {
      // Trend patterns apply to ideas flagged as emerging trends
      if (idea.opportunityType === "emerging_trend") return true;
      return false;
    }

    case "competition_tolerance": {
      // Competition patterns apply to ideas in competitive markets
      if (idea.scores.competition < 40) return true; // Low competition score = high competition
      return false;
    }

    default:
      return false;
  }
}

/**
 * Determine if a pattern suggests approval or rejection.
 * Returns positive modifier for approval patterns, negative for rejection.
 */
function getPatternPolarity(pattern: PatternInput): 1 | -1 {
  const description = (pattern.patternDescription ?? "").toLowerCase();

  // Negative signals
  if (
    description.includes("declined") ||
    description.includes("rejected") ||
    description.includes("decline rate") ||
    description.includes("penalize") ||
    description.includes("avoid")
  ) {
    return -1;
  }

  // Positive signals (default)
  return 1;
}

// ============================================================
// Pattern application
// ============================================================

/**
 * Apply feedback patterns as soft score modifiers.
 *
 * Each matching pattern contributes: confidence * 0.1 * polarity
 * where polarity is +1 for approval patterns and -1 for rejection patterns.
 *
 * The modifier is additive to the overall score and then clamped to 0-100.
 */
export function applyFeedbackPatterns(
  idea: ScoredIdea,
  patterns: PatternInput[]
): ScoredIdea {
  const activePatterns = patterns.filter((p) => p.active);

  let totalModifier = 0;
  const appliedPatterns: string[] = [];

  for (const pattern of activePatterns) {
    if (!patternMatchesIdea(pattern, idea)) continue;

    const confidence = parseFloat(String(pattern.confidence ?? "0"));
    const polarity = getPatternPolarity(pattern);
    const modifier = confidence * 0.1 * polarity;

    totalModifier += modifier;
    appliedPatterns.push(
      `[${polarity > 0 ? "+" : ""}${modifier.toFixed(1)}] "${pattern.patternDescription?.slice(0, 80)}" (confidence: ${confidence.toFixed(0)}%)`
    );
  }

  if (appliedPatterns.length === 0) {
    return idea;
  }

  // Apply modifier
  const newOverall = Math.max(
    0,
    Math.min(100, Math.round(idea.scores.overall + totalModifier))
  );

  const patternNotes = `\n\nFeedback Pattern Adjustments (net ${totalModifier >= 0 ? "+" : ""}${totalModifier.toFixed(1)}):\n${appliedPatterns.join("\n")}`;

  return {
    ...idea,
    scores: {
      ...idea.scores,
      overall: newOverall,
      reasoning: idea.scores.reasoning + patternNotes,
    },
  };
}
