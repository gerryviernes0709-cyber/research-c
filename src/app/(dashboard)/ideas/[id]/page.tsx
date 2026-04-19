"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useBrainChat } from "@/lib/hooks/use-brain-chat";
import {
  IDEA_CATEGORIES,
  IDEA_STATUSES,
  OPPORTUNITY_TYPES,
  getScoreColor,
  getScoreBgColor,
  getConfidenceLabel,
} from "@/lib/utils/constants";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Brain,
  Send,
  Calendar,
  Signal,
  FileText,
  Clock,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Target,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface Idea {
  id: string;
  title: string;
  summary: string;
  category: string;
  peptideFocus: string[];
  subNiche: string;
  opportunityType: string;
  status: string;
  scoreOverall: string;
  scoreDemand: string;
  scoreCompetition: string;
  scoreRevenue: string;
  scoreBuildEffort: string;
  scoreTrend: string;
  scoreReasoning: string;
  confidence: string;
  evidenceCount: number;
  firstDetectedAt: string;
  lastSignalAt: string;
  updatedAt: string;
  createdAt: string;
  [key: string]: unknown;
}

interface IdeaSignal {
  id: string;
  ideaId: string;
  source: string;
  sourceTitle: string;
  sourceUrl: string;
  contentType: string;
  contentSummary: string;
  [key: string]: unknown;
}

interface Annotation {
  id: string;
  ideaId: string;
  userId: string;
  annotationType: string;
  content: string;
  createdAt: string;
  userName?: string;
  [key: string]: unknown;
}

const annotationTypeIcon: Record<string, React.ReactNode> = {
  note: <FileText className="w-3.5 h-3.5 text-gray-500" />,
  research: <Lightbulb className="w-3.5 h-3.5 text-blue-500" />,
  concern: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
  opportunity: <Target className="w-3.5 h-3.5 text-green-500" />,
  action_item: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />,
};

