export const IDEA_CATEGORIES = [
  { value: "ebook", label: "Ebook/Guide", icon: "BookOpen" },
  { value: "course", label: "Online Course", icon: "GraduationCap" },
  { value: "template", label: "Template/Printable", icon: "FileText" },
  { value: "saas_tool", label: "SaaS Tool", icon: "Wrench" },
  { value: "ai_app", label: "AI App", icon: "Bot" },
  { value: "calculator", label: "Calculator", icon: "Calculator" },
  { value: "tracker", label: "Tracker", icon: "BarChart3" },
  { value: "community", label: "Community", icon: "Users" },
  { value: "membership", label: "Membership", icon: "Crown" },
  { value: "coaching", label: "Coaching", icon: "Presentation" },
  { value: "printable", label: "Printable", icon: "Printer" },
  { value: "other", label: "Other", icon: "Package" },
] as const;

export const IDEA_STATUSES = [
  { value: "detected", label: "Detected", color: "bg-blue-500" },
  { value: "reviewing", label: "Reviewing", color: "bg-yellow-500" },
  { value: "approved", label: "Approved", color: "bg-green-500" },
  { value: "declined", label: "Declined", color: "bg-red-500" },
  { value: "archived", label: "Archived", color: "bg-gray-500" },
  { value: "incubating", label: "Incubating", color: "bg-purple-500" },
] as const;

export const OPPORTUNITY_TYPES = [
  { value: "proven_model", label: "Proven Model", color: "bg-emerald-500" },
  { value: "gap_opportunity", label: "Gap Opportunity", color: "bg-amber-500" },
  { value: "emerging_trend", label: "Emerging Trend", color: "bg-cyan-500" },
  { value: "first_mover", label: "First Mover", color: "bg-violet-500" },
  { value: "improvement", label: "Improvement", color: "bg-orange-500" },
] as const;

export const SOURCE_PLATFORMS = [
  { value: "reddit", label: "Reddit", icon: "MessageCircle" },
  { value: "google_trends", label: "Google Trends", icon: "TrendingUp" },
  { value: "youtube", label: "YouTube", icon: "Youtube" },
  { value: "tiktok", label: "TikTok", icon: "Music2" },
  { value: "twitter", label: "Twitter/X", icon: "Twitter" },
  { value: "facebook", label: "Facebook", icon: "Facebook" },
  { value: "telegram", label: "Telegram", icon: "Send" },
  { value: "etsy", label: "Etsy", icon: "ShoppingBag" },
  { value: "whop", label: "Whop", icon: "Store" },
  { value: "amazon", label: "Amazon", icon: "ShoppingCart" },
  { value: "gumroad", label: "Gumroad", icon: "CreditCard" },
  { value: "blackhatworld", label: "BlackHatWorld", icon: "Globe" },
  { value: "forum", label: "Forum", icon: "MessagesSquare" },
  { value: "rss", label: "RSS", icon: "Rss" },
  { value: "website", label: "Website", icon: "Globe" },
] as const;

export const PEPTIDE_LIST = [
  "BPC-157", "TB-500", "GHK-Cu", "Ipamorelin", "CJC-1295",
  "PT-141", "Thymosin Alpha-1", "DSIP", "Selank", "Semax",
  "Epithalon", "AOD-9604", "GHRP-6", "GHRP-2", "Melanotan II",
  "Kisspeptin", "MOTs-c", "Humanin", "LL-37", "KPV",
  "Sermorelin", "Tesamorelin", "Dihexa", "Thymalin", "Semaglutide",
  "Tirzepatide",
] as const;

export const SUB_NICHES = [
  "muscle recovery",
  "anti-aging",
  "cognitive enhancement",
  "weight loss",
  "hair growth",
  "skin rejuvenation",
  "sleep optimization",
  "immune support",
  "sexual health",
  "gut health",
  "pain management",
  "fat loss",
  "longevity",
  "neuroprotection",
] as const;

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/feed", label: "Feed", icon: "Rss" },
  { href: "/brain", label: "Brain", icon: "Brain" },
  { href: "/competitors", label: "Competitors", icon: "Swords" },
  { href: "/digest", label: "Digest", icon: "Newspaper" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/rules", label: "Rules", icon: "Shield" },
  { href: "/sources", label: "Sources", icon: "Database" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

export function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

export function getScoreBgColor(score: number): string {
  if (score >= 70) return "bg-green-500/10 text-green-500 border-green-500/20";
  if (score >= 50) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  return "bg-red-500/10 text-red-500 border-red-500/20";
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return "High";
  if (confidence >= 50) return "Medium";
  if (confidence >= 20) return "Low";
  return "Very Low";
}
