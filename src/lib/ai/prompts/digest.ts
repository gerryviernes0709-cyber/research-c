/**
 * Digest Compilation Prompt
 *
 * Used by the Tier 2 LLM (Claude Haiku) to compile the daily digest.
 * The digest is a structured summary of the day's intelligence delivered
 * to the user each morning.
 */

export interface DigestInput {
  date: string;
  newIdeas: {
    id: string;
    title: string;
    category: string;
    scoreOverall: number | string;
    scoreDemand: number | string;
    confidence: number | string;
    signalCount: number;
    summary: string;
    peptideFocus?: string[];
    subNiche?: string;
    opportunityType?: string;
  }[];
  trendDeltas: {
    keyword: string;
    currentValue: number | string;
    deltaPercent: number | string;
    source: string;
  }[];
  competitorEvents: {
    competitorName: string;
    event: string;
    details: string;
  }[];
  newPatterns: {
    description: string;
    confidence: number | string;
    patternType: string;
  }[];
  recentDecisions?: {
    action: string;
    ideaTitle: string;
    note?: string;
  }[];
  activeRulesSummary?: string;
}

export function buildDigestPrompt(data: DigestInput): string {
  const ideasSection = data.newIdeas.length
    ? data.newIdeas
        .map(
          (idea, i) =>
            `  ${i + 1}. "${idea.title}" [${idea.category}] | Score: ${idea.scoreOverall}/100 | Demand: ${idea.scoreDemand}/100 | Confidence: ${idea.confidence}% | Signals: ${idea.signalCount}\n     Peptides: ${idea.peptideFocus?.join(", ") ?? "General"} | Niche: ${idea.subNiche ?? "General"} | Type: ${idea.opportunityType ?? "Unknown"}\n     ${idea.summary.slice(0, 200)}`
        )
        .join("\n\n")
    : "  No new ideas today.";

  const trendsSection = data.trendDeltas.length
    ? data.trendDeltas
        .map(
          (t) =>
            `  - "${t.keyword}" [${t.source}]: ${t.currentValue} (${Number(t.deltaPercent) >= 0 ? "+" : ""}${t.deltaPercent}%)`
        )
        .join("\n")
    : "  No significant trend changes.";

  const competitorSection = data.competitorEvents.length
    ? data.competitorEvents
        .map((c) => `  - ${c.competitorName}: ${c.event} -- ${c.details}`)
        .join("\n")
    : "  No competitor events.";

  const patternsSection = data.newPatterns.length
    ? data.newPatterns
        .map(
          (p) =>
            `  - [${p.patternType}] ${p.description} (confidence: ${p.confidence}%)`
        )
        .join("\n")
    : "  No new patterns.";

  const decisionsSection = data.recentDecisions?.length
    ? data.recentDecisions
        .map(
          (d) =>
            `  - ${d.action}: "${d.ideaTitle}"${d.note ? ` -- "${d.note}"` : ""}`
        )
        .join("\n")
    : "";

  return `You are the PeptideIQ Brain compiling the daily intelligence digest for ${data.date}.

## YOUR TASK

Write a concise, actionable daily digest in HTML format. The user reads this every morning to understand what happened overnight and what needs attention. Be direct, opinionated, and data-driven.

## DIGEST STRUCTURE

1. **HEADLINE** (1-2 sentences): The single most important thing today. Lead with the most actionable insight.
2. **TOP OPPORTUNITIES** (ranked list): New or updated ideas worth the user's attention. Include scores and why they matter.
3. **TREND WATCH** (bullet list): Significant trend movements. Only include trends with notable changes (>5% delta).
4. **COMPETITOR INTEL** (bullet list): Any competitor events or new products discovered. Skip if nothing notable.
5. **LEARNING UPDATE** (1-2 sentences): Any new patterns detected or golden rules suggested. Skip if nothing new.
6. **ACTION ITEMS** (bullet list): Specific things the user should review or decide on today.

## TODAY'S DATA

### New/Updated Ideas
${ideasSection}

### Trend Deltas
${trendsSection}

### Competitor Events
${competitorSection}

### New Patterns Detected
${patternsSection}

${decisionsSection ? `### Recent Decisions\n${decisionsSection}` : ""}

${data.activeRulesSummary ? `### Active Rules Context\n${data.activeRulesSummary}` : ""}

## OUTPUT RULES

- Write in HTML (use h2, h3, p, ul, li, ol, strong, em tags)
- Be concise. The entire digest should be readable in 2-3 minutes.
- Lead every section with the most important item first.
- Use specific numbers: scores, percentages, signal counts.
- If an idea scores above 75, flag it as "high priority."
- If a trend delta exceeds 30%, flag it as "breakout."
- End with clear, actionable items the user can act on today.
- Do NOT use markdown. Output clean HTML only.
- Do NOT include html/head/body tags. Start directly with the content.`;
}
