import { NextRequest, NextResponse } from "next/server";
import { mockCompetitors } from "@/mock/data";
import { nanoid } from "nanoid";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const competitor = mockCompetitors.find((c) => c.id === id);

    if (!competitor) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ products: competitor.products || [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const competitor = mockCompetitors.find((c) => c.id === id);

    if (!competitor) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, url, category, price, priceModel, descriptionSummary, peptidesCovered } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const product = {
      id: `cp-${nanoid(6)}`,
      competitorId: id,
      name,
      url: url || null,
      category: category || null,
      price: price || null,
      priceModel: priceModel || "unknown",
      descriptionSummary: descriptionSummary || null,
      peptidesCovered: peptidesCovered || [],
      estimatedSales: null,
      rating: null,
      reviewCount: null,
      firstSeenAt: new Date().toISOString(),
      lastCheckedAt: null,
      status: "active" as const,
      priceHistory: [],
    };

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
