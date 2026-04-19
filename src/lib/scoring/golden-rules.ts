/**
 * Golden Rule Modifier Logic
 *
 * Applies golden rules to a scored idea, modifying scores based on
 * rule direction, weight, and keyword matching.
 */

// ============================================================
// Types
// ============================================================

export interface ScoreResult {
  overall: number;
  demand: number;
  competition: number;
  revenue: number;
  buildEffort: number;
  trend: number;
  reasoning: string;
  confidence: number;
}

export interface ScoredIdea {
  ideaId: string;
  scores: ScoreResult;
  category?: string;
  peptideFocus?: string[];
  subNiche?: string;
  opportunityType?: string;
  tags?: string[];
  title?: string;
  summary?: string;
  status?: string;
  reviewNote?: string;
}

interface RuleInput {
  id?: string;
  ruleText?: string;
  ruleType?: string;
  direction?: string;
  weight?: string | number;
  active?: boolean;
  approved?: boolean;
}

// ============================================================
// Rule matching
// ============================================================

/**
 * Check whether a rule applies to a given idea by keyword matching
 * the rule text against the idea's category, peptideFocus, subNiche,
 * opportunityType, tags, title, and summary.
 */
function ruleMatchesIdea(rule: RuleInput, idea: ScoredIdea): boolean {
  const ruleText = (rule.ruleText ?? "").toLowerCase();

  // Build a searchable string from the idea's key fields
  const ideaFields = [
    idea.category ?? "",
    ...(idea.peptideFocus ?? []),
    idea.subNiche ?? "",
    idea.opportunityType ?? "",
    ...(idea.tags ?? []),
    idea.title ?? "",
    idea.summary ?? "",
  ]
    .join(" ")
    .toLowerCase();

  // Extract meaningful keywords from the rule text (skip common stop words)
  const stopWords = new Set([
    "never", "always", "any", "the", "a", "an", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "must", "shall", "can",
    "need", "dare", "ought", "used", "to", "of", "in", "for", "on", "with",
    "at", "by", "from", "as", "into", "through", "during", "before", "after",
    "above", "below", "between", "out", "off", "over", "under", "again",
    "further", "then", "once", "here", "there", "when", "where", "why", "how",
    "all", "each", "every", "both", "few", "more", "most", "other", "some",
    "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
    "very", "just", "because", "but", "and", "or", "if", "while", "that",
    "this", "these", "those", "it", "its", "our", "we", "they", "them",
    "their", "what", "which", "who", "whom", "suggest", "consider",
    "prefer", "ideas", "idea", "products", "product", "boost", "penalize",
    "block", "require", "minimum", "user", "shows", "strong", "preference",
    "consistently",
  ]);

  const ruleKeywords = ruleText
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // A rule matches if at least one keyword is found in the idea fields
  // For multi-word concepts (like "bpc-157"), we also check the full phrase
  if (ruleKeywords.length === 0) return false;

  // Check for direct keyword matches
  const hasKeywordMatch = ruleKeywords.some((keyword) =>
    ideaFields.includes(keyword)
  );

  // Also check for specific patterns in the rule text
  const hasPatternMatch = checkPatternMatch(ruleText, idea);

  return hasKeywordMatch || hasPatternMatch;
}

/**
 * Check for more nuanced pattern matches that simple keyword matching might miss.
 */
function checkPatternMatch(ruleText: string, idea: ScoredIdea): boolean {
  const category = (idea.category ?? "").toLowerCase();
  const subNiche = (idea.subNiche ?? "").toLowerCase();

  // Pattern: "standalone X guides" -> match specific peptide + ebook/guide category
  if (ruleText.includes("standalone") && ruleText.includes("guide")) {
    const isGuideCategory = ["ebook", "course"].includes(category);
    if (isGuideCategory) {
      // Check if the mentioned peptide matches
      for (const peptide of idea.peptideFocus ?? []) {
        if (ruleText.includes(peptide.toLowerCase())) return true;
      }
    }
  }

  // Pattern: "ai-powered" or "ai tools" or "calculators"
  if (
    ruleText.includes("ai-powered") ||
    ruleText.includes("ai tools") ||
    ruleText.includes("calculators")
  ) {
    if (["ai_app", "calculator", "saas_tool"].includes(category)) return true;
  }

  // Pattern: "priced under $X"
  const priceMatch = ruleText.match(/priced?\s+under\s+\$(\d+)/);
  if (priceMatch) {
    // Low-price categories: printable, template, ebook
    if (["printable", "template"].includes(category)) return true;
  }

  // Pattern: "saas" or "subscription"
  if (ruleText.includes("saas") || ruleText.includes("subscription")) {
    if (
      ["saas_tool", "ai_app", "membership", "community"].includes(category)
    )
      return true;
  }

  // Pattern: sub-niche mentions
  if (ruleText.includes("anti-aging") && subNiche.includes("anti-aging"))
    return true;
  if (
    ruleText.includes("cognitive") &&
    subNiche.includes("cognitive")
  )
    return true;

  // Pattern: "printable templates"
  if (
    (ruleText.includes("printable") || ruleText.includes("template")) &&
    ["printable", "template"].includes(category)
  )
    return true;

  // Pattern: "ebook" mentions
  if (ruleText.includes("ebook") && category === "ebook") return true;

  // Pattern: "recurring revenue"
  if (ruleText.includes("recurring revenue") || ruleText.includes("recurring")) {
    if (
      ["saas_tool", "ai_app", "membership", "community", "coaching"].includes(
        category
      )
    )
      return true;
  }

  // Pattern: "saturated" with competitor count
  if (ruleText.includes("saturated")) {
    // We can't check exact competitor count here, but if tags mention "saturated"
    if (idea.tags?.some((t) => t.includes("saturated"))) return true;
  }

  // Pattern: trend-related rules
  if (ruleText.includes("emerging trend") || ruleText.includes("google trends")) {
    if (idea.opportunityType === "emerging_trend") return true;
  }

  return false;
}

