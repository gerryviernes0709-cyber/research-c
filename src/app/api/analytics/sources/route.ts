import { NextResponse } from "next/server";
import { mockSources } from "@/mock/data";

export async function GET() {
  try {
    const sourceStats = mockSources.map((s) => {
      const total = s.signalsTotal || 0;
      const relevant = s.signalsRelevant || 0;
      const relevanceRate = total > 0 ? Math.round((relevant / total) * 100) : 0;

      return {
        id: s.id,
        name: s.name,
        platform: s.platform,
        enabled: s.enabled,
        signalsTotal: total,
        signalsRelevant: relevant,
        relevanceRate,
        crawlFrequency: s.crawlFrequency,
        lastCrawledAt: s.lastCrawledAt,
        lastError: s.lastError || null,
        priority: s.priority,
      };
    });

    const totalSignals = sourceStats.reduce(
      (sum, s) => sum + s.signalsTotal,
      0
    );
    const totalRelevant = sourceStats.reduce(
      (sum, s) => sum + s.signalsRelevant,
      0
    );
    const activeSources = sourceStats.filter((s) => s.enabled).length;

    return NextResponse.json({
      sources: sourceStats,
      summary: {
        totalSources: sourceStats.length,
        activeSources,
        totalSignals,
        totalRelevant,
        overallRelevanceRate:
          totalSignals > 0
            ? Math.round((totalRelevant / totalSignals) * 100)
            : 0,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch source analytics" },
      { status: 500 }
    );
  }
}
