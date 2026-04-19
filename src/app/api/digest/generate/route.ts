import { NextResponse } from "next/server";
import { mockIdeas, mockSignals } from "@/mock/data";
import { nanoid } from "nanoid";

export async function POST() {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
    const monthDay = today.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const topIdeas = [...mockIdeas]
      .sort(
        (a, b) =>
          parseFloat(b.scoreOverall || "0") -
          parseFloat(a.scoreOverall || "0")
      )
      .slice(0, 3);

    const recentSignals = mockSignals.filter(
      (s) =>
        new Date(s.detectedAt || 0).getTime() >
        Date.now() - 86400000
    );

    const digest = {
      id: `d-${nanoid(6)}`,
      date: dateStr,
      title: `${dayName} ${monthDay} — Daily Intelligence Digest`,
      summaryHtml: `<h2>DAILY DIGEST</h2>
<p>Today's digest covers ${recentSignals.length} new signals processed across all sources.</p>
<h3>TOP OPPORTUNITIES</h3>
<ol>
${topIdeas
  .map(
    (idea) =>
      `<li><strong>${idea.title}</strong> (Score: ${idea.scoreOverall}) — ${idea.summary?.slice(0, 120)}...</li>`
  )
  .join("\n")}
</ol>
<h3>SIGNAL SUMMARY</h3>
<ul>
<li>Total signals processed: ${recentSignals.length}</li>
<li>High relevance signals: ${recentSignals.filter((s) => parseFloat(s.relevanceScore || "0") > 80).length}</li>
<li>New unprocessed signals: ${recentSignals.filter((s) => !s.processed).length}</li>
</ul>
<h3>RECOMMENDATIONS</h3>
<p>Based on current signal patterns and your golden rules, consider prioritizing AI-powered tools and calculator products. The peptide reconstitution calculator remains the quickest win with the highest signal-to-effort ratio.</p>`,
      ideasFeatured: topIdeas.map((i) => i.id!),
      signalsProcessed: recentSignals.length,
      newIdeasCount: 0,
      scoreThresholdUsed: "60.00",
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(digest, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate digest" },
      { status: 500 }
    );
  }
}
