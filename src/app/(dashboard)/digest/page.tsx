"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Newspaper,
  Sparkles,
  Calendar,
  Lightbulb,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Digest {
  id: string;
  title: string;
  date: string;
  summaryHtml: string;
  ideasFeatured: string[];
  signalsProcessed: number;
  newIdeasCount: number;
  [key: string]: unknown;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<h[1-6][^>]*>/gi, "## ")
    .replace(/<strong[^>]*>/gi, "**")
    .replace(/<\/strong>/gi, "**")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function DigestContent({ html }: { html: string }) {
  const text = stripHtml(html);
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={i} className="text-base font-semibold mt-4 mb-1">
              {trimmed.slice(3)}
            </h3>
          );
        }

        if (trimmed.startsWith("- ")) {
          const content = trimmed.slice(2);
          const parts = content.split(/(\*\*[^*]+\*\*)/g);
          return (
            <div key={i} className="flex gap-2 text-sm text-gray-700 pl-2">
              <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span>
                {parts.map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <strong key={j} className="font-semibold text-gray-900">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={j}>{part}</span>;
                })}
              </span>
            </div>
          );
        }

        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-sm text-gray-700">
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={j} className="font-semibold text-gray-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function DigestPage() {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDigests() {
      setLoading(true);
      try {
        const res = await fetch("/api/digest");
        if (!res.ok) throw new Error("Failed to fetch digests");
        const data = await res.json();
        const items = Array.isArray(data)
          ? data
          : data.digests || data.data || [];
        setDigests(items);
        if (items.length > 0) {
          setExpandedId(items[0].id);
        }
      } catch {
        toast.error("Failed to load digests");
      } finally {
        setLoading(false);
      }
    }
    fetchDigests();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/digest/generate", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate digest");
      const data = await res.json();
      const newDigest = data.digest || data;
      setDigests((prev) => [newDigest, ...prev]);
      setExpandedId(newDigest.id);
      toast.success("Digest generated successfully");
    } catch {
      toast.error("Failed to generate digest");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          Daily Digest
        </h2>
        <Button size="sm" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1" />
          )}
          Generate Today&apos;s Digest
        </Button>
      </div>

      {digests.length === 0 && (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No digests yet</p>
            <p className="text-xs mt-1">
              Generate your first daily digest to get started
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {digests.map((digest) => {
          const isExpanded = expandedId === digest.id;

          return (
            <Card key={digest.id}>
              <CardContent className="pt-0">
                <button
                  className="w-full text-left"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : digest.id || null)
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {digest.date &&
                            format(
                              new Date(digest.date),
                              "EEEE, MMMM d, yyyy"
                            )}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold">
                        {digest.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Lightbulb className="w-3 h-3" />
                          {digest.ideasFeatured?.length || 0} ideas featured
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Zap className="w-3 h-3" />
                          {digest.signalsProcessed} signals processed
                        </span>
                        {(digest.newIdeasCount ?? 0) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{digest.newIdeasCount} new ideas
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 p-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && digest.summaryHtml && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <DigestContent html={digest.summaryHtml} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
