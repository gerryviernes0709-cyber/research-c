import { NextRequest, NextResponse } from "next/server";
import { mockRules } from "@/mock/data";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const rules = [...mockRules].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

    return NextResponse.json({ rules });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleText, ruleType, direction, weight } = body;

    if (!ruleText || !direction) {
      return NextResponse.json(
        { error: "ruleText and direction are required" },
        { status: 400 }
      );
    }

    const rule = {
      id: `r-${nanoid(6)}`,
      ruleText,
      ruleType: ruleType || "general",
      direction,
      weight: weight || "1.00",
      source: "manual" as const,
      learnedFrom: null,
      approved: true,
      active: true,
      createdBy: "u-001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(rule, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 }
    );
  }
}
