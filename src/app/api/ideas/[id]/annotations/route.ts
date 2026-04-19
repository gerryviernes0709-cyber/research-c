import { NextRequest, NextResponse } from "next/server";
import { mockAnnotations, mockIdeas } from "@/mock/data";
import { nanoid } from "nanoid";

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

    const annotations = mockAnnotations.filter((a) => a.ideaId === id);
    return NextResponse.json({ annotations });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch annotations" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { content, annotationType, userId } = body;

    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const annotation = {
      id: `a-${nanoid(6)}`,
      ideaId: id,
      userId: userId || "u-001",
      content,
      annotationType: annotationType || "note",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(annotation, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create annotation" },
      { status: 500 }
    );
  }
}
