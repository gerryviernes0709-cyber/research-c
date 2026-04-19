import { NextRequest, NextResponse } from "next/server";
import { mockIdeas } from "@/mock/data";
import { nanoid } from "nanoid";
import slugify from "slugify";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let filtered = [...mockIdeas];

    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }
    if (category) {
      filtered = filtered.filter((i) => i.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.summary?.toLowerCase().includes(q)
      );
    }

    if (sort === "score") {
      filtered.sort(
        (a, b) =>
          parseFloat(b.scoreOverall || "0") -
          parseFloat(a.scoreOverall || "0")
      );
    } else {
      // newest
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }

    const total = filtered.length;
    const ideas = filtered.slice(offset, offset + limit);

    return NextResponse.json({ ideas, total });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch ideas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, category, peptideFocus, subNiche, opportunityType, summary } =
      body;

    if (!title || !category || !opportunityType) {
      return NextResponse.json(
        { error: "title, category, and opportunityType are required" },
        { status: 400 }
      );
    }

    const newIdea = {
      id: `i-${nanoid(6)}`,
      title,
      slug: slugify(title, { lower: true, strict: true }),
      summary: summary || null,
      category,
      peptideFocus: peptideFocus || [],
      subNiche: subNiche || null,
      opportunityType,
      status: "detected" as const,
      scoreOverall: null,
      scoreDemand: null,
      scoreCompetition: null,
      scoreRevenue: null,
      scoreBuildEffort: null,
      scoreTrend: null,
      scoreReasoning: null,
      confidence: null,
      evidenceCount: 0,
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      tags: [],
      sourceSignalsCount: 0,
      firstDetectedAt: new Date().toISOString(),
      lastSignalAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(newIdea, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create idea" },
      { status: 500 }
    );
  }
}
