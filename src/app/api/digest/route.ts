import { NextResponse } from "next/server";
import { mockDigests } from "@/mock/data";

export async function GET() {
  try {
    const digests = [...mockDigests].sort(
      (a, b) =>
        new Date(b.generatedAt || 0).getTime() -
        new Date(a.generatedAt || 0).getTime()
    );

    return NextResponse.json({ digests });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch digests" },
      { status: 500 }
    );
  }
}
