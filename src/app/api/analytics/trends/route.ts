import { NextRequest, NextResponse } from "next/server";
import { mockTrends } from "@/mock/data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");
    const source = searchParams.get("source");
    const period = searchParams.get("period");

    let filtered = [...mockTrends];

    if (keyword) {
      filtered = filtered.filter((t) =>
        t.keyword?.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    if (source) {
      filtered = filtered.filter((t) => t.source === source);
    }
    if (period) {
      filtered = filtered.filter((t) => t.period === period);
    }

    // Sort by capturedAt ascending for charting
    filtered.sort(
      (a, b) =>
        new Date(a.capturedAt || 0).getTime() -
        new Date(b.capturedAt || 0).getTime()
    );

    // Group by keyword for easier chart consumption
    const byKeyword: Record<
      string,
      Array<{ date: string; value: number; delta: number | null }>
    > = {};

    for (const trend of filtered) {
      const kw = trend.keyword || "unknown";
      if (!byKeyword[kw]) {
        byKeyword[kw] = [];
      }
      byKeyword[kw].push({
        date: trend.capturedAt || "",
        value: parseFloat(String(trend.value || "0")),
        delta: trend.deltaPercent
          ? parseFloat(String(trend.deltaPercent))
          : null,
      });
    }

    return NextResponse.json({
      trends: filtered,
      byKeyword,
      keywords: Object.keys(byKeyword),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch trends" },
      { status: 500 }
    );
  }
}
