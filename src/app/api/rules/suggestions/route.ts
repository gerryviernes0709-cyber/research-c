import { NextResponse } from "next/server";
import { mockRules } from "@/mock/data";

export async function GET() {
  try {
    const suggestions = mockRules.filter(
      (r) =>
        (r.source === "ai_suggested" || r.source === "learned") &&
        r.approved === false
    );

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch rule suggestions" },
      { status: 500 }
    );
  }
}
