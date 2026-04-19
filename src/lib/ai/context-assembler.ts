/**
 * Brain Context Assembler
 *
 * The brain of the Brain. Builds the dynamic system prompt for each
 * conversation by combining the base personality prompt with:
 * - Active golden rules
 * - Learned feedback patterns
 * - Recent user decisions
 * - Mode-specific context (idea detail, market overview, etc.)
 */

import { BRAIN_SYSTEM_PROMPT } from "@/lib/ai/prompts/brain-system";
import {
  mockIdeas,
  mockSignals,
  mockRules,
  mockFeedbackPatterns,
  mockActivity,
  mockTrends,
  mockAnnotations,
  mockCompetitors,
} from "@/mock/data";

// ============================================================
// Types
// ============================================================

export interface BrainContext {
  systemPrompt: string;
  goldenRules: string;
  feedbackPatterns: string;
  recentDecisions: string;
  modeContext: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
}

export type BrainMode =
  | "global"
  | "idea"
  | "comparison"
  | "strategy"
  | "explore";

export interface AssembleParams {
  mode: BrainMode;
  conversationId?: string;
  ideaId?: string;
  ideaIds?: string[];
  recentMessages?: { role: string; content: string }[];
}

// ============================================================
// Context section builders
// ============================================================

/**
 * Build the golden rules section from active, approved rules.
 */
function buildGoldenRulesSection(): string {
  const activeRules = mockRules.filter((r) => r.active && r.approved);

  if (activeRules.length === 0) {
    return "No active golden rules.";
  }

  const lines = activeRules.map((r) => {
    const directionEmoji =
      r.direction === "block"
        ? "[BLOCK]"
        : r.direction === "penalize"
          ? "[PENALIZE]"
          : r.direction === "boost"
            ? "[BOOST]"
            : "[REQUIRE]";
    const weight = parseFloat(String(r.weight ?? "1.00"));
    return `- ${directionEmoji} (weight: ${weight.toFixed(2)}) ${r.ruleText} [${r.ruleType}, source: ${r.source}]`;
  });

  return lines.join("\n");
}

/**
 * Build the feedback patterns section from patterns with confidence > 50%.
 */
function buildFeedbackPatternsSection(): string {
  const relevantPatterns = mockFeedbackPatterns.filter(
    (p) => p.active && parseFloat(String(p.confidence ?? "0")) > 50
  );

  if (relevantPatterns.length === 0) {
    return "No significant feedback patterns detected yet.";
  }

  const lines = relevantPatterns.map((p) => {
    const conf = parseFloat(String(p.confidence ?? "0"));
    const suggested = p.suggestedAsRule ? " [SUGGESTED AS RULE]" : "";
    return `- [${p.patternType}] (confidence: ${conf.toFixed(0)}%) ${p.patternDescription} | Applied ${p.appliedCount ?? 0}x, overridden ${p.overrideCount ?? 0}x${suggested}`;
  });

  return lines.join("\n");
}

/**
 * Build recent decisions section from the activity log.
 * Returns the last 20 idea approval/decline entries.
 */
function buildRecentDecisionsSection(): string {
  const decisions = mockActivity
    .filter(
      (a) =>
        a.action === "idea_approved" ||
        a.action === "idea_declined"
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime()
    )
    .slice(0, 20);

  if (decisions.length === 0) {
    return "No recent idea decisions.";
  }

  const lines = decisions.map((d) => {
    const idea = mockIdeas.find((i) => i.id === d.entityId);
    const action = d.action === "idea_approved" ? "APPROVED" : "DECLINED";
    const details = d.details as Record<string, unknown> | undefined;
    const note = details?.note ? ` -- "${details.note}"` : "";
    const title = idea?.title ?? d.entityId ?? "Unknown";
    const date = d.createdAt
      ? new Date(d.createdAt as string).toLocaleDateString()
      : "Unknown date";
    return `- [${action}] "${title}" (${date})${note}`;
  });

  return lines.join("\n");
}

// ============================================================
// Mode-specific context builders
// ============================================================

/**
 * Global mode: market overview, top trends, pipeline summary.
 */
