/**
 * Scoring Prompt
 *
 * Used by the Tier 2 LLM (Claude Haiku) to score ideas across 5 dimensions.
 * The prompt instructs the model to output structured JSON that the scoring
 * engine can parse and store.
 */

export interface ScoringPromptInput {
  title: string;
  summary: string;
  category: string;
  peptideFocus?: string[];
  subNiche?: string;
  opportunityType?: string;
  signals: {
    source: string;
    contentType: string;
    contentSummary?: string;
    engagementMetrics?: Record<string, unknown>;
    relevanceScore?: string | number;
  }[];
  competitorProducts?: {
    name: string;
    category?: string;
    price?: string | number;
    priceModel?: string;
    rating?: string | number;
    reviewCount?: number;
  }[];
  trendData?: {
    keyword: string;
    deltaPercent?: string | number;
    value?: string | number;
  }[];
}

export function buildScoringPrompt(idea: ScoringPromptInput): string {
  const signalsSummary = idea.signals
    .map(
      (s, i) =>
        `  ${i + 1}. [${s.source}/${s.contentType}] ${s.contentSummary ?? "No summary"} | Engagement: ${JSON.stringify(s.engagementMetrics ?? {})} | Relevance: ${s.relevanceScore ?? "N/A"}`
    )
    .join("\n");

  const competitorSection = idea.competitorProducts?.length
    ? `\n## COMPETITOR PRODUCTS\n${idea.competitorProducts
        .map(
          (c, i) =>
            `  ${i + 1}. "${c.name}" [${c.category ?? "unknown"}] $${c.price ?? "?"} (${c.priceModel ?? "?"}) | Rating: ${c.rating ?? "?"}/5 (${c.reviewCount ?? 0} reviews)`
        )
        .join("\n")}`
    : "";

  const trendSection = idea.trendData?.length
    ? `\n## TREND DATA\n${idea.trendData
        .map(
          (t) =>
            `  - "${t.keyword}": value ${t.value ?? "?"}, delta ${t.deltaPercent ?? "?"}%`
        )
        .join("\n")}`
    : "";

  return `You are a product opportunity scoring analyst for the peptide/biohacking niche.

Score the following idea across 5 dimensions, each from 0 to 100. Provide a short reasoning sentence for each dimension plus an overall reasoning paragraph.

## SCORING DIMENSIONS

1. **demand** (0-100): How strong is the evidence of market demand? Consider signal count, engagement metrics (upvotes, views, comments), search volume, and the frequency/recency of demand signals.
   - 80-100: Overwhelming demand. Multiple high-engagement signals from diverse sources.
   - 60-79: Strong demand. Clear evidence from several signals.
   - 40-59: Moderate demand. Some signals but limited engagement.
   - 20-39: Weak demand. Few signals, low engagement.
   - 0-19: Minimal/no demand evidence.

2. **competition** (0-100): How favorable is the competitive landscape? HIGH score = LESS competition = more opportunity.
   - 80-100: Zero or near-zero competition. Clear blue ocean.
   - 60-79: Light competition. Existing products are weak or poorly executed.
   - 40-59: Moderate competition. Some established players but room for differentiation.
   - 20-39: Heavy competition. Many established products. Differentiation is difficult.
   - 0-19: Saturated market. Dominated by strong incumbents.

3. **revenue** (0-100): How strong is the revenue potential? Consider pricing power, market size, recurring vs one-time revenue, and monetization model viability.
   - 80-100: Strong recurring revenue potential. High pricing power. Large addressable market.
   - 60-79: Good revenue potential. Moderate pricing, clear monetization path.
   - 40-59: Moderate. Limited pricing power or small market.
   - 20-39: Low revenue potential. Commodity pricing or very niche market.
   - 0-19: Monetization is unclear or impractical.

4. **buildEffort** (0-100): How easy is it to build? HIGH score = EASIER to build = less effort required.
   - 80-100: Very easy. Can be built in 1-2 weeks with standard tools.
   - 60-79: Moderate. 3-6 weeks of focused development.
   - 40-59: Significant effort. 2-3 months with specialized requirements.
   - 20-39: Major project. 3-6 months with complex technical challenges.
   - 0-19: Massive undertaking. Requires deep expertise and significant resources.

5. **trend** (0-100): How favorable are the trend signals? Is interest growing, stable, or declining?
   - 80-100: Strong upward trend. 30%+ growth in recent months.
   - 60-79: Moderate upward trend. 10-30% growth.
   - 40-59: Stable. No significant growth or decline.
   - 20-39: Declining interest.
   - 0-19: Rapidly declining or dead trend.

## IDEA TO SCORE

**Title:** ${idea.title}
**Category:** ${idea.category}
**Peptide Focus:** ${idea.peptideFocus?.join(", ") ?? "General"}
**Sub-Niche:** ${idea.subNiche ?? "Not specified"}
**Opportunity Type:** ${idea.opportunityType ?? "Not specified"}

**Summary:** ${idea.summary}

## EVIDENCE (${idea.signals.length} signals)
${signalsSummary}
${competitorSection}
${trendSection}

## OUTPUT FORMAT

Respond with ONLY a JSON object in this exact format (no markdown, no code fences):
{
  "demand": <0-100>,
  "competition": <0-100>,
  "revenue": <0-100>,
  "buildEffort": <0-100>,
  "trend": <0-100>,
  "overall": <0-100>,
  "reasoning": "<2-4 sentence overall assessment>",
  "dimensionReasoning": {
    "demand": "<1 sentence>",
    "competition": "<1 sentence>",
    "revenue": "<1 sentence>",
    "buildEffort": "<1 sentence>",
    "trend": "<1 sentence>"
  }
}

The "overall" score should be the weighted average of all 5 dimensions (equal 20% weight each), but you may adjust it up to +/- 5 points based on your holistic assessment.`;
}