export default function IdeaDetailPage() {
  const params = useParams();
  const ideaId = params.id as string;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [signals, setSignals] = useState<IdeaSignal[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [annotationText, setAnnotationText] = useState("");
  const [annotationType, setAnnotationType] = useState("note");
  const [submittingAnnotation, setSubmittingAnnotation] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, isStreaming } = useBrainChat({
    ideaId,
    mode: "idea",
  });

  // Fetch idea data
  useEffect(() => {
    async function fetchIdea() {
      setLoading(true);
      try {
        const res = await fetch(`/api/ideas/${ideaId}`);
        if (!res.ok) throw new Error("Failed to fetch idea");
        const data = await res.json();
        setIdea(data.idea || data);
      } catch {
        toast.error("Failed to load idea");
      } finally {
        setLoading(false);
      }
    }
    fetchIdea();
  }, [ideaId]);

  // Fetch signals
  useEffect(() => {
    async function fetchSignals() {
      try {
        const res = await fetch(`/api/ideas/${ideaId}/signals`);
        if (!res.ok) return;
        const data = await res.json();
        setSignals(Array.isArray(data) ? data : data.signals || data.data || []);
      } catch {
        // Silently fail for signals
      }
    }
    fetchSignals();
  }, [ideaId]);

  // Fetch annotations
  useEffect(() => {
    async function fetchAnnotations() {
      try {
        const res = await fetch(`/api/ideas/${ideaId}/annotations`);
        if (!res.ok) return;
        const data = await res.json();
        setAnnotations(
          Array.isArray(data) ? data : data.annotations || data.data || []
        );
      } catch {
        // Silently fail
      }
    }
    fetchAnnotations();
  }, [ideaId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleStatusChange(newStatus: string) {
    if (!idea) return;
    setStatusChanging(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setIdea({ ...idea, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusChanging(false);
    }
  }

  async function handleRescore() {
    if (!idea) return;
    setRescoring(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/score`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to re-score");
      const data = await res.json();
      const scores = data.scores || data;
      setIdea({
        ...idea,
        scoreOverall: scores.scoreOverall || idea.scoreOverall,
        scoreDemand: scores.scoreDemand || idea.scoreDemand,
        scoreCompetition: scores.scoreCompetition || idea.scoreCompetition,
        scoreRevenue: scores.scoreRevenue || idea.scoreRevenue,
        scoreBuildEffort: scores.scoreBuildEffort || idea.scoreBuildEffort,
        scoreTrend: scores.scoreTrend || idea.scoreTrend,
        scoreReasoning: scores.scoreReasoning || idea.scoreReasoning,
        confidence: scores.confidence || idea.confidence,
      });
      toast.success("Idea re-scored successfully");
    } catch {
      toast.error("Failed to re-score idea");
    } finally {
      setRescoring(false);
    }
  }

  async function handleAddAnnotation() {
    if (!annotationText.trim()) return;
    setSubmittingAnnotation(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: annotationText,
          annotationType,
        }),
      });
      if (!res.ok) throw new Error("Failed to add annotation");
      const data = await res.json();
      const newAnnotation = data.annotation || data;
      setAnnotations((prev) => [...prev, newAnnotation]);
      setAnnotationText("");
      toast.success("Annotation added");
    } catch {
      toast.error("Failed to add annotation");
    } finally {
      setSubmittingAnnotation(false);
    }
  }

  async function handleSendChat() {
    const content = chatInput.trim();
    if (!content || isStreaming) return;
    setChatInput("");
    await sendMessage(content);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-96" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium">Idea not found</p>
          <p className="text-sm text-muted-foreground">
            No idea with ID &quot;{ideaId}&quot; exists.
          </p>
        </div>
      </div>
    );
  }

  const score = parseFloat(idea.scoreOverall || "0");
  const confidence = parseFloat(idea.confidence || "0");
  const demand = parseFloat(idea.scoreDemand || "0");
  const competition = parseFloat(idea.scoreCompetition || "0");
  const revenue = parseFloat(idea.scoreRevenue || "0");
  const buildEffort = parseFloat(idea.scoreBuildEffort || "0");
  const trend = parseFloat(idea.scoreTrend || "0");

  const category = IDEA_CATEGORIES.find((c) => c.value === idea.category);
  const oppType = OPPORTUNITY_TYPES.find(
    (o) => o.value === idea.opportunityType
  );

  const scoreBreakdown = [
    { label: "Demand", value: demand, color: "bg-blue-500" },
    { label: "Competition", value: competition, color: "bg-emerald-500" },
    { label: "Revenue", value: revenue, color: "bg-amber-500" },
    { label: "Build Effort", value: buildEffort, color: "bg-violet-500" },
    { label: "Trend", value: trend, color: "bg-cyan-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{idea.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {category && (
              <Badge variant="secondary">{category.label}</Badge>
            )}
            {oppType && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  oppType.color.replace("bg-", "text-")
                )}
              >
                {oppType.label}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRescore}
            disabled={rescoring}
          >
            {rescoring ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            Re-score
          </Button>
          <Select
            value={idea.status || "detected"}
            onValueChange={(v) => { if (v) handleStatusChange(v); }}
            disabled={statusChanging}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IDEA_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (65%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Score Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Score Breakdown</span>
                <span
                  className={cn(
                    "text-2xl font-bold tabular-nums px-3 py-1 rounded-lg border",
                    getScoreBgColor(score)
                  )}
                >
                  {Number(score).toFixed(1)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scoreBreakdown.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        getScoreColor(item.value)
                      )}
                    >
                      {Number(item.value).toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        item.color
                      )}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}

              {idea.scoreReasoning && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Score Reasoning
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {idea.scoreReasoning}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trend Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                <div className="text-center text-muted-foreground">
                  <Signal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Trend data visualization</p>
                  <p className="text-xs">
                    Signal volume over the past 12 weeks for{" "}
                    {idea.peptideFocus?.join(", ")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Annotations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Annotations ({annotations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  className="flex gap-3 p-3 rounded-lg border border-gray-100"
                >
                  <div className="pt-0.5">
                    {annotationTypeIcon[ann.annotationType || "note"]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {ann.userName || "User"}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {ann.annotationType}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {ann.createdAt &&
                          formatDistanceToNow(new Date(ann.createdAt), {
                            addSuffix: true,
                          })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{ann.content}</p>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={annotationType}
                    onValueChange={(v) => { if (v) setAnnotationType(v); }}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="concern">Concern</SelectItem>
                      <SelectItem value="opportunity">Opportunity</SelectItem>
                      <SelectItem value="action_item">Action Item</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Add an annotation..."
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddAnnotation}
                    disabled={submittingAnnotation || !annotationText.trim()}
                  >
                    {submittingAnnotation ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : null}
                    Add Annotation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (35%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Confidence */}
          <Card>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Confidence</span>
                <Badge
                  variant="outline"
                  className={cn(
                    confidence >= 70
                      ? "text-green-600 border-green-200"
                      : confidence >= 50
                      ? "text-yellow-600 border-yellow-200"
                      : "text-red-600 border-red-200"
                  )}
                >
                  {getConfidenceLabel(confidence)} ({Number(confidence).toFixed(0)}%)
                </Badge>
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    confidence >= 70
                      ? "bg-green-500"
                      : confidence >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  )}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Signal className="w-3.5 h-3.5" /> Evidence
                </span>
                <span className="font-medium">
                  {idea.evidenceCount} signals
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> First Detected
                </span>
                <span className="font-medium">
                  {idea.firstDetectedAt &&
                    format(new Date(idea.firstDetectedAt), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Last Signal
                </span>
                <span className="font-medium">
                  {idea.lastSignalAt
                    ? formatDistanceToNow(new Date(idea.lastSignalAt), {
                        addSuffix: true,
                      })
                    : idea.updatedAt
                    ? formatDistanceToNow(new Date(idea.updatedAt), {
                        addSuffix: true,
                      })
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Evidence List */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence ({signals.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {signals.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No linked signals found.
                </p>
              )}
              {signals.map((signal) => (
                <div
                  key={signal.id}
                  className="p-3 rounded-lg border border-gray-100 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium line-clamp-2">
                      {signal.sourceTitle}
                    </p>
                    {signal.sourceUrl && (
                      <a
                        href={signal.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {signal.source}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {signal.contentType?.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {signal.contentSummary}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Brain Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" />
                Quick Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-48 overflow-y-auto space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-lg p-3 text-sm",
                      msg.role === "user"
                        ? "bg-indigo-600 text-white ml-4"
                        : "bg-gray-100 text-gray-800 mr-4"
                    )}
                  >
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {msg.role === "user" ? "You" : "Brain"}
                    </p>
                    <p className="line-clamp-3 whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))}
                {isStreaming &&
                  messages.length > 0 &&
                  messages[messages.length - 1].content === "" && (
                    <div className="bg-gray-100 rounded-lg p-3 mr-4">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ask about this idea..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  className="flex-1"
                  disabled={isStreaming}
                />
                <button
                  className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  onClick={handleSendChat}
                  disabled={isStreaming || !chatInput.trim()}
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
