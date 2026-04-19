import { NextResponse } from "next/server";
import { mockIdeas } from "@/mock/data";
import { IDEA_CATEGORIES } from "@/lib/utils/constants";

export async function GET() {
  try {
    const categoryMap: Record<
      string,
      {
        count: number;
        avgScore: number;
        statuses: Record<string, number>;
        totalScore: number;
      }
    > = {};

    for (const idea of mockIdeas) {
      const cat = idea.category || "other";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, avgScore: 0, statuses: {}, totalScore: 0 };
      }
      categoryMap[cat].count++;
      categoryMap[cat].totalScore += parseFloat(idea.scoreOverall || "0");

      const status = idea.status || "detected";
      categoryMap[cat].statuses[status] =
        (categoryMap[cat].statuses[status] || 0) + 1;
    }

    const categories = Object.entries(categoryMap).map(([key, data]) => {
      const label =
        IDEA_CATEGORIES.find((c) => c.value === key)?.label || key;
      return {
        category: key,
        label,
        count: data.count,
        avgScore: Math.round((data.totalScore / data.count) * 100) / 100,
        statuses: data.statuses,
      };
    });

    categories.sort((a, b) => b.count - a.count);

    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch category analytics" },
      { status: 500 }
    );
  }
}
