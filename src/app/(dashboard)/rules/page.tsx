"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Shield,
  Plus,
  Check,
  X,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Ban,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Rule {
  id: string;
  ruleText: string;
  ruleType: string;
  direction: string;
  weight: number;
  active: boolean;
  approved: boolean;
  source: string;
  [key: string]: unknown;
}

const directionConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    label: string;
  }
> = {
  boost: {
    icon: ArrowUp,
    color: "text-green-600 bg-green-50 border-green-200",
    label: "Boost",
  },
  penalize: {
    icon: ArrowDown,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    label: "Penalize",
  },
  block: {
    icon: Ban,
    color: "text-red-600 bg-red-50 border-red-200",
    label: "Block",
  },
  require: {
    icon: AlertTriangle,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    label: "Require",
  },
};

const typeColors: Record<string, string> = {
  golden: "bg-amber-100 text-amber-800 border-amber-200",
  general: "bg-gray-100 text-gray-800 border-gray-200",
  preference: "bg-violet-100 text-violet-800 border-violet-200",
};

const sourceLabels: Record<string, string> = {
  manual: "Manual",
  ai_suggested: "AI Suggested",
  learned: "Learned",
};

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [submittingRule, setSubmittingRule] = useState(false);

  // New rule form state
  const [newRuleText, setNewRuleText] = useState("");
  const [newRuleType, setNewRuleType] = useState("golden");
  const [newDirection, setNewDirection] = useState("boost");
  const [newWeight, setNewWeight] = useState("1.0");

  // Fetch rules
  useEffect(() => {
    async function fetchRules() {
      setLoading(true);
      try {
        const [rulesRes, suggestionsRes] = await Promise.all([
          fetch("/api/rules"),
          fetch("/api/rules/suggestions"),
        ]);

        let allRules: Rule[] = [];

        if (rulesRes.ok) {
          const data = await rulesRes.json();
          allRules = Array.isArray(data) ? data : data.rules || data.data || [];
        }

        if (suggestionsRes.ok) {
          const data = await suggestionsRes.json();
          const suggestions = Array.isArray(data)
            ? data
            : data.suggestions || data.data || [];
          // Merge suggestions that aren't already in rules
          for (const s of suggestions) {
            if (!allRules.find((r) => r.id === s.id)) {
              allRules.push({ ...s, approved: false });
            }
          }
        }

        setRules(allRules);
      } catch {
        toast.error("Failed to load rules");
      } finally {
        setLoading(false);
      }
    }
    fetchRules();
  }, []);

  async function handleToggleActive(ruleId: string, active: boolean) {
    setActionLoading(ruleId + "-toggle");
    try {
      const res = await fetch(`/api/rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to toggle rule");
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, active } : r))
      );
      toast.success(active ? "Rule activated" : "Rule deactivated");
    } catch {
      toast.error("Failed to toggle rule");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAcceptSuggestion(ruleId: string) {
    setActionLoading(ruleId + "-accept");
    try {
      const res = await fetch(`/api/rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      if (!res.ok) throw new Error("Failed to accept suggestion");
      setRules((prev) =>
        prev.map((r) =>
          r.id === ruleId ? { ...r, approved: true, active: true } : r
        )
      );
      toast.success("Suggestion accepted and added to rules");
    } catch {
      toast.error("Failed to accept suggestion");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectSuggestion(ruleId: string) {
    setActionLoading(ruleId + "-reject");
    try {
      const res = await fetch(`/api/rules/${ruleId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to reject suggestion");
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success("Suggestion rejected");
    } catch {
      toast.error("Failed to reject suggestion");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleWeightChange(ruleId: string, weight: number) {
    try {
      const res = await fetch(`/api/rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight }),
      });
      if (!res.ok) throw new Error("Failed to update weight");
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, weight } : r))
      );
    } catch {
      toast.error("Failed to update weight");
    }
  }

  async function handleAddRule() {
    if (!newRuleText.trim()) return;
    setSubmittingRule(true);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleText: newRuleText,
          ruleType: newRuleType,
          direction: newDirection,
          weight: parseFloat(newWeight) || 1.0,
          source: "manual",
        }),
      });
      if (!res.ok) throw new Error("Failed to add rule");
      const data = await res.json();
      const newRule = data.rule || data;
      setRules((prev) => [...prev, { ...newRule, approved: true, active: true }]);
      setDialogOpen(false);
      setNewRuleText("");
      setNewRuleType("golden");
      setNewDirection("boost");
      setNewWeight("1.0");
      toast.success("Rule added successfully");
    } catch {
      toast.error("Failed to add rule");
    } finally {
      setSubmittingRule(false);
    }
  }

  const suggestedRules = rules.filter((r) => !r.approved);
  const activeRules = rules.filter((r) => r.approved);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
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
          <Shield className="w-5 h-5" />
          Golden Rules
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="w-4 h-4 mr-1" />
            Add Rule
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Rule</DialogTitle>
              <DialogDescription>
                Define a rule to guide how PeptideIQ scores and filters ideas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Rule Text
                </label>
                <Textarea
                  placeholder="e.g., Always boost ideas with AI components..."
                  value={newRuleText}
                  onChange={(e) => setNewRuleText(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Type
                  </label>
                  <Select value={newRuleType} onValueChange={(v) => { if (v) setNewRuleType(v); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="golden">Golden</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="preference">Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Direction
                  </label>
                  <Select value={newDirection} onValueChange={(v) => { if (v) setNewDirection(v); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boost">Boost</SelectItem>
                      <SelectItem value="penalize">Penalize</SelectItem>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="require">Require</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Weight
                </label>
                <Input
                  type="number"
                  placeholder="1.0"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRule} disabled={submittingRule}>
                {submittingRule && (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                )}
                Save Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Suggestions */}
      {suggestedRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-amber-500" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedRules.map((rule) => {
              const dir = directionConfig[rule.direction || "boost"];
              const DirIcon = dir.icon;

              return (
                <div
                  key={rule.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/50"
                >
                  <div
                    className={cn(
                      "p-1.5 rounded border shrink-0",
                      dir.color
                    )}
                  >
                    <DirIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{rule.ruleText}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          typeColors[rule.ruleType || "general"]
                        )}
                      >
                        {rule.ruleType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Weight: {rule.weight}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {sourceLabels[rule.source || "manual"]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-green-600 hover:bg-green-50"
                      onClick={() => handleAcceptSuggestion(rule.id)}
                      disabled={actionLoading === rule.id + "-accept"}
                    >
                      {actionLoading === rule.id + "-accept" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleRejectSuggestion(rule.id)}
                      disabled={actionLoading === rule.id + "-reject"}
                    >
                      {actionLoading === rule.id + "-reject" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Active Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeRules.map((rule) => {
          const dir = directionConfig[rule.direction || "boost"];
          const DirIcon = dir.icon;

          return (
            <Card key={rule.id}>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-1.5 rounded border shrink-0 mt-0.5",
                      dir.color
                    )}
                  >
                    <DirIcon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm font-medium flex-1">{rule.ruleText}</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      typeColors[rule.ruleType || "general"]
                    )}
                  >
                    {rule.ruleType}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-xs border", dir.color)}
                  >
                    {dir.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {sourceLabels[rule.source || "manual"]}
                  </Badge>
                </div>

                {/* Weight Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Weight</span>
                    <span className="font-medium text-foreground">
                      {(rule.weight || 1).toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[Math.round((rule.weight || 1) * 50)]}
                    min={0}
                    max={100}
                    onValueChange={(val: number | readonly number[]) => {
                      const raw = Array.isArray(val) ? val[0] : val;
                      const newWeight = raw / 50;
                      setRules((prev) =>
                        prev.map((r) =>
                          r.id === rule.id ? { ...r, weight: newWeight } : r
                        )
                      );
                    }}
                    onValueCommitted={(val: number | readonly number[]) => {
                      const raw = Array.isArray(val) ? val[0] : val;
                      const newWeight = raw / 50;
                      handleWeightChange(rule.id, newWeight);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch
                    checked={rule.active ?? true}
                    onCheckedChange={(checked) =>
                      handleToggleActive(rule.id, !!checked)
                    }
                    disabled={actionLoading === rule.id + "-toggle"}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
