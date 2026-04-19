"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Database,
  Plus,
  Clock,
  Zap,
  AlertCircle,
  MessageCircle,
  TrendingUp,
  Play,
  Music2,
  ShoppingBag,
  ShoppingCart,
  Globe,
  Rss,
  Send,
  Loader2,
  TestTube,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Source {
  id: string;
  name: string;
  platform: string;
  enabled: boolean;
  crawlFrequency: string;
  crawlMethod: string;
  signalsTotal: number;
  lastCrawledAt: string;
  lastError: string | null;
  url?: string;
  [key: string]: unknown;
}

const platformIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  reddit: MessageCircle,
  google_trends: TrendingUp,
  youtube: Play,
  tiktok: Music2,
  twitter: Globe,
  etsy: ShoppingBag,
  amazon: ShoppingCart,
  blackhatworld: Globe,
  whop: ShoppingBag,
  rss: Rss,
  telegram: Send,
  website: Globe,
  forum: MessageCircle,
};

const frequencyLabels: Record<string, string> = {
  hourly: "Hourly",
  every_4h: "Every 4h",
  every_12h: "Every 12h",
  daily: "Daily",
  weekly: "Weekly",
};

const methodLabels: Record<string, string> = {
  api: "API",
  html_scrape: "Scrape",
  rss: "RSS",
  puppeteer: "Puppeteer",
};

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New source form state
  const [newName, setNewName] = useState("");
  const [newPlatform, setNewPlatform] = useState("website");
  const [newUrl, setNewUrl] = useState("");
  const [newFrequency, setNewFrequency] = useState("daily");
  const [newMethod, setNewMethod] = useState("html_scrape");

  useEffect(() => {
    async function fetchSources() {
      setLoading(true);
      try {
        const res = await fetch("/api/sources");
        if (!res.ok) throw new Error("Failed to fetch sources");
        const data = await res.json();
        setSources(
          Array.isArray(data) ? data : data.sources || data.data || []
        );
      } catch {
        toast.error("Failed to load sources");
      } finally {
        setLoading(false);
      }
    }
    fetchSources();
  }, []);

  async function handleToggleEnabled(sourceId: string, enabled: boolean) {
    try {
      const res = await fetch(`/api/sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle source");
      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, enabled } : s))
      );
      toast.success(enabled ? "Source enabled" : "Source disabled");
    } catch {
      toast.error("Failed to toggle source");
    }
  }

  async function handleTestCrawl(sourceId: string) {
    setTestingId(sourceId);
    try {
      const res = await fetch(`/api/sources/${sourceId}/test`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Test crawl failed");
      const data = await res.json();
      toast.success(
        `Test crawl completed: ${data.signalsFound || data.signals || 0} signals found`
      );
    } catch {
      toast.error("Test crawl failed");
    } finally {
      setTestingId(null);
    }
  }

  async function handleAddSource() {
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          platform: newPlatform,
          url: newUrl,
          crawlFrequency: newFrequency,
          crawlMethod: newMethod,
        }),
      });
      if (!res.ok) throw new Error("Failed to add source");
      const data = await res.json();
      const newSource = data.source || data;
      setSources((prev) => [...prev, newSource]);
      setDialogOpen(false);
      setNewName("");
      setNewPlatform("website");
      setNewUrl("");
      setNewFrequency("daily");
      setNewMethod("html_scrape");
      toast.success("Source added successfully");
    } catch {
      toast.error("Failed to add source");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          Sources
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="w-4 h-4 mr-1" />
            Add Source
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Source</DialogTitle>
              <DialogDescription>
                Add a new data source for PeptideIQ to crawl and monitor.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Name
                </label>
                <Input
                  placeholder="e.g., Reddit r/peptides"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">URL</label>
                <Input
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Platform
                  </label>
                  <Select value={newPlatform} onValueChange={(v) => { if (v) setNewPlatform(v); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="reddit">Reddit</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="rss">RSS</SelectItem>
                      <SelectItem value="forum">Forum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Frequency
                  </label>
                  <Select value={newFrequency} onValueChange={(v) => { if (v) setNewFrequency(v); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="every_4h">Every 4h</SelectItem>
                      <SelectItem value="every_12h">Every 12h</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Method
                  </label>
                  <Select value={newMethod} onValueChange={(v) => { if (v) setNewMethod(v); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="html_scrape">Scrape</SelectItem>
                      <SelectItem value="rss">RSS</SelectItem>
                      <SelectItem value="puppeteer">Puppeteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSource} disabled={submitting}>
                {submitting && (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                )}
                Add Source
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sources.map((source) => {
          const PlatformIcon =
            platformIcons[source.platform || ""] || Globe;
          const hasError = !!source.lastError;

          return (
            <Card
              key={source.id}
              className={cn(hasError && "border-red-300 bg-red-50/30")}
            >
              <CardContent className="pt-0 space-y-3">
                {/* Platform Icon + Name */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        source.enabled
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      <PlatformIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {source.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {source.platform?.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={source.enabled ?? true}
                    onCheckedChange={(checked) =>
                      handleToggleEnabled(source.id, !!checked)
                    }
                  />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-0.5" />
                    {frequencyLabels[source.crawlFrequency || ""] ||
                      source.crawlFrequency}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {methodLabels[source.crawlMethod || ""] ||
                      source.crawlMethod}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {source.signalsTotal} signals
                  </span>
                  <span>
                    {source.lastCrawledAt
                      ? formatDistanceToNow(new Date(source.lastCrawledAt), {
                          addSuffix: true,
                        })
                      : "Never crawled"}
                  </span>
                </div>

                {/* Error */}
                {hasError && (
                  <div className="flex items-start gap-1.5 p-2 rounded bg-red-100 text-red-700">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p className="text-xs">{source.lastError}</p>
                  </div>
                )}

                {/* Test Crawl Button */}
                <Button
                  variant="outline"
                  size="xs"
                  className="w-full"
                  onClick={() => handleTestCrawl(source.id)}
                  disabled={testingId === source.id}
                >
                  {testingId === source.id ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <TestTube className="w-3 h-3 mr-1" />
                  )}
                  Test Crawl
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
