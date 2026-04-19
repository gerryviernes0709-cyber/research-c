import { NextRequest, NextResponse } from "next/server";
import { mockCompetitors } from "@/mock/data";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const competitors = mockCompetitors.map((c) => ({
      ...c,
      productCount: c.products?.length || 0,
      products: undefined,
    }));

    return NextResponse.json({ competitors });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch competitors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, platform, watchPriority, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const competitor = {
      id: `c-${nanoid(6)}`,
      name,
      url: url || null,
      platform: platform || null,
      discoveryMethod: "manual" as const,
      productsTracked: 0,
      lastCheckedAt: null,
      notes: notes || null,
      watchPriority: watchPriority || "medium",
      active: true,
      createdAt: new Date().toISOString(),
      products: [],
    };

    return NextResponse.json(competitor, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create competitor" },
      { status: 500 }
    );
  }
}
