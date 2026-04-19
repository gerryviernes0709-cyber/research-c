import { NextRequest, NextResponse } from "next/server";
import { mockIdeas, mockSignals, mockAnnotations } from "@/mock/data";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const idea = mockIdeas.find((i) => i.id === id);

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const signals = mockSignals.filter((s) => s.ideaId === id);
    const annotations = mockAnnotations.filter((a) => a.ideaId === id);

    return NextResponse.json({ idea, signals, annotations });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch idea" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const idea = mockIdeas.find((i) => i.id === id);

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const body = await request.json();
    const updatable = [
      "status",
      "tags",
      "reviewNote",
      "reviewedBy",
      "reviewedAt",
      "subNiche",
      "opportunityType",
      "summary",
      "title",
    ];

    const updated = { ...idea };
    for (const key of updatable) {
      if (key in body) {
        (updated as Record<string, unknown>)[key] = body[key];
      }
    }
    updated.updatedAt = new Date().toISOString();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update idea" },
      { status: 500 }
    );
  }
}
