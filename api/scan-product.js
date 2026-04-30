const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

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
    source: "AI backend"
  };
}

async function callOpenAI({ barcode, imageDataUrl }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const content = [
    {
      type: "text",
      text: [
        "You identify resale inventory items from a barcode and/or image.",
        "Return only JSON with keys: name, description, category, estimatedPrice.",
        "Allowed categories: electronics, appliances, tools, furniture, home, clothing, toys, vintage, other.",
        "Use cautious estimates and remind the user to verify condition/comps in the description.",
        barcode ? "Barcode/UPC: " + barcode : "No barcode provided."
      ].join(" ")
    }
  ];

  if (imageDataUrl) {
    content.push({
      type: "image_url",
      image_url: { url: imageDataUrl }
    });
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_SCANNER_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You create concise, safe reseller inventory drafts. Never invent certainty; include verification guidance."
        },
        {
          role: "user",
          content: content
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed with status " + response.status);
  }

  const payload = await response.json();
  const text = payload && payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
  return cleanDraft(JSON.parse(text || "{}"));
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

    const draft = await callOpenAI({ barcode, imageDataUrl });
    if (!draft) {
      sendJson(res, 501, { error: "OPENAI_API_KEY is not configured on the backend." });
      return;
    }

    sendJson(res, 200, { draft: draft });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Scanner backend failed." });
  }
};
