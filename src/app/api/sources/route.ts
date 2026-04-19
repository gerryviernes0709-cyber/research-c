import { NextRequest, NextResponse } from "next/server";
import { mockSources } from "@/mock/data";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const sources = [...mockSources].sort((a, b) => (a.priority || 5) - (b.priority || 5));

    return NextResponse.json({ sources });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, platform, urlPattern, crawlFrequency, crawlMethod, searchQueries } = body;

    if (!name || !platform) {
      return NextResponse.json(
        { error: "name and platform are required" },
        { status: 400 }
      );
    }

    const source = {
      id: `src-${nanoid(6)}`,
      name,
      platform,
      urlPattern: urlPattern || null,
      crawlFrequency: crawlFrequency || "daily",
      crawlMethod: crawlMethod || "html_scrape",
      authConfig: {},
      searchQueries: searchQueries || [],
      lastCrawledAt: null,
      lastError: null,
      signalsTotal: 0,
      signalsRelevant: 0,
      enabled: true,
      priority: 5,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(source, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}
