import { NextRequest, NextResponse } from "next/server";
import { readItems, searchItems, getCategories } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const all = searchParams.get("all") === "true";

  const items = await readItems();

  const isCategoryMatch = (itemCategory: string, targetCategory: string) => {
    if (!targetCategory || targetCategory.toLowerCase() === "all") return true;
    const catA = (itemCategory || "").toLowerCase().trim();
    const catB = targetCategory.toLowerCase().trim();
    return catA === catB || catA.startsWith(catB) || catB.startsWith(catA);
  };

  if (all) {
    let filtered = items;
    if (category && category.toLowerCase() !== "all") {
      filtered = filtered.filter((i) => isCategoryMatch(i.category, category));
    }
    return NextResponse.json({
      items: filtered,
      categories: getCategories(items),
      total: filtered.length,
    });
  }

  if (query) {
    let results = searchItems(query, items);
    if (category && category.toLowerCase() !== "all") {
      results = results.filter((i) => isCategoryMatch(i.category, category));
    }
    return NextResponse.json({
      items: results,
      categories: getCategories(items),
      total: results.length,
    });
  }

  if (category) {
    const filtered =
      category.toLowerCase() === "all"
        ? items
        : items.filter((i) => isCategoryMatch(i.category, category));

    return NextResponse.json({
      items: filtered,
      categories: getCategories(items),
      total: filtered.length,
    });
  }

  return NextResponse.json({
    items: [],
    categories: getCategories(items),
    total: 0,
  });
}
