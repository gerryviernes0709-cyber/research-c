import { NextRequest, NextResponse } from "next/server";
import { mockIdeas } from "@/mock/data";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const idea = mockIdeas.find((i) => i.id === id);

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const scoreBreakdown = {
      demand: parseFloat(idea.scoreDemand || "0"),
      competition: parseFloat(idea.scoreCompetition || "0"),
      revenue: parseFloat(idea.scoreRevenue || "0"),
      buildEffort: parseFloat(idea.scoreBuildEffort || "0"),
      trend: parseFloat(idea.scoreTrend || "0"),
      overall: parseFloat(idea.scoreOverall || "0"),
      reasoning: idea.scoreReasoning || "No scoring data available.",
      confidence: parseFloat(idea.confidence || "0"),
    };

    return NextResponse.json({
      ideaId: id,
      score: scoreBreakdown,
      scoredAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to score idea" },
      { status: 500 }
    );
  }
}