// ============================================================
// Rule application
// ============================================================

/**
 * Check if a "require" rule's requirement is satisfied for an idea.
 * Returns true if the requirement IS satisfied, false if it is NOT.
 */
function isRequirementSatisfied(
  rule: RuleInput,
  idea: ScoredIdea
): boolean {
  const ruleText = (rule.ruleText ?? "").toLowerCase();

  // "require minimum 3 signals from 2+ sources"
  if (ruleText.includes("minimum") && ruleText.includes("signal")) {
    // We can't check exact signal count from the scored idea alone,
    // so check if confidence is reasonable (> 30 means at least some signals)
    return idea.scores.confidence > 30;
  }

  // Default: assume satisfied if we can't evaluate
  return true;
}

/**
 * Apply golden rules to a scored idea.
 *
 * Rule effects:
 * - **block**: Auto-decline the idea (set overall to 0)
 * - **penalize**: Reduce overall score by rule.weight * 20 points
 * - **boost**: Increase overall score by rule.weight * 20 points
 * - **require**: If requirement not satisfied, penalize by 30 points
 *
 * Final score is clamped to 0-100.
 */
export function applyGoldenRules(
  idea: ScoredIdea,
  rules: RuleInput[]
): ScoredIdea {
  // Only process active, approved rules
  const activeRules = rules.filter((r) => r.active && r.approved);

  let modifiedOverall = idea.scores.overall;
  const appliedRules: string[] = [];
  let blocked = false;

  for (const rule of activeRules) {
    if (!ruleMatchesIdea(rule, idea)) continue;

    const weight = parseFloat(String(rule.weight ?? "1.00"));
    const direction = rule.direction ?? "penalize";

    switch (direction) {
      case "block": {
        modifiedOverall = 0;
        blocked = true;
        appliedRules.push(
          `[BLOCKED] "${rule.ruleText}" -- Idea auto-declined.`
        );
        break;
      }
      case "penalize": {
        const penalty = weight * 20;
        modifiedOverall -= penalty;
        appliedRules.push(
          `[PENALIZED -${penalty.toFixed(0)}] "${rule.ruleText}"`
        );
        break;
      }
      case "boost": {
        const boost = weight * 20;
        modifiedOverall += boost;
        appliedRules.push(
          `[BOOSTED +${boost.toFixed(0)}] "${rule.ruleText}"`
        );
        break;
      }
      case "require": {
        if (!isRequirementSatisfied(rule, idea)) {
          modifiedOverall -= 30;
          appliedRules.push(
            `[REQUIREMENT NOT MET -30] "${rule.ruleText}"`
          );
        }
        break;
      }
    }

    // Short-circuit if blocked
    if (blocked) break;
  }

  // Clamp to 0-100
  modifiedOverall = Math.max(0, Math.min(100, Math.round(modifiedOverall)));

  // Build updated reasoning
  const ruleNotes =
    appliedRules.length > 0
      ? `\n\nGolden Rule Adjustments:\n${appliedRules.join("\n")}`
      : "";

  return {
    ...idea,
    scores: {
      ...idea.scores,
      overall: modifiedOverall,
      reasoning: idea.scores.reasoning + ruleNotes,
    },
    status: blocked ? "declined" : idea.status,
    reviewNote: blocked
      ? `Auto-declined by golden rule: ${appliedRules[0]}`
      : idea.reviewNote,
  };
}
