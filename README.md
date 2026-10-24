# Samelix — Supplies Pricelist App

A price lookup, ordering, and inventory management tool for school/office supplies. Built with Next.js and deployable on Vercel with persistent Blob storage.

## Features

- 🔍 **Instant Search** — Type item names with autocomplete dropdown, keyboard navigation (↑↓ + Enter)
- 🛒 **Order Builder** — Add items to cart, adjust quantities, see running total, copy order to clipboard
- 🏷️ **Category Filters** — Filter by 7 categories (Papers, Folders, Pens, Adhesives, etc.)
- ✏️ **Inline Editing** — Click any item name/price in the Manage tab to edit it
- ➕ **Add New Items** — Form to add items with name, price, category, unit
- 🗑️ **Delete Items** — Remove items from the inventory
- 💾 **CSV Persistence** — All changes save back to the CSV file
- ☁️ **Vercel Ready** — Uses Vercel Blob for persistent storage in production

## Getting Started (Local)

```bash
cd samelix-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Step 1: Push to GitHub
```bash
cd samelix-app
git init
git add .
git commit -m "Initial commit - Samelix Supplies Pricelist App"
git remote add origin https://github.com/YOUR_USERNAME/samelix.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Vercel auto-detects Next.js — click **Deploy**

### Step 3: Set Up Blob Storage (for persistent edits)
1. In your Vercel project dashboard → **Storage** tab
2. Click **Create** → **Blob**
3. Follow the prompts — Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your project env vars
4. **Redeploy** the project (or it picks up on next deploy)

> Without Blob storage, the app still works for price lookups but item edits won't persist across deployments.

## Tech Stack

- **Next.js 16** (App Router)
- **Vercel Blob** (cloud CSV storage)
- **PapaParse** (CSV parsing/serialization)
- **Vanilla CSS** (dark theme with glassmorphism)

## Project Structure

```
samelix-app/
├── data/
│   └── pricelist_clean.csv    # 282 supply items
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── items/         # REST API routes
│   │   │       ├── route.ts          # GET /api/items (search/list)
│   │   │       ├── [id]/route.ts     # PUT/DELETE /api/items/:id
│   │   │       └── add/route.ts      # POST /api/items/add
│   │   ├── globals.css        # Design system
│   │   ├── layout.tsx         # Root layout + SEO
│   │   └── page.tsx           # Main app (search, cart, manage)
│   └── lib/
│       └── data.ts            # Data layer (local FS + Vercel Blob)
└── package.json
```
