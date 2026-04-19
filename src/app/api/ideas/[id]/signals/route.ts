import { NextRequest, NextResponse } from "next/server";
import { mockSignals, mockIdeas } from "@/mock/data";

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
    return NextResponse.json({ signals });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}
