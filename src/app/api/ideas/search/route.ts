import { NextRequest, NextResponse } from "next/server";
import { mockIdeas } from "@/mock/data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Search query 'q' is required" },
        { status: 400 }
      );
    }

    const q = query.toLowerCase();
    const results = mockIdeas.filter(
      (i) =>
        i.title?.toLowerCase().includes(q) ||
        i.summary?.toLowerCase().includes(q)
    );

    return NextResponse.json({ ideas: results, total: results.length });
  } catch {
    return NextResponse.json(
      { error: "Failed to search ideas" },
      { status: 500 }
    );
  }
}
