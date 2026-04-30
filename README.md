# 📦 Reseller Inventory App

🚀 Live App: https://arod0210-CS.github.io/Reseller-inventory/

A mobile-friendly inventory and finance tracker for resellers who buy pallets, returns, open-box items, used goods, liquidation lots, and local pickup inventory.

---

## Overview

The app helps resellers move items through the full lifecycle:

**buy → draft/list → manage inventory → sell → analyze profit**

It is built as a lightweight browser app with vanilla HTML/CSS/JavaScript and `localStorage`, so it can run without a backend while still persisting inventory on the device.

---

## Current Features

### Inventory

- Add, edit, and delete items
- Track name, description, category, condition, purchase cost, listed price, quantity, SKU/item ID, barcode, storage location, source, status, notes, and history
- Status lifecycle: draft, listed, available, sold, archived
- Item details screen with pricing, location, image gallery, sale history, and movement history
- Confirmation prompt before delete

### Images

- Multiple images per item
- Main image selection
- Image previews in cards, details, scanner, and forms
- Placeholder/avatar fallback when no image is available
- Images persist in localStorage as compressed data URLs

### Search, Sort, and Filters

- Search by name, item ID/SKU, barcode, category, notes, location, status, and condition
- Filter by category, storage location, status, condition, age, and profit range
- Sort by newest, oldest, name, listed price, profit, age, quantity, and status

### Dashboard and Finance

- Dashboard cards for total items, inventory value, total cost, estimated profit, sold items, low stock, and aging inventory
- Finance tab with revenue, cost, profit, sold units, averages, portfolio metrics, status breakdown, slow-moving items, chart analytics, and recent sales
- Analytics live inside the Finance tab, not as a separate tab

### Scanner / Draft Assistant

- Barcode/photo-assisted item intake
- Manual barcode entry creates a draft item
- Browser `BarcodeDetector` support when available
- Photo upload carries into the Add Item form
- Known demo product lookup + fallback draft generation
- Estimated category/price suggestions with verification messaging
- Optional backend AI scanner endpoint support without exposing API keys in the browser

> Note: the scanner works fully in-browser as a draft assistant: it can use the browser BarcodeDetector when available, look up numeric UPC/EAN codes through Open Food Facts, and fall back to local draft generation. For true photo-based AI recognition, set `window.PALLET_FLOW_SCANNER_ENDPOINT` or localStorage key `palletflow_scanner_endpoint` to a backend endpoint such as `/api/scan-product`; the backend should keep provider API keys in environment variables and return safe draft fields.

### Optional AI Backend

The repo includes `api/scan-product.js`, a Vercel-style serverless endpoint example. Deploy it somewhere that supports Node serverless functions, then set this environment variable on the backend host:

```bash
OPENAI_API_KEY=your_backend_only_key
```

In the app, open **Settings → Scanner Backend** and save the endpoint URL, for example:

```text
/api/scan-product
```

Never paste provider API keys into the browser app. The browser stores only the endpoint URL.

### UI / Mobile Experience

- Screen-based app layout
- Bottom navigation
- Modern blue/teal visual system
- Responsive mobile-first cards and sheets
- Safer text wrapping to prevent missing/cut-off words
- Empty states, toast feedback, form validation states, and accessible focus styling

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Browser `localStorage`
- Node.js syntax checks and logic tests

---

## Local Development

```bash
npm install
npm test
npm run build
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

---

## Testing

```bash
npm test
npm run build
```

Current tests cover important inventory logic, image/main-image persistence, filtering, profit ranges, sale flow behavior, scanner draft generation, mocked AI-backend lookup, and mocked product-database lookup.

---

## Project Structure

```text
index.html          App shell and screens
styles.css          Responsive UI and theme
app.js              UI state, rendering, forms, navigation
inventory.js        Inventory model, normalization, filters, sorting, sales
finance.js          Finance metrics and portfolio summaries
analytics.js        Chart data and rendering helpers
scanner.js          Barcode/photo draft assistant with optional AI backend + UPC fallback
api/scan-product.js Optional Node serverless AI scanner backend example
storage.js          localStorage persistence and seed data
labels.js           Label preview/download helpers
i18n.js             English/Spanish text
tests/              Node-based logic tests
```
