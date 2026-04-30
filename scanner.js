(function (global) {
  const KNOWN_PRODUCTS = {
    "012345678905": {
      name: "Mixed Retail Item",
      description: "Barcode recognized from the demo catalog. Verify brand, model, and condition before listing.",
      category: "other",
      estimatedPrice: 24.99
    },
    "036000291452": {
      name: "Kleenex Tissue Pack",
      description: "Household consumable item. Confirm package count and condition.",
      category: "home",
      estimatedPrice: 8.99
    },
    "028400064057": {
      name: "Pantry / Grocery Item",
      description: "Barcode resembles a packaged consumer item. Check expiration date before listing.",
      category: "home",
      estimatedPrice: 5.99
    }
  };

  const PRICE_BY_CATEGORY = {
    electronics: 49.99,
    appliances: 79.99,
    tools: 39.99,
    furniture: 89.99,
    home: 24.99,
    clothing: 19.99,
    toys: 24.99,
    vintage: 34.99,
    other: 19.99
  };

  const PRODUCT_LOOKUP_TIMEOUT_MS = 4500;
  const AI_BACKEND_TIMEOUT_MS = 8000;
  const AI_BACKEND_ENDPOINT_KEY = "palletflow_scanner_endpoint";

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

  function cleanBarcode(barcode) {
    return String(barcode == null ? "" : barcode).replace(/[^0-9A-Za-z-]/g, "").trim();
  }

  function inferCategory(text) {
    const haystack = String(text || "").toLowerCase();
    const match = CATEGORY_KEYWORDS.find(function (entry) {
      return entry.words.some(function (word) {
        return haystack.indexOf(word) >= 0;
      });
    });
    return match ? match.category : "other";
  }

  function buildNameFromBarcode(barcode) {
    if (!barcode) {
      return "Photo Item";
    }
    const suffix = barcode.slice(-6);
    return "Scanned Item " + suffix;
  }

  function lookupBarcode(barcode) {
    const cleaned = cleanBarcode(barcode);
    if (!cleaned) {
      return Promise.resolve(null);
    }
    if (KNOWN_PRODUCTS[cleaned]) {
      return Promise.resolve(Object.assign({ source: "Demo catalog" }, KNOWN_PRODUCTS[cleaned]));
    }
    return lookupOpenFoodFacts(cleaned);
  }

  function getFetch() {
    return typeof global.fetch === "function" ? global.fetch.bind(global) : null;
  }

  function getConfiguredBackendEndpoint(config) {
    if (config && config.backendEndpoint) {
      return trimParts(config.backendEndpoint);
    }
    if (global.PALLET_FLOW_SCANNER_ENDPOINT) {
      return trimParts(global.PALLET_FLOW_SCANNER_ENDPOINT);
    }
    try {
      return global.localStorage ? trimParts(global.localStorage.getItem(AI_BACKEND_ENDPOINT_KEY)) : "";
    } catch (error) {
      return "";
    }
  }

  function fetchJsonWithTimeout(endpoint, options, timeoutMs) {
    const fetcher = getFetch();
    if (!fetcher) {
      return Promise.resolve(null);
    }

    let controller = null;
    let timeoutId = null;
    const requestOptions = options || {};

    if (typeof global.AbortController === "function") {
      controller = new global.AbortController();
      requestOptions.signal = controller.signal;
      timeoutId = global.setTimeout(function () {
        controller.abort();
      }, timeoutMs);
    }

    return fetcher(endpoint, requestOptions).then(function (response) {
      if (!response || !response.ok) {
        return null;
      }
      return response.json();
    }).catch(function () {
      return null;
    }).finally(function () {
      if (timeoutId) {
        global.clearTimeout(timeoutId);
      }
    });
  }

  function lookupAiBackend(config) {
    const endpoint = getConfiguredBackendEndpoint(config);
    if (!endpoint) {
      return Promise.resolve(null);
    }

    return fetchJsonWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        barcode: cleanBarcode(config && config.barcode),
        imageDataUrl: config && config.imageDataUrl ? config.imageDataUrl : ""
      })
    }, AI_BACKEND_TIMEOUT_MS).then(normalizeBackendProduct);
  }

  function normalizeBackendProduct(payload) {
    const raw = payload && (payload.draft || payload.product || payload);
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const name = trimParts(raw.name || raw.title || raw.productName || raw.product_name);
    const description = trimParts(raw.description || raw.summary || raw.notes);
    const category = inferCategory(trimParts(raw.category || raw.categoryName || "") + " " + name + " " + description);
    const estimatedPrice = Number(raw.estimatedPrice != null ? raw.estimatedPrice : raw.listedPrice != null ? raw.listedPrice : raw.price);
    const imageUrl = trimParts(raw.imageUrl || raw.itemImage || raw.image || raw.photoUrl);

    if (!name && !description && !imageUrl && !Number.isFinite(estimatedPrice)) {
      return null;
    }

    return {
      name: name || "AI Scanned Item",
      description: description || "AI backend generated this product draft. Verify details before listing.",
      category: category,
      estimatedPrice: Number.isFinite(estimatedPrice) && estimatedPrice >= 0 ? estimatedPrice : PRICE_BY_CATEGORY[category],
      imageUrl: imageUrl,
      source: trimParts(raw.source) || "AI backend"
    };
  }

  function lookupOpenFoodFacts(barcode) {
    const cleaned = cleanBarcode(barcode);
    const fetcher = getFetch();
    if (!fetcher || !/^\d{8,14}$/.test(cleaned)) {
      return Promise.resolve(null);
    }

    const endpoint = "https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(cleaned) + ".json?fields=product_name,brands,generic_name,categories,categories_tags,image_url,quantity";

    return fetchJsonWithTimeout(endpoint, undefined, PRODUCT_LOOKUP_TIMEOUT_MS).then(function (payload) {
      if (!payload || payload.status !== 1 || !payload.product) {
        return null;
      }
      return normalizeOpenFoodFactsProduct(payload.product);
    });
  }

  function normalizeOpenFoodFactsProduct(product) {
    const brand = trimParts(product.brands).split(",")[0];
    const productName = trimParts(product.product_name || product.generic_name || "");
    const quantity = trimParts(product.quantity);
    const nameParts = [brand, productName].filter(Boolean);
    const name = nameParts.length ? nameParts.join(" ") : "Scanned Product";
    const categoryText = [product.categories, Array.isArray(product.categories_tags) ? product.categories_tags.join(" ") : "", name].join(" ");
    const category = inferCategory(categoryText);
    const estimatedPrice = PRICE_BY_CATEGORY[category] || PRICE_BY_CATEGORY.other;
    const description = [
      "Matched product database result.",
      quantity ? "Package: " + quantity + "." : "",
      "Verify exact model, condition, and resale comps before listing."
    ].filter(Boolean).join(" ");

    return {
      name: name,
      description: description,
      category: category,
      estimatedPrice: estimatedPrice,
      imageUrl: trimParts(product.image_url),
      source: "Open Food Facts"
    };
  }

  function trimParts(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function detectBarcodeFromDataUrl(imageDataUrl) {
    if (!imageDataUrl || typeof global.BarcodeDetector !== "function" || typeof Image === "undefined") {
      return Promise.resolve("");
    }

    return new Promise(function (resolve) {
      let detector;
      try {
        detector = new global.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] });
      } catch (error) {
        resolve("");
        return;
      }

      const image = new Image();
      image.onload = function () {
        detector.detect(image).then(function (codes) {
          const first = codes && codes[0];
          resolve(cleanBarcode(first && first.rawValue));
        }).catch(function () {
          resolve("");
        });
      };
      image.onerror = function () {
        resolve("");
      };
      image.src = imageDataUrl;
    });
  }

  function generateItemDescription(input) {
    const barcode = cleanBarcode(input && input.barcode ? input.barcode : input);
    const name = input && input.name ? input.name : buildNameFromBarcode(barcode);
    if (input && input.lookup && input.lookup.description) {
      return Promise.resolve(input.lookup.description);
    }
    if (input && input.imageDataUrl && barcode) {
      return Promise.resolve("Photo captured and barcode " + barcode + " attached. Verify title, condition, and comps before listing.");
    }
    if (input && input.imageDataUrl) {
      return Promise.resolve("Photo captured for this item. Add brand, model, measurements, and condition notes before listing.");
    }
    if (barcode) {
      return Promise.resolve("Barcode " + barcode + " captured for " + name + ". Verify item details before listing.");
    }
    return Promise.resolve("");
  }

  function estimateItemPrice(itemData) {
    if (!itemData) {
      return Promise.resolve(null);
    }
    if (itemData.lookup && itemData.lookup.estimatedPrice != null) {
      return Promise.resolve(itemData.lookup.estimatedPrice);
    }
    const category = itemData.category || inferCategory([itemData.name, itemData.description].join(" "));
    return Promise.resolve(PRICE_BY_CATEGORY[category] || PRICE_BY_CATEGORY.other);
  }

  function fileToDataUrl(file, maxEdge, quality) {
    const targetSize = maxEdge || 900;
    const compression = quality == null ? 0.82 : quality;

    return new Promise(function (resolve, reject) {
      if (!file) {
        resolve("");
        return;
      }

      const reader = new FileReader();

      reader.onload = function (event) {
        const image = new Image();
        image.onload = function () {
          const scale = Math.min(1, targetSize / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", compression));
        };
        image.onerror = function () {
          resolve(String(event.target.result || ""));
        };
        image.src = String(event.target.result || "");
      };

      reader.onerror = function () {
        reject(new Error("Unable to read file."));
      };

      reader.readAsDataURL(file);
    });
  }

  function buildFallbackDraft(barcode, imageDataUrl) {
    const cleaned = cleanBarcode(barcode);
    return {
      name: cleaned || imageDataUrl ? buildNameFromBarcode(cleaned) : "",
      description: cleaned ? "Barcode " + cleaned + " captured. Verify details before listing." : "",
      category: "other",
      listedPrice: cleaned || imageDataUrl ? PRICE_BY_CATEGORY.other : null,
      originalBarcode: cleaned,
      itemImage: imageDataUrl || ""
    };
  }

  async function runScannerLookup(config) {
    const imageDataUrl = config && config.imageDataUrl ? config.imageDataUrl : "";
    const barcode = cleanBarcode(config && config.barcode ? config.barcode : "") || await detectBarcodeFromDataUrl(imageDataUrl);
    const lookup = await lookupAiBackend({
      barcode: barcode,
      imageDataUrl: imageDataUrl,
      backendEndpoint: config && config.backendEndpoint
    }) || await lookupBarcode(barcode);
    const inferredName = lookup && lookup.name ? lookup.name : buildNameFromBarcode(barcode);
    const inferredCategory = lookup && lookup.category ? lookup.category : inferCategory(inferredName);
    const generatedDescription = await generateItemDescription({
      barcode: barcode,
      imageDataUrl: imageDataUrl,
      lookup: lookup,
      name: inferredName
    });
    const estimatedPrice = await estimateItemPrice({
      barcode: barcode,
      imageDataUrl: imageDataUrl,
      lookup: lookup,
      name: inferredName,
      description: generatedDescription,
      category: inferredCategory
    });

    return {
      draft: {
        name: inferredName,
        description: generatedDescription,
        category: inferredCategory,
        listedPrice: estimatedPrice,
        originalBarcode: barcode,
        itemImage: imageDataUrl || (lookup && lookup.imageUrl) || "",
        source: lookup && lookup.source ? lookup.source : "Scanner draft"
      },
      message: lookup ? "Scanner matched a product draft from " + lookup.source + ". Please verify before saving." : "Scanner created a draft from the barcode/photo. Please verify before saving."
    };
  }

  global.PalletFlowScanner = {
    lookupBarcode: lookupBarcode,
    lookupAiBackend: lookupAiBackend,
    lookupOpenFoodFacts: lookupOpenFoodFacts,
    detectBarcodeFromDataUrl: detectBarcodeFromDataUrl,
    generateItemDescription: generateItemDescription,
    estimateItemPrice: estimateItemPrice,
    fileToDataUrl: fileToDataUrl,
    buildFallbackDraft: buildFallbackDraft,
    runScannerLookup: runScannerLookup
  };
})(window);
