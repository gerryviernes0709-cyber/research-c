"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useBrainChat } from "@/lib/hooks/use-brain-chat";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Plus,
  Send,
  Globe,
  Compass,
  Target,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string;
  mode: string;
}

interface ConversationMessage {
  id: string;
  conversationId: string;
  senderType: "user" | "brain";
  content: string;
  createdAt: string;
}

function renderFormattedContent(content: string) {
  // Handle headers
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={lineIdx} className="text-sm font-semibold mt-3 mb-1">
          {line.slice(4)}
        </h4>
      );
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={lineIdx} className="text-base font-semibold mt-3 mb-1">
          {line.slice(3)}
        </h3>
      );
      return;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={lineIdx} className="text-lg font-bold mt-3 mb-1">
          {line.slice(2)}
        </h2>
      );
      return;
    }

    // List items
    if (line.startsWith("- ")) {
      const inlineParts = line.slice(2).split(/(\*\*[^*]+\*\*)/g);
      elements.push(
        <span
          key={lineIdx}
          className="block pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-1 before:h-1 before:rounded-full before:bg-current before:opacity-40"
        >
          {inlineParts.map((part, pi) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={pi} className="font-semibold">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <span key={pi}>{part}</span>
            )
          )}
        </span>
      );
      return;
    }

    // Empty lines
    if (line.trim() === "") {
      elements.push(<br key={lineIdx} />);
      return;
    }

    // Regular text with bold support
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    elements.push(
      <span key={lineIdx}>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={i} className="font-semibold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={i}>{part}</span>;
        })}
        {"\n"}
      </span>
    );
  });

  return elements;
}

export default function BrainPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
          <div className="hidden lg:flex lg:w-72 flex-col shrink-0">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        </div>
      }
    >
      <BrainPageInner />
    </Suspense>
  );
}

function BrainPageInner() {
  const searchParams = useSearchParams();
  const ideaId = searchParams.get("ideaId") || undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<string>("");
  const [historyMessages, setHistoryMessages] = useState<ConversationMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [mode, setMode] = useState<"global" | "strategy" | "explore">("global");
  const [creatingConv, setCreatingConv] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, isStreaming, error, clearMessages } =
    useBrainChat({
      conversationId: selectedConv || undefined,
      mode,
      ideaId,
    });

  // Fetch conversations
  useEffect(() => {
    async function fetchConversations() {
      setConvsLoading(true);
      try {
        const res = await fetch("/api/brain/conversations");
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        const convs = Array.isArray(data) ? data : data.conversations || data.data || [];
        setConversations(convs);
        if (convs.length > 0 && !selectedConv) {
          setSelectedConv(convs[0].id);
        }
      } catch {
        toast.error("Failed to load conversations");
      } finally {
        setConvsLoading(false);
      }
    }
    fetchConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when a conversation is selected
  const loadConversationMessages = useCallback(
    async (convId: string) => {
      if (!convId) return;
      setHistoryLoading(true);
      clearMessages();
      try {
        const res = await fetch(
          `/api/brain/conversations/${convId}/messages`
        );
        if (!res.ok) throw new Error("Failed to load messages");
        const data = await res.json();
        setHistoryMessages(
          Array.isArray(data) ? data : data.messages || data.data || []
        );
      } catch {
        toast.error("Failed to load conversation messages");
      } finally {
        setHistoryLoading(false);
      }
    },
    [clearMessages]
  );

  useEffect(() => {
    if (selectedConv) {
      loadConversationMessages(selectedConv);
    }
  }, [selectedConv, loadConversationMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, historyMessages, isStreaming]);

  async function handleCreateConversation() {
    setCreatingConv(true);
    try {
      const res = await fetch("/api/brain/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation", mode }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      const data = await res.json();
      const newConv = data.conversation || data;
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConv(newConv.id);
      setHistoryMessages([]);
      clearMessages();
      toast.success("New conversation created");
    } catch {
      toast.error("Failed to create conversation");
    } finally {
      setCreatingConv(false);
    }
  }

  async function handleSendMessage() {
    const content = chatInput.trim();
    if (!content || isStreaming) return;
    setChatInput("");
    await sendMessage(content);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  // Combine history messages with streaming messages
  const allMessages = [
    ...historyMessages.map((m) => ({
      id: m.id,
      role: m.senderType === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
      createdAt: m.createdAt,
    })),
    ...messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    })),
  ];

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Conversation Sidebar */}
      <div className="hidden lg:flex lg:w-72 flex-col shrink-0">
        <Card className="flex flex-col h-full">
          <div className="p-3 border-b">
            <Button
              className="w-full"
              size="sm"
              onClick={handleCreateConversation}
              disabled={creatingConv}
            >
              {creatingConv ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1.5" />
              )}
              New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {convsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-3 py-2.5 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No conversations yet
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                    selectedConv === conv.id
                      ? "bg-indigo-50 text-indigo-900"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <p className="font-medium truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {conv.messageCount} messages
                    {conv.lastMessageAt &&
                      ` \u00b7 ${formatDistanceToNow(
                        new Date(conv.lastMessageAt),
                        { addSuffix: true }
                      )}`}
                  </p>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="flex flex-col h-full">
          {/* Mode Tabs */}
          <div className="p-3 border-b flex items-center gap-3">
            <Brain className="w-5 h-5 text-indigo-600 shrink-0" />
            <Tabs
              value={mode}
              onValueChange={(v) =>
                setMode(v as "global" | "strategy" | "explore")
              }
            >
              <TabsList>
                <TabsTrigger value="global">
                  <Globe className="w-3.5 h-3.5 mr-1" />
                  Global
                </TabsTrigger>
                <TabsTrigger value="strategy">
                  <Target className="w-3.5 h-3.5 mr-1" />
                  Strategy
                </TabsTrigger>
                <TabsTrigger value="explore">
                  <Compass className="w-3.5 h-3.5 mr-1" />
                  Explore
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {historyLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      i % 2 === 0 ? "justify-end" : "justify-start"
                    )}
                  >
                    <Skeleton
                      className={cn(
                        "h-16 rounded-xl",
                        i % 2 === 0 ? "w-2/3" : "w-3/4"
                      )}
                    />
                  </div>
                ))}
              </div>
            )}

            {!historyLoading && allMessages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    Start a conversation with Brain
                  </p>
                </div>
              </div>
            )}

            {!historyLoading &&
              allMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm max-w-[80%] leading-relaxed",
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {msg.role === "assistant" && (
                        <Brain className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                      <span className="text-xs font-medium opacity-70">
                        {msg.role === "user" ? "You" : "Brain"}
                      </span>
                      {msg.createdAt && (
                        <span className="text-xs opacity-50">
                          {formatDistanceToNow(new Date(msg.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {renderFormattedContent(msg.content || "")}
                    </div>
                  </div>
                </div>
              ))}

            {/* Typing indicator */}
            {isStreaming &&
              messages.length > 0 &&
              messages[messages.length - 1].content === "" && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-4 py-3 bg-gray-100">
                    <div className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-indigo-600" />
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Error message */}
            {error && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
                  <AlertCircle className="w-4 h-4" />
                  {error.message}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Ask Brain anything about the peptide market..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                rows={1}
                disabled={isStreaming}
              />
              <Button
                className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSendMessage}
                disabled={isStreaming || !chatInput.trim()}
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
