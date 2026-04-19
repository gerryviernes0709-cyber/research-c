import { NextRequest, NextResponse } from "next/server";
import { mockConversations, mockMessages } from "@/mock/data";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const conversation = mockConversations.find((c) => c.id === id);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const messages = mockMessages
      .filter((m) => m.conversationId === id)
      .sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
