import { NextRequest, NextResponse } from "next/server";
import { mockSources, mockSignals } from "@/mock/data";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const source = mockSources.find((s) => s.id === id);

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Return mock test crawl results
    const sampleSignals = mockSignals
      .filter((s) => s.source === source.platform)
      .slice(0, 3)
      .map((s) => ({
        sourceTitle: s.sourceTitle,
        contentType: s.contentType,
        relevanceScore: s.relevanceScore,
        peptidesMentioned: s.peptidesMentioned,
      }));

    return NextResponse.json({
      success: true,
      signalsFound: 5,
      crawlDuration: "2.3s",
      source: {
        id: source.id,
        name: source.name,
        platform: source.platform,
      },
      sampleSignals:
        sampleSignals.length > 0
          ? sampleSignals
          : [
              {
                sourceTitle: "Sample signal from " + source.name,
                contentType: "question",
                relevanceScore: "75.00",
                peptidesMentioned: ["BPC-157"],
              },
            ],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to test source" },
      { status: 500 }
    );
  }
}
