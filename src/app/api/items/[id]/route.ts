import { NextRequest, NextResponse } from "next/server";
import { readItems, writeItems } from "@/lib/data";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id);
  const body = await request.json();

  const items = readItems();
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

  writeItems(items);

  return NextResponse.json({ item: items[index], message: "Item updated" });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id);

  const items = readItems();
  const index = items.findIndex((i) => i.id === itemId);

  if (index === -1) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  items.splice(index, 1);
  writeItems(items);

  return NextResponse.json({ message: "Item deleted" });
}
