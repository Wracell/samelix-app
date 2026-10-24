import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { put, head, list } from "@vercel/blob";

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

const CSV_FILENAME = "pricelist_clean.csv";
const LOCAL_CSV_PATH = path.join(process.cwd(), "data", CSV_FILENAME);
const BLOB_PATH = `samelix/${CSV_FILENAME}`;

function isVercel(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// ===== Parse CSV string to Item[] =====
function parseCSV(csvContent: string): Item[] {
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

// ===== Serialize Item[] to CSV string =====
function serializeCSV(items: Item[]): string {
  return Papa.unparse(items, {
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
}

// ===== Read Items (auto-detects environment) =====
export async function readItems(): Promise<Item[]> {
  if (isVercel()) {
    try {
      // Try to read from Blob
      const blobs = await list({ prefix: "samelix/" });
      const existing = blobs.blobs.find((b) => b.pathname === BLOB_PATH);

      if (existing) {
        const response = await fetch(`${existing.url}?t=${Date.now()}`, {
          cache: "no-store",
        });
        const csvContent = await response.text();
        return parseCSV(csvContent);
      }

      // First time: upload local CSV to Blob, then read
      const localCSV = fs.readFileSync(LOCAL_CSV_PATH, "utf-8");
      await put(BLOB_PATH, localCSV, {
        access: "public",
        contentType: "text/csv",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return parseCSV(localCSV);
    } catch (error) {
      console.error("Blob read error, falling back to local:", error);
      // Fallback to local file
      const csvContent = fs.readFileSync(LOCAL_CSV_PATH, "utf-8");
      return parseCSV(csvContent);
    }
  } else {
    // Local development: read from filesystem
    const csvContent = fs.readFileSync(LOCAL_CSV_PATH, "utf-8");
    return parseCSV(csvContent);
  }
}

// ===== Write Items (auto-detects environment) =====
export async function writeItems(items: Item[]): Promise<void> {
  const csv = serializeCSV(items);

  if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured. Please create and connect a Vercel Blob store in your Vercel project dashboard."
    );
  }

  if (isVercel()) {
    try {
      await put(BLOB_PATH, csv, {
        access: "public",
        contentType: "text/csv",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } catch (error) {
      console.error("Blob write error:", error);
      throw new Error(
        `Failed to save to Vercel Blob storage: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  } else {
    // Local development: write to filesystem
    fs.writeFileSync(LOCAL_CSV_PATH, csv, "utf-8");
  }
}

// ===== Search Items =====
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

// ===== Get Unique Categories =====
export function getCategories(items: Item[]): string[] {
  const cats = new Set(items.map((i) => i.category).filter(Boolean));
  return Array.from(cats).sort();
}
