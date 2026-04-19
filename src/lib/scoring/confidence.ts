/**
 * Confidence Calculator
 *
 * Calculates a confidence score (0-100) for an idea based on the quality
 * and diversity of its evidence signals.
 */

interface SignalInput {
  source?: string;
  engagementMetrics?: Record<string, unknown>;
  relevanceScore?: string | number;
}

/**
 * Calculate confidence score based on signal count, source diversity,
 * and engagement quality.
 *
 * @param signals - Array of signals linked to the idea
 * @returns Confidence score from 0-100
 */
export function calculateConfidence(signals: SignalInput[]): number {
  if (signals.length === 0) return 5; // Minimum confidence for ideas with no signals

  // ── Signal count base score ──
  // 10+  signals = high base (60)
  // 5-9  signals = medium base (45)
  // 2-4  signals = low base (25)
  // 1    signal  = very low base (15)
  let baseScore: number;
  if (signals.length >= 10) {
    baseScore = 60;
  } else if (signals.length >= 5) {
    baseScore = 45;
  } else if (signals.length >= 2) {
    baseScore = 25;
  } else {
    baseScore = 15;
  }

  // ── Source diversity modifier ──
  // 3+ unique sources = +15 bonus
  // 2 unique sources  = +5 bonus
  // 1 source          = -10 penalty
  const uniqueSources = new Set(
    signals.map((s) => s.source).filter(Boolean)
  );
  let diversityModifier: number;
  if (uniqueSources.size >= 3) {
    diversityModifier = 15;
  } else if (uniqueSources.size === 2) {
    diversityModifier = 5;
  } else {
    diversityModifier = -10;
  }

  // ── Engagement quality modifier ──
  // For each signal with high engagement, add a small bonus.
  // "High engagement" = upvotes > 100, views > 10000, comments > 50, likes > 1000
  let engagementBonus = 0;
  let highEngagementCount = 0;

  for (const signal of signals) {
    const metrics = signal.engagementMetrics as Record<string, number> | undefined;
    if (!metrics) continue;

    const isHighEngagement =
      (metrics.upvotes ?? 0) > 100 ||
      (metrics.views ?? 0) > 10000 ||
      (metrics.comments ?? 0) > 50 ||
      (metrics.likes ?? 0) > 1000;

    if (isHighEngagement) {
      highEngagementCount++;
    }
  }

  // Each high-engagement signal adds +3, capped at +15
  engagementBonus = Math.min(highEngagementCount * 3, 15);

  // ── Relevance quality modifier ──
  // Average relevance score of signals adds a small bonus/penalty
  const relevanceScores = signals
    .map((s) => parseFloat(String(s.relevanceScore ?? "0")))
    .filter((v) => v > 0);

  let relevanceModifier = 0;
  if (relevanceScores.length > 0) {
    const avgRelevance =
      relevanceScores.reduce((sum, v) => sum + v, 0) / relevanceScores.length;
    if (avgRelevance >= 80) {
      relevanceModifier = 10;
    } else if (avgRelevance >= 60) {
      relevanceModifier = 5;
    } else if (avgRelevance < 40) {
      relevanceModifier = -5;
    }
  }

  // ── Compute final score ──
  const raw =
    baseScore + diversityModifier + engagementBonus + relevanceModifier;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(raw)));
}
