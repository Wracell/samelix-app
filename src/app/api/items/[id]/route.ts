import { NextRequest, NextResponse } from "next/server";
import { readItems, writeItems } from "@/lib/data";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    const body = await request.json();

    const items = await readItems();
    const index = items.findIndex((i) => i.id === itemId);

    if (index === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Update fields
    if (body.name !== undefined) items[index].name = body.name;
    if (body.price !== undefined) items[index].price = body.price;
    if (body.category !== undefined) items[index].category = body.category;
    if (body.unit !== undefined) items[index].unit = body.unit;
    if (body.pack_price !== undefined) items[index].pack_price = body.pack_price;
    if (body.pack_qty !== undefined) items[index].pack_qty = body.pack_qty;

    await writeItems(items);

    return NextResponse.json({ item: items[index], message: "Item updated" });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update item",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    const items = await readItems();
    const index = items.findIndex((i) => i.id === itemId);

    if (index === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    items.splice(index, 1);
    await writeItems(items);

    return NextResponse.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete item",
      },
      { status: 500 }
    );
  }
}
