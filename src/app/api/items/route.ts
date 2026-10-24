import { NextRequest, NextResponse } from "next/server";
import { readItems, searchItems, getCategories } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const all = searchParams.get("all") === "true";

  const items = readItems();

  if (all) {
    let filtered = items;
    if (category) {
      filtered = filtered.filter((i) => i.category === category);
    }
    return NextResponse.json({
      items: filtered,
      categories: getCategories(items),
      total: filtered.length,
    });
  }

  if (query) {
    let results = searchItems(query, items);
    if (category) {
      results = results.filter((i) => i.category === category);
    }
    return NextResponse.json({
      items: results,
      categories: getCategories(items),
      total: results.length,
    });
  }

  return NextResponse.json({
    items: [],
    categories: getCategories(items),
    total: 0,
  });
}
