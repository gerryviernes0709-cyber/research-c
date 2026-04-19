import { NextRequest, NextResponse } from "next/server";
import { mockSignals } from "@/mock/data";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const processed = searchParams.get("processed");
    const ideaId = searchParams.get("ideaId");
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let filtered = [...mockSignals];

    if (source) {
      filtered = filtered.filter((s) => s.source === source);
    }
    if (processed !== null && processed !== undefined && processed !== "") {
      const isProcessed = processed === "true";
      filtered = filtered.filter((s) => s.processed === isProcessed);
    }
    if (ideaId) {
      filtered = filtered.filter((s) => s.ideaId === ideaId);
    }

    filtered.sort(
      (a, b) =>
        new Date(b.detectedAt || 0).getTime() -
        new Date(a.detectedAt || 0).getTime()
    );

    const total = filtered.length;
    const signals = filtered.slice(offset, offset + limit);

    return NextResponse.json({ signals, total });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ideaId,
      source,
      sourceUrl,
      sourceTitle,
      sourceAuthor,
      contentSummary,
      contentType,
      relevanceScore,
      peptidesMentioned,
    } = body;

    if (!source || !contentType) {
      return NextResponse.json(
        { error: "source and contentType are required" },
        { status: 400 }
      );
    }

    const newSignal = {
      id: `s-${nanoid(6)}`,
      ideaId: ideaId || null,
      source,
      sourceUrl: sourceUrl || null,
      sourceTitle: sourceTitle || null,
      sourceAuthor: sourceAuthor || null,
      contentSummary: contentSummary || null,
      contentType,
      relevanceScore: relevanceScore || null,
      engagementMetrics: {},
      peptidesMentioned: peptidesMentioned || [],
      processed: false,
      detectedAt: new Date().toISOString(),
      sourcePublishedAt: null,
    };

    return NextResponse.json(newSignal, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create signal" },
      { status: 500 }
    );
  }
}
