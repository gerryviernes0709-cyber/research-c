/**
 * Signal Extraction Prompt
 *
 * Used by the Tier 1 LLM (Kimi/Qwen via OpenAI-compatible API) to extract
 * structured signal data from raw web content. This is the first step in the
 * signal processing pipeline.
 */

export interface ExtractionInput {
  source: string;
  title: string;
  body: string;
  url?: string;
  author?: string;
  publishedAt?: string;
  metrics?: {
    upvotes?: number;
    comments?: number;
    views?: number;
    likes?: number;
    shares?: number;
    rating?: number;
    reviewCount?: number;
    searchVolume?: number;
    growth?: number;
    price?: number;
    bsr?: number;
  };
}

export function buildExtractionPrompt(content: ExtractionInput): string {
  const metricsStr = content.metrics
    ? Object.entries(content.metrics)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "None available";

  return `You are a signal extraction agent for PeptideIQ, a peptide market intelligence platform. Your job is to analyze raw content from web sources and extract structured signal data.

## PEPTIDES TO WATCH
BPC-157, TB-500, GHK-Cu, Ipamorelin, CJC-1295, PT-141, Thymosin Alpha-1, DSIP, Selank, Semax, Epithalon, AOD-9604, GHRP-6, GHRP-2, Melanotan II, Kisspeptin, MOTs-c, Humanin, LL-37, KPV, Sermorelin, Tesamorelin, Dihexa, Thymalin, Semaglutide, Tirzepatide

## SUB-NICHES
muscle recovery, anti-aging, cognitive enhancement, weight loss, hair growth, skin rejuvenation, sleep optimization, immune support, sexual health, gut health, pain management, fat loss, longevity, neuroprotection

## PRODUCT CATEGORIES
ebook, course, template, saas_tool, ai_app, calculator, tracker, community, membership, coaching, printable

## CONTENT TO ANALYZE

**Source Platform:** ${content.source}
**Title:** ${content.title}
**URL:** ${content.url ?? "N/A"}
**Author:** ${content.author ?? "Unknown"}
**Published:** ${content.publishedAt ?? "Unknown"}
**Engagement Metrics:** ${metricsStr}

**Body:**
${content.body.slice(0, 3000)}${content.body.length > 3000 ? "\n[...truncated]" : ""}

## EXTRACTION RULES

1. Identify ALL peptides mentioned (use exact names from the watch list).
2. Determine the content type: question, product_listing, discussion, review, tutorial, news, launch, complaint, trend_data, competitor_product.
3. Assess relevance to digital product opportunities (0-100). Score higher if:
   - Users are explicitly asking for a product/tool that doesn't exist
   - There's high engagement on a pain point (people struggling with something)
   - A competitor product is mentioned with reviews/pricing data
   - Trend data shows growing interest
4. Summarize the content in 1-3 sentences focused on product opportunity signals.
5. Identify which sub-niche and potential product category this relates to.
6. Flag if this might be a duplicate of recently processed signals.

## OUTPUT FORMAT

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "peptidesMentioned": ["BPC-157", ...],
  "contentType": "question|product_listing|discussion|review|tutorial|news|launch|complaint|trend_data|competitor_product",
  "relevanceScore": <0-100>,
  "contentSummary": "<1-3 sentence summary focused on opportunity signals>",
  "subNiche": "<matching sub-niche or null>",
  "suggestedCategory": "<matching product category or null>",
  "demandIndicators": {
    "explicitProductRequest": <true/false>,
    "painPointEngagement": <true/false>,
    "competitorData": <true/false>,
    "trendSignal": <true/false>
  },
  "possibleDuplicate": <true/false>,
  "opportunityNotes": "<any additional notes about the opportunity, or null>"
}`;
}
