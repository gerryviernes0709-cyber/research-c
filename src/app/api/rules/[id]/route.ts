import { NextRequest, NextResponse } from "next/server";
import { mockRules } from "@/mock/data";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const rule = mockRules.find((r) => r.id === id);

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const body = await request.json();
    const updatable = ["active", "approved", "weight", "ruleText", "ruleType", "direction"];

    const updated = { ...rule };
    for (const key of updatable) {
      if (key in body) {
        (updated as Record<string, unknown>)[key] = body[key];
      }
    }
    updated.updatedAt = new Date().toISOString();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update rule" },
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
    const rule = mockRules.find((r) => r.id === id);

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete rule" },
      { status: 500 }
    );
  }
}
