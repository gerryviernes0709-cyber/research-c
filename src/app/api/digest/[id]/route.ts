import { NextRequest, NextResponse } from "next/server";
import { mockDigests } from "@/mock/data";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const digest = mockDigests.find((d) => d.id === id);

    if (!digest) {
      return NextResponse.json({ error: "Digest not found" }, { status: 404 });
    }

    return NextResponse.json(digest);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch digest" },
      { status: 500 }
    );
  }
}
