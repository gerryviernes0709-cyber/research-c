import { NextRequest, NextResponse } from "next/server";
import { mockConversations } from "@/mock/data";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const conversations = [...mockConversations].sort(
      (a, b) =>
        new Date(b.lastMessageAt || b.createdAt || 0).getTime() -
        new Date(a.lastMessageAt || a.createdAt || 0).getTime()
    );

    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, ideaId } = body;

    const conversation = {
      id: `conv-${nanoid(6)}`,
      ideaId: ideaId || null,
      title: title || "New Conversation",
      participants: ["u-001"],
      messageCount: 0,
      lastMessageAt: null,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(conversation, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
