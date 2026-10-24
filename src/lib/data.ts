import fs from "fs";
import path from "path";
import Papa from "papaparse";

export interface Item {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number | null;
  pack_price: number | null;
  pack_qty: number | null;
  aliases: string;
  source_row: number;
  needs_review: string;
}

const CSV_PATH = path.join(process.cwd(), "data", "pricelist_clean.csv");

export function readItems(): Item[] {
  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const result = Papa.parse<Item>(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return result.data.map((item) => ({
    ...item,
    price: item.price ?? null,
    pack_price: item.pack_price ?? null,
    pack_qty: item.pack_qty ?? null,
    aliases: item.aliases ?? "",
    needs_review: item.needs_review ?? "",
  }));
}

export function writeItems(items: Item[]): void {
  const csv = Papa.unparse(items, {
    columns: [
      "id",
      "name",
      "category",
      "unit",
      "price",
      "pack_price",
      "pack_qty",
      "aliases",
      "source_row",
      "needs_review",
    ],
  });
  fs.writeFileSync(CSV_PATH, csv, "utf-8");
}

export function searchItems(query: string, items: Item[]): Item[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.aliases && item.aliases.toLowerCase().includes(q))
  );
}

export function getCategories(items: Item[]): string[] {
  const cats = new Set(items.map((i) => i.category));
  return Array.from(cats).sort();
}
