import { NextRequest, NextResponse } from "next/server";
import { mockCompetitors } from "@/mock/data";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const competitor = mockCompetitors.find((c) => c.id === id);

    if (!competitor) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      competitor: { ...competitor, products: undefined },
      products: competitor.products || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch competitor" },
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
    const competitor = mockCompetitors.find((c) => c.id === id);

    if (!competitor) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updatable = ["name", "url", "platform", "watchPriority", "active", "notes"];

    const updated = { ...competitor, products: undefined };
    for (const key of updatable) {
      if (key in body) {
        (updated as Record<string, unknown>)[key] = body[key];
      }
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update competitor" },
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
    const competitor = mockCompetitors.find((c) => c.id === id);

    if (!competitor) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete competitor" },
      { status: 500 }
    );
  }
}
