import { NextRequest, NextResponse } from "next/server";
import { readItems, writeItems } from "@/lib/data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || body.price === undefined) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const items = await readItems();
    const maxId = Math.max(...items.map((i) => i.id), 0);
    const maxSourceRow = Math.max(...items.map((i) => i.source_row), 0);

    const newItem = {
      id: maxId + 1,
      name: body.name,
      category: body.category || "Misc. Items",
      unit: body.unit || "piece",
      price: parseFloat(body.price),
      pack_price: body.pack_price ? parseFloat(body.pack_price) : null,
      pack_qty: body.pack_qty ? parseInt(body.pack_qty) : null,
      aliases: body.aliases || "",
      source_row: maxSourceRow + 1,
      needs_review: "",
    };

    items.push(newItem);
    await writeItems(items);

    return NextResponse.json(
      { item: newItem, message: "Item added" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding item:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to add item",
      },
      { status: 500 }
    );
  }
}
