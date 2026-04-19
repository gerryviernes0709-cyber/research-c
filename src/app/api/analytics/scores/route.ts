import { NextResponse } from "next/server";
import { mockIdeas } from "@/mock/data";

export async function GET() {
  try {
    const distribution = {
      "0-20": 0,
      "20-40": 0,
      "40-60": 0,
      "60-80": 0,
      "80-100": 0,
    };

    const scores: Array<{
      id: string;
      title: string;
      overall: number;
      demand: number;
      competition: number;
      revenue: number;
      buildEffort: number;
      trend: number;
    }> = [];

    for (const idea of mockIdeas) {
      const overall = parseFloat(idea.scoreOverall || "0");

      if (overall < 20) distribution["0-20"]++;
      else if (overall < 40) distribution["20-40"]++;
      else if (overall < 60) distribution["40-60"]++;
      else if (overall < 80) distribution["60-80"]++;
      else distribution["80-100"]++;

      scores.push({
        id: idea.id!,
        title: idea.title!,
        overall,
        demand: parseFloat(idea.scoreDemand || "0"),
        competition: parseFloat(idea.scoreCompetition || "0"),
        revenue: parseFloat(idea.scoreRevenue || "0"),
        buildEffort: parseFloat(idea.scoreBuildEffort || "0"),
        trend: parseFloat(idea.scoreTrend || "0"),
      });
    }

    scores.sort((a, b) => b.overall - a.overall);

    const avgScore =
      scores.reduce((sum, s) => sum + s.overall, 0) / scores.length;

    return NextResponse.json({
      distribution,
      scores,
      averageScore: Math.round(avgScore * 100) / 100,
      totalIdeas: scores.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch score data" },
      { status: 500 }
    );
  }
}
