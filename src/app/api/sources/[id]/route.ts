import { NextRequest, NextResponse } from "next/server";
import { mockSources } from "@/mock/data";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const source = mockSources.find((s) => s.id === id);

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const body = await request.json();
    const updatable = [
      "enabled",
      "crawlFrequency",
      "searchQueries",
      "name",
      "urlPattern",
      "crawlMethod",
      "priority",
    ];

    const updated = { ...source };
    for (const key of updatable) {
      if (key in body) {
        (updated as Record<string, unknown>)[key] = body[key];
      }
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const source = mockSources.find((s) => s.id === id);

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    );
  }
}