function buildGlobalContext(): string {
  // Top 5 trending keywords (most recent snapshots with highest delta)
  const latestTrends = new Map<
    string,
    { keyword: string; value: string; delta: string; capturedAt: string }
  >();

  for (const t of mockTrends) {
    const existing = latestTrends.get(t.keyword as string);
    if (
      !existing ||
      new Date(t.capturedAt as string).getTime() >
        new Date(existing.capturedAt).getTime()
    ) {
      latestTrends.set(t.keyword as string, {
        keyword: t.keyword as string,
        value: String(t.value ?? "0"),
        delta: String(t.deltaPercent ?? "0"),
        capturedAt: t.capturedAt as string,
      });
    }
  }

  const topTrends = Array.from(latestTrends.values())
    .sort(
      (a, b) =>
        Math.abs(parseFloat(b.delta)) - Math.abs(parseFloat(a.delta))
    )
    .slice(0, 5);

  const trendLines = topTrends
    .map(
      (t) =>
        `  - "${t.keyword}": value ${t.value}, delta ${parseFloat(t.delta) >= 0 ? "+" : ""}${t.delta}%`
    )
    .join("\n");

  // Pipeline summary by status
  const statusCounts: Record<string, number> = {};
  for (const idea of mockIdeas) {
    const s = (idea.status as string) ?? "detected";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  const statusLines = Object.entries(statusCounts)
    .map(([status, count]) => `  - ${status}: ${count}`)
    .join("\n");

  // Top scored ideas
  const topIdeas = [...mockIdeas]
    .sort(
      (a, b) =>
        parseFloat(String(b.scoreOverall ?? "0")) -
        parseFloat(String(a.scoreOverall ?? "0"))
    )
    .slice(0, 5);

  const topIdeasLines = topIdeas
    .map(
      (i) =>
        `  - "${i.title}" [${i.category}] -- Score: ${i.scoreOverall}/100, Status: ${i.status}, Signals: ${i.sourceSignalsCount ?? 0}`
    )
    .join("\n");

  // Total signal count
  const totalSignals = mockSignals.length;
  const processedSignals = mockSignals.filter((s) => s.processed).length;

  return `## MARKET OVERVIEW

**Pipeline:**
${statusLines}

**Total Signals:** ${totalSignals} (${processedSignals} processed)

**Top 5 Trending Keywords:**
${trendLines}

**Top 5 Ideas by Score:**
${topIdeasLines}

**Active Competitors:** ${mockCompetitors.filter((c) => c.active).length}
**Total Competitor Products Tracked:** ${mockCompetitors.reduce(
    (sum, c) => sum + (c.products?.length ?? 0),
    0
  )}`;
}

/**
 * Idea mode: full detail for a specific idea + linked signals + annotations.
 */
function buildIdeaContext(ideaId: string): string {
  const idea = mockIdeas.find((i) => i.id === ideaId);
  if (!idea) {
    return `Idea "${ideaId}" not found in the database.`;
  }

  const signals = mockSignals.filter((s) => s.ideaId === ideaId);
  const annotations = mockAnnotations.filter((a) => a.ideaId === ideaId);

  const signalLines = signals.length
    ? signals
        .map(
          (s) =>
            `  - [${s.source}/${s.contentType}] "${s.sourceTitle ?? "Untitled"}" | Relevance: ${s.relevanceScore ?? "N/A"} | Engagement: ${JSON.stringify(s.engagementMetrics ?? {})}`
        )
        .join("\n")
    : "  No signals linked to this idea.";

  const annotationLines = annotations.length
    ? annotations
        .map(
          (a) =>
            `  - [${a.annotationType}] ${a.content} (${new Date(a.createdAt as string).toLocaleDateString()})`
        )
        .join("\n")
    : "  No annotations.";

  return `## CURRENT IDEA: ${idea.title}

**ID:** ${idea.id}
**Category:** ${idea.category}
**Status:** ${idea.status}
**Peptide Focus:** ${(idea.peptideFocus as string[])?.join(", ") ?? "General"}
**Sub-Niche:** ${idea.subNiche ?? "Not specified"}
**Opportunity Type:** ${idea.opportunityType ?? "Not specified"}
**Tags:** ${(idea.tags as string[])?.join(", ") ?? "None"}

**Summary:**
${idea.summary}

### Scores
- **Overall:** ${idea.scoreOverall ?? "Not scored"}/100
- **Demand:** ${idea.scoreDemand ?? "?"}/100
- **Competition:** ${idea.scoreCompetition ?? "?"}/100
- **Revenue:** ${idea.scoreRevenue ?? "?"}/100
- **Build Effort:** ${idea.scoreBuildEffort ?? "?"}/100
- **Trend:** ${idea.scoreTrend ?? "?"}/100
- **Confidence:** ${idea.confidence ?? "?"}%
- **Evidence Count:** ${idea.evidenceCount ?? 0}

**Score Reasoning:**
${idea.scoreReasoning ?? "No reasoning available."}

${idea.reviewNote ? `**Review Note:** ${idea.reviewNote}` : ""}

### Linked Signals (${signals.length})
${signalLines}

### Annotations (${annotations.length})
${annotationLines}

### Timeline
- First Detected: ${idea.firstDetectedAt ? new Date(idea.firstDetectedAt as string).toLocaleDateString() : "Unknown"}
- Last Signal: ${idea.lastSignalAt ? new Date(idea.lastSignalAt as string).toLocaleDateString() : "Unknown"}
- Last Updated: ${idea.updatedAt ? new Date(idea.updatedAt as string).toLocaleDateString() : "Unknown"}`;
}

/**
 * Comparison mode: side-by-side details for 2-3 ideas.
 */
function buildComparisonContext(ideaIds: string[]): string {
  const ideas = ideaIds
    .map((id) => mockIdeas.find((i) => i.id === id))
    .filter(Boolean);

  if (ideas.length === 0) {
    return "No valid ideas found for comparison.";
  }

  const ideaBlocks = ideas.map((idea) => {
    const signals = mockSignals.filter((s) => s.ideaId === idea!.id);
    const sources = new Set(signals.map((s) => s.source));

    return `### ${idea!.title}
- **ID:** ${idea!.id}
- **Category:** ${idea!.category} | **Status:** ${idea!.status}
- **Peptides:** ${(idea!.peptideFocus as string[])?.join(", ") ?? "General"}
- **Sub-Niche:** ${idea!.subNiche ?? "N/A"} | **Type:** ${idea!.opportunityType ?? "N/A"}
- **Overall Score:** ${idea!.scoreOverall ?? "?"}/100
  - Demand: ${idea!.scoreDemand ?? "?"} | Competition: ${idea!.scoreCompetition ?? "?"} | Revenue: ${idea!.scoreRevenue ?? "?"} | Build: ${idea!.scoreBuildEffort ?? "?"} | Trend: ${idea!.scoreTrend ?? "?"}
- **Confidence:** ${idea!.confidence ?? "?"}% | **Signals:** ${signals.length} from ${sources.size} sources
- **Summary:** ${(idea!.summary as string)?.slice(0, 200) ?? "N/A"}...`;
  });

  return `## IDEA COMPARISON (${ideas.length} ideas)

${ideaBlocks.join("\n\n")}

When comparing, consider: which scores higher on the dimensions that matter most for our strategy? Which has stronger evidence? Which is faster to build and validate?`;
}

/**
 * Strategy mode: all approved ideas, competitor landscape, strategic overview.
 */
function buildStrategyContext(): string {
  const approvedIdeas = mockIdeas.filter((i) => i.status === "approved");
  const approvedLines = approvedIdeas
    .map(
      (i) =>
        `  - "${i.title}" [${i.category}] Score: ${i.scoreOverall}/100 | Peptides: ${(i.peptideFocus as string[])?.join(", ") ?? "?"}`
    )
    .join("\n");

  // Competitor landscape
  const competitorLines = mockCompetitors
    .filter((c) => c.active)
    .map((c) => {
      const productSummary = c.products
        .map(
          (p: Record<string, unknown>) =>
            `"${p.name ?? "?"}" [${p.category ?? "?"}] $${p.price ?? "?"} (${p.priceModel ?? "?"})`
        )
        .join("; ");
      return `  - **${c.name}** (${c.platform ?? "?"}) [Priority: ${c.watchPriority}]\n    Products: ${productSummary}`;
    })
    .join("\n");

  // Category distribution of approved ideas
  const categoryCounts: Record<string, number> = {};
  for (const idea of approvedIdeas) {
    const cat = (idea.category as string) ?? "other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const categoryLines = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => `  - ${cat}: ${count}`)
    .join("\n");

  return `## STRATEGIC OVERVIEW

### Approved Pipeline (${approvedIdeas.length} ideas)
${approvedLines || "  No approved ideas yet."}

### Category Distribution (Approved)
${categoryLines || "  No data."}

### Competitor Landscape (${mockCompetitors.filter((c) => c.active).length} active)
${competitorLines}

### Strategic Questions to Consider
- Are we diversified enough across categories, or over-concentrated?
- Which approved ideas should be built first based on score + effort?
- Are there gaps in the competitor landscape we can exploit?
- Should any golden rules be updated based on recent decisions?`;
}

/**
 * Explore mode: describe available capabilities.
 */
function buildExploreContext(): string {
  return `## AVAILABLE CAPABILITIES

You can help the user with any of the following:

### Idea Analysis
- **Score Breakdown**: Explain why any idea received its scores across all 5 dimensions
- **Idea Deep Dive**: Full analysis of a specific idea with all linked signals and annotations
- **Idea Comparison**: Side-by-side comparison of 2-3 ideas to help prioritize

### Market Intelligence
- **Trend Analysis**: Current trend data for peptide keywords with growth rates and projections
- **Competitor Intel**: Overview of tracked competitors, their products, pricing, and movements
- **Signal Review**: Summary of recent signals from all monitored sources

### Strategic Guidance
- **Pipeline Review**: Overview of all ideas by status with recommendations
- **Category Analysis**: Which product categories are performing best
- **Niche Assessment**: Deep dive into any peptide sub-niche

### System Management
- **Golden Rules**: Review, suggest modifications to, or explain the impact of golden rules
- **Feedback Patterns**: Show learned patterns from user decisions
- **Scoring Calibration**: Discuss whether scores feel right and suggest adjustments

### Daily Operations
- **Digest Preview**: Preview today's digest before it's sent
- **Action Items**: What needs the user's attention right now
- **Quick Stats**: Key metrics at a glance

Ask me about any of these, or just tell me what you're thinking about and I'll guide you to the right analysis.`;
}

// ============================================================
// Main assembler
// ============================================================

/**
 * Assemble the complete Brain context for a conversation.
 *
 * This is the core function that builds the dynamic system prompt by combining
 * the base personality with golden rules, feedback patterns, recent decisions,
 * and mode-specific context.
 */
export async function assembleBrainContext(
  params: AssembleParams
): Promise<BrainContext> {
  // Build each context section
  const goldenRules = buildGoldenRulesSection();
  const feedbackPatterns = buildFeedbackPatternsSection();
  const recentDecisions = buildRecentDecisionsSection();

  // Build mode-specific context
  let modeContext: string;
  switch (params.mode) {
    case "global":
      modeContext = buildGlobalContext();
      break;
    case "idea":
      modeContext = params.ideaId
        ? buildIdeaContext(params.ideaId)
        : "No idea ID provided. Showing global context instead.\n\n" +
          buildGlobalContext();
      break;
    case "comparison":
      modeContext =
        params.ideaIds && params.ideaIds.length > 0
          ? buildComparisonContext(params.ideaIds)
          : "No idea IDs provided for comparison.";
      break;
    case "strategy":
      modeContext = buildStrategyContext();
      break;
    case "explore":
      modeContext = buildExploreContext();
      break;
    default:
      modeContext = buildGlobalContext();
  }

  // Assemble the full system prompt
  const systemPrompt = `${BRAIN_SYSTEM_PROMPT}

---

## ACTIVE GOLDEN RULES
These are hard constraints. Always respect them.

${goldenRules}

---

## LEARNED FEEDBACK PATTERNS
These are soft influences from observed user behavior. Reference them when relevant but don't auto-apply without the user's awareness.

${feedbackPatterns}

---

## RECENT DECISIONS
The user's most recent idea approvals and declines. Use these to understand current preferences.

${recentDecisions}

---

## CURRENT CONTEXT (Mode: ${params.mode.toUpperCase()})

${modeContext}`;

  // Format conversation history for Anthropic API
  const conversationHistory: { role: "user" | "assistant"; content: string }[] =
    (params.recentMessages ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

  return {
    systemPrompt,
    goldenRules,
    feedbackPatterns,
    recentDecisions,
    modeContext,
    conversationHistory,
  };
}
