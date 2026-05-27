const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const UPCITEMDB_URL = "https://api.upcitemdb.com/prod/trial/lookup";

const CATEGORY_KEYWORDS = [
  { category: "electronics", words: ["tv", "laptop", "phone", "tablet", "speaker", "headphone", "camera", "monitor", "console"] },
  { category: "appliances", words: ["mixer", "blender", "microwave", "vacuum", "toaster", "air fryer", "coffee"] },
  { category: "tools", words: ["drill", "saw", "tool", "wrench", "driver", "dewalt", "milwaukee", "makita"] },
  { category: "furniture", words: ["chair", "table", "desk", "dresser", "cabinet", "sofa", "shelf"] },
  { category: "clothing", words: ["shirt", "hoodie", "shoe", "sneaker", "jacket", "pants", "nike", "adidas"] },
  { category: "toys", words: ["lego", "toy", "game", "doll", "puzzle", "figure"] },
  { category: "home", words: ["kitchen", "lamp", "bedding", "decor", "pan", "pot", "glass"] },
  { category: "vintage", words: ["vintage", "retro", "antique", "collectible"] }
];

const PRICE_BY_CATEGORY = {
  electronics: 49.99, appliances: 79.99, tools: 39.99,
  furniture: 89.99, home: 24.99, clothing: 19.99,
  toys: 24.99, vintage: 34.99, other: 19.99
};

function inferCategory(text) {
  const haystack = String(text || "").toLowerCase();
  const match = CATEGORY_KEYWORDS.find(function (entry) {
    return entry.words.some(function (word) { return haystack.indexOf(word) >= 0; });
  });
  return match ? match.category : "other";
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    let body = "";
    req.on("data", function (chunk) {
      body += chunk;
      if (body.length > 8_000_000) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });
    req.on("end", function () {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function cleanDraft(value) {
  const draft = value && typeof value === "object" ? value : {};
  return {
    name: String(draft.name || draft.title || "AI Scanned Item").slice(0, 120),
    description: String(draft.description || "AI generated this draft. Verify details before listing.").slice(0, 1000),
    category: String(draft.category || "other").toLowerCase(),
    estimatedPrice: Number.isFinite(Number(draft.estimatedPrice)) ? Math.max(0, Number(draft.estimatedPrice)) : null,
    imageUrl: String(draft.imageUrl || ""),
    source: draft.source || "AI backend"
  };
}

function parseDataUrl(dataUrl) {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const meta = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  const mediaTypeMatch = meta.match(/data:([^;]+);base64/);
  if (!mediaTypeMatch) return null;
  return { mediaType: mediaTypeMatch[1], data };
}

function extractJson(text) {
  if (!text) return "{}";
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();
  const braceBlock = text.match(/(\{[\s\S]*\})/);
  if (braceBlock) return braceBlock[1].trim();
  return text.trim();
}

async function lookupUPCitemdb(barcode) {
  if (!/^\d{8,14}$/.test(barcode)) return null;
  try {
    const response = await fetch(UPCITEMDB_URL + "?upc=" + encodeURIComponent(barcode), {
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return null;
    const payload = await response.json();
    if (payload.code !== "OK" || !Array.isArray(payload.items) || !payload.items[0]) return null;
    const item = payload.items[0];
    const brand = String(item.brand || "").trim();
    const title = String(item.title || "").trim();
    const name = title || (brand ? brand + " Product" : "");
    if (!name) return null;
    const categoryText = [item.category, name, item.description].filter(Boolean).join(" ");
    const category = inferCategory(categoryText);
    const low = Number(item.lowest_recorded_price);
    const high = Number(item.highest_recorded_price);
    const hasLow = Number.isFinite(low) && low > 0;
    const hasHigh = Number.isFinite(high) && high > 0;
    const estimatedPrice = hasLow
      ? Math.round(((low + (hasHigh ? high : low)) / 2) * 100) / 100
      : PRICE_BY_CATEGORY[category];
    const imageUrl = Array.isArray(item.images) && item.images[0] ? String(item.images[0]).trim() : "";
    return cleanDraft({
      name,
      description: ["Matched retail product database.", brand ? "Brand: " + brand + "." : "", "Verify condition and resale comps before listing."].filter(Boolean).join(" "),
      category,
      estimatedPrice,
      imageUrl,
      source: "UPCitemdb"
    });
  } catch (_) {
    return null;
  }
}

async function callClaude({ barcode, imageDataUrl }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const textContent = {
    type: "text",
    text: [
      "You identify resale inventory items from a barcode and/or image.",
      "Return only JSON with keys: name, description, category, estimatedPrice.",
      "Allowed categories: electronics, appliances, tools, furniture, home, clothing, toys, vintage, other.",
      "Use cautious estimates and remind the user to verify condition/comps in the description.",
      barcode ? "Barcode/UPC: " + barcode : "No barcode provided."
    ].join(" ")
  };

  const userContent = [textContent];

  if (imageDataUrl) {
    const parsed = parseDataUrl(imageDataUrl);
    if (parsed) {
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: parsed.mediaType, data: parsed.data }
      });
    }
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_SCANNER_MODEL || ANTHROPIC_MODEL,
      max_tokens: 256,
      system: "You create concise, safe reseller inventory drafts. Return only valid JSON. Never invent certainty; include verification guidance.",
      messages: [{ role: "user", content: userContent }]
    })
  });

  if (!response.ok) throw new Error("Anthropic request failed with status " + response.status);

  const payload = await response.json();
  const text = payload && payload.content && payload.content[0] && payload.content[0].text;
  return cleanDraft(JSON.parse(extractJson(text)));
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readBody(req);
    const barcode = String(body.barcode || "").replace(/[^0-9A-Za-z-]/g, "").trim();
    const imageDataUrl = String(body.imageDataUrl || "");

    if (!barcode && !imageDataUrl) {
      sendJson(res, 400, { error: "Provide barcode or imageDataUrl." });
      return;
    }

    // For barcode-only requests, try UPCitemdb first (no API key needed)
    if (barcode && !imageDataUrl) {
      const upcResult = await lookupUPCitemdb(barcode);
      if (upcResult) {
        sendJson(res, 200, { draft: upcResult });
        return;
      }
    }

    // Fall back to Claude AI (requires image or when UPCitemdb found nothing)
    const draft = await callClaude({ barcode, imageDataUrl });
    if (!draft) {
      sendJson(res, 501, { error: "ANTHROPIC_API_KEY is not configured on the backend." });
      return;
    }

    sendJson(res, 200, { draft: draft });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Scanner backend failed." });
  }
};
