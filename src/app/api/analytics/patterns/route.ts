import { NextResponse } from "next/server";
import { mockFeedbackPatterns } from "@/mock/data";

export async function GET() {
  try {
    const patterns = mockFeedbackPatterns.map((p) => ({
      id: p.id,
      description: p.patternDescription,
      type: p.patternType,
      confidence: parseFloat(String(p.confidence || "0")),
      appliedCount: p.appliedCount || 0,
      overrideCount: p.overrideCount || 0,
      active: p.active,
      suggestedAsRule: p.suggestedAsRule,
      detectedAt: p.detectedAt,
      evidence: p.evidence || [],
    }));

    return NextResponse.json({ patterns });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch feedback patterns" },
      { status: 500 }
    );
  }
}
