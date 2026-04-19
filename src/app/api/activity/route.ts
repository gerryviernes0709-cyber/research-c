import { NextRequest, NextResponse } from "next/server";
import { mockActivity } from "@/mock/data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const entityType = searchParams.get("entityType");

    let filtered = [...mockActivity];

    if (entityType) {
      filtered = filtered.filter((a) => a.entityType === entityType);
    }

    filtered.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

    const total = filtered.length;
    const activities = filtered.slice(offset, offset + limit);

    return NextResponse.json({ activities, total });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
