(function (global) {
  const CATEGORY_META = {
    electronics: { labelKey: "categoryElectronics", color: "#4a90e2", avatarClass: "avatar-blue" },
    vintage: { labelKey: "categoryVintage", color: "#7a5cff", avatarClass: "avatar-purple" },
    clothing: { labelKey: "categoryClothing", color: "#3bb273", avatarClass: "avatar-green" },
    home: { labelKey: "categoryHome", color: "#f28c28", avatarClass: "avatar-orange" },
    tools: { labelKey: "categoryTools", color: "#50627b", avatarClass: "avatar-slate" },
    toys: { labelKey: "categoryToys", color: "#e85d5d", avatarClass: "avatar-red" },
    appliances: { labelKey: "categoryAppliances", color: "#2ea59b", avatarClass: "avatar-teal" },
    furniture: { labelKey: "categoryFurniture", color: "#8d633f", avatarClass: "avatar-brown" },
    other: { labelKey: "categoryOther", color: "#7f8190", avatarClass: "avatar-gray" }
  };

  const STORAGE_META = {
    unknown: { labelKey: "locationUnknown", color: "#7f8190" },
    house: { labelKey: "locationHouse", color: "#f28c28" },
    "car-1": { labelKey: "locationCar1", color: "#4a90e2" },
    "car-2": { labelKey: "locationCar2", color: "#7a5cff" },
    storage: { labelKey: "locationStorage", color: "#2ea59b" },
    other: { labelKey: "locationOther", color: "#8d633f" }
  };

  const PLATFORM_META = {
    facebook: { labelKey: "platformFacebook", color: "#2b77f3" },
    ebay: { labelKey: "platformEbay", color: "#f5a623" },
    "in-person": { labelKey: "platformInPerson", color: "#3bb273" },
    other: { labelKey: "platformOther", color: "#7f8190" }
  };

  const CATEGORY_OPTIONS = Object.keys(CATEGORY_META);
  const STORAGE_OPTIONS = Object.keys(STORAGE_META);
  const PLATFORM_OPTIONS = Object.keys(PLATFORM_META);
  const SALE_STATUS_OPTIONS = ["draft", "listed", "available", "sold", "archived"];

  function uid(prefix) {
    return [prefix || "pf", Date.now(), Math.floor(Math.random() * 100000)].join("-");
  }

  function trimString(value) {
    return String(value == null ? "" : value).trim();
  }

  function toFiniteNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function toMoney(value) {
    const parsed = toFiniteNumber(value);
    if (parsed === null) {
      return null;
    }
    return Math.max(0, parsed);
  }

  function toQuantity(value, fallback) {
    if (value === null || value === undefined || trimString(value) === "") {
      return fallback == null ? 1 : fallback;
    }

    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return fallback == null ? 1 : fallback;
    }
    return Math.max(0, parsed);
  }

  function normalizeEnum(value, allowedValues, fallback) {
    return allowedValues.indexOf(value) >= 0 ? value : fallback;
  }

  function normalizeCategory(value) {
    return normalizeEnum(trimString(value).toLowerCase(), CATEGORY_OPTIONS, "other");
  }

  function normalizeStorageLocation(value) {
    return normalizeEnum(trimString(value).toLowerCase(), STORAGE_OPTIONS, "unknown");
  }

  function normalizePlatform(value) {
    if (!trimString(value)) {
      return null;
    }
    return normalizeEnum(trimString(value).toLowerCase(), PLATFORM_OPTIONS, "other");
  }

  function normalizeSaleStatus(value) {
    const cleaned = trimString(value).toLowerCase();
    if (cleaned === "active") {
      return "listed";
    }
    return normalizeEnum(cleaned, SALE_STATUS_OPTIONS, "listed");
  }

  function normalizeImages(rawItem) {
    const source = Array.isArray(rawItem.images) ? rawItem.images : Array.isArray(rawItem.itemImages) ? rawItem.itemImages : [];
    const images = source.concat([rawItem.itemImage, rawItem.image]).map(function (entry) {
      return trimString(entry);
    }).filter(Boolean).filter(function (entry, index, list) {
      return list.indexOf(entry) === index;
    });
    return images;
  }

  function getMainImage(item) {
    if (!item) {
      return "";
    }
    const images = Array.isArray(item.images) ? item.images : normalizeImages(item);
    const preferred = trimString(item.mainImage || item.itemImage);
    if (preferred && images.indexOf(preferred) >= 0) {
      return preferred;
    }
    return images[0] || preferred || "";
  }

  function toIsoDateTime(value, fallback) {
    const base = value || fallback || new Date().toISOString();
    const parsed = new Date(base);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  function toDateInputValue(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return [date.getFullYear(), month, day].join("-");
  }

  function getItemIdPrefix(dateAdded) {
    const date = new Date(dateAdded);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return "INV-" + [date.getFullYear(), month, day].join("");
  }

  function buildItemId(dateAdded, sequence) {
    return getItemIdPrefix(dateAdded) + "-" + String(sequence || 1).padStart(4, "0");
  }

  function generateNextItemId(existingItems, dateAdded) {
    const prefix = getItemIdPrefix(dateAdded);
    let highest = 0;

    (Array.isArray(existingItems) ? existingItems : []).forEach(function (item) {
      const currentId = trimString(item && item.itemId);
      if (!currentId.startsWith(prefix)) {
        return;
      }
      const match = currentId.match(/-(\d{4})$/);
      if (match) {
        highest = Math.max(highest, Number(match[1]));
      }
    });

    return buildItemId(dateAdded, highest + 1);
  }

  function inferStorageFromRaw(rawItem) {
    const explicit = normalizeStorageLocation(rawItem.storageLocation);
    const existingCustom = trimString(rawItem.customLocation);

    if (explicit !== "unknown") {
      return {
        storageLocation: explicit,
        customLocation: explicit === "other" ? existingCustom || trimString(rawItem.location) : existingCustom
      };
    }

    const legacyLocation = trimString(rawItem.location);
    const lower = legacyLocation.toLowerCase();

    if (!lower) {
      return { storageLocation: "unknown", customLocation: "" };
    }
    if (lower.indexOf("compartment 1") >= 0 || lower.indexOf("car 1") >= 0) {
      return { storageLocation: "car-1", customLocation: "" };
    }
    if (lower.indexOf("compartment 2") >= 0 || lower.indexOf("car 2") >= 0) {
      return { storageLocation: "car-2", customLocation: "" };
    }
    if (lower.indexOf("storage") >= 0 || lower.indexOf("unit") >= 0) {
      return { storageLocation: "storage", customLocation: legacyLocation };
    }
    if (lower.indexOf("house") >= 0 || lower.indexOf("garage") >= 0 || lower.indexOf("shelf") >= 0 || lower.indexOf("closet") >= 0) {
      return { storageLocation: "house", customLocation: legacyLocation };
    }
    return { storageLocation: "other", customLocation: legacyLocation };
  }

  function buildMovement(data) {
    return {
      id: trimString(data && data.id) || uid("movement"),
      type: trimString(data && data.type) || "edited",
      date: toIsoDateTime(data && data.date, new Date().toISOString()),
      note: trimString(data && data.note),
      qtyBefore: Math.max(0, toQuantity(data && data.qtyBefore, 0)),
      qtyAfter: Math.max(0, toQuantity(data && data.qtyAfter, 0)),
      soldPrice: toMoney(data && data.soldPrice),
      soldPlatform: normalizePlatform(data && data.soldPlatform)
    };
  }

  function buildSaleHistoryEntry(data) {
    return {
      id: trimString(data && data.id) || uid("sale"),
      quantity: Math.max(1, toQuantity(data && data.quantity, 1)),
      soldPrice: toMoney(data && data.soldPrice),
      dateSold: toIsoDateTime(data && data.dateSold, new Date().toISOString()),
      soldPlatform: normalizePlatform(data && data.soldPlatform),
      note: trimString(data && data.note),
      costPerUnit: Math.max(0, toMoney(data && data.costPerUnit) == null ? 0 : toMoney(data && data.costPerUnit))
    };
  }

  function normalizeSalesHistory(rawItem, cost) {
    const directHistory = Array.isArray(rawItem.salesHistory) ? rawItem.salesHistory : [];
    const sales = [];

    if (directHistory.length) {
      directHistory.forEach(function (entry) {
        sales.push(buildSaleHistoryEntry({
          id: entry.id,
          quantity: entry.quantity,
          soldPrice: entry.soldPrice,
          dateSold: entry.dateSold,
          soldPlatform: entry.soldPlatform,
          note: entry.note,
          costPerUnit: entry.costPerUnit == null ? cost : entry.costPerUnit
        }));
      });
    } else if (Array.isArray(rawItem.movementHistory)) {
      rawItem.movementHistory.forEach(function (movement) {
        if (trimString(movement.type).toLowerCase() !== "sold") {
          return;
        }

        const qtyBefore = toQuantity(movement.qtyBefore, 0);
        const qtyAfter = toQuantity(movement.qtyAfter, 0);
        const soldQuantity = Math.max(1, qtyBefore - qtyAfter || toQuantity(rawItem.soldQty || rawItem.soldQuantity, 1));

        sales.push(buildSaleHistoryEntry({
          quantity: soldQuantity,
          soldPrice: movement.soldPrice,
          dateSold: movement.date || rawItem.dateSold || rawItem.soldAt,
          soldPlatform: movement.soldPlatform || rawItem.soldPlatform || rawItem.salePlatform,
          note: movement.note,
          costPerUnit: cost
        }));
      });
    } else {
      const saleStatus = normalizeSaleStatus(rawItem.saleStatus || rawItem.status);
      const soldPrice = toMoney(rawItem.soldPrice);
      const migratedSoldQuantity = Math.max(0, toQuantity(rawItem.soldQuantity != null ? rawItem.soldQuantity : rawItem.soldQty, 0));
      const saleDate = rawItem.dateSold || rawItem.soldAt;
      const rawQuantity = toQuantity(rawItem.quantity != null ? rawItem.quantity : rawItem.qty, 1);
      const finalSoldQuantity = migratedSoldQuantity || (saleStatus === "sold" ? Math.max(1, rawQuantity || 1) : 0);

      if (saleDate || soldPrice != null || finalSoldQuantity > 0) {
        sales.push(buildSaleHistoryEntry({
          quantity: Math.max(1, finalSoldQuantity || 1),
          soldPrice: soldPrice,
          dateSold: saleDate || rawItem.updatedAt || rawItem.createdAt,
          soldPlatform: rawItem.soldPlatform || rawItem.salePlatform,
          note: rawItem.notes,
          costPerUnit: cost
        }));
      }
    }

    return sales.sort(function (left, right) {
      return new Date(left.dateSold) - new Date(right.dateSold);
    });
  }

  function normalizeMovementHistory(rawHistory, itemModel, salesHistory) {
    if (Array.isArray(rawHistory) && rawHistory.length) {
      return rawHistory.map(function (entry) {
        return buildMovement(entry);
      }).sort(function (left, right) {
        return new Date(left.date) - new Date(right.date);
      });
    }

    const initialAvailable = itemModel.quantity;
    const totalSold = salesHistory.reduce(function (sum, sale) {
      return sum + sale.quantity;
    }, 0);
    const startingQuantity = Math.max(initialAvailable + totalSold, initialAvailable, 1);
    const history = [
      buildMovement({
        type: "created",
        date: itemModel.dateAdded,
        note: "Item record created.",
        qtyBefore: 0,
        qtyAfter: startingQuantity
      })
    ];

    let runningQty = startingQuantity;
    salesHistory.forEach(function (sale) {
      history.push(buildMovement({
        type: "sold",
        date: sale.dateSold,
        note: sale.note || "Item sold.",
        qtyBefore: runningQty,
        qtyAfter: Math.max(0, runningQty - sale.quantity),
        soldPrice: sale.soldPrice,
        soldPlatform: sale.soldPlatform
      }));
      runningQty = Math.max(0, runningQty - sale.quantity);
    });

    return history;
  }

  function normalizeItem(rawItem, context) {
    const rawQuantity = rawItem.quantity != null ? rawItem.quantity : rawItem.qty;
    const baseQuantity = rawQuantity === undefined || rawQuantity === null || trimString(rawQuantity) === ""
      ? 1
      : Math.max(0, toQuantity(rawQuantity, 1));
    const dateAdded = toIsoDateTime(rawItem.dateAdded || rawItem.createdAt || rawItem.updatedAt, new Date().toISOString());
    const category = normalizeCategory(rawItem.category);
    const cost = Math.max(0, toMoney(rawItem.cost != null ? rawItem.cost : rawItem.purchasePrice) == null ? 0 : toMoney(rawItem.cost != null ? rawItem.cost : rawItem.purchasePrice));
    const salesHistory = normalizeSalesHistory(rawItem, cost);
    const soldQuantity = salesHistory.reduce(function (sum, sale) {
      return sum + sale.quantity;
    }, 0);
    const statusSeed = normalizeSaleStatus(rawItem.saleStatus || rawItem.status);
    const hasDirectSalesHistory = Array.isArray(rawItem.salesHistory) && rawItem.salesHistory.length > 0;
    const images = normalizeImages(rawItem);
    const inferredSold = (statusSeed === "sold" && (!hasDirectSalesHistory || baseQuantity === 0)) || (baseQuantity === 0 && soldQuantity > 0);
    let quantity = inferredSold ? 0 : baseQuantity;

    if (!inferredSold && quantity === 0) {
      quantity = 1;
    }

    const normalizedStatus = inferredSold ? "sold" : (statusSeed === "sold" ? "available" : statusSeed);
    const latestSale = salesHistory[salesHistory.length - 1] || null;
    const storageInfo = inferStorageFromRaw(rawItem);
    const preferredItemId = trimString(rawItem.itemId || rawItem.labelId || rawItem.internalBarcode);
    const itemId = context.resolveItemId(dateAdded, preferredItemId);
    const movementHistory = normalizeMovementHistory(rawItem.movementHistory, {
      dateAdded: dateAdded,
      quantity: quantity
    }, salesHistory);

    return {
      id: context.ensureRecordId(trimString(rawItem.id)),
      itemId: itemId,
      name: trimString(rawItem.name) || "Untitled Item",
      description: trimString(rawItem.description),
      condition: trimString(rawItem.condition) || "used",
      category: category,
      cost: cost,
      listedPrice: toMoney(rawItem.listedPrice != null ? rawItem.listedPrice : rawItem.onlinePrice != null ? rawItem.onlinePrice : rawItem.price),
      soldPrice: latestSale && latestSale.soldPrice != null ? latestSale.soldPrice : toMoney(rawItem.soldPrice),
      saleStatus: normalizedStatus,
      dateAdded: dateAdded,
      dateSold: latestSale ? latestSale.dateSold : (rawItem.dateSold || rawItem.soldAt ? toIsoDateTime(rawItem.dateSold || rawItem.soldAt, dateAdded) : null),
      storageLocation: storageInfo.storageLocation,
      customLocation: storageInfo.customLocation,
      soldPlatform: latestSale ? latestSale.soldPlatform : normalizePlatform(rawItem.soldPlatform || rawItem.salePlatform),
      originalBarcode: trimString(rawItem.originalBarcode || rawItem.barcode),
      internalBarcode: trimString(rawItem.internalBarcode) || itemId,
      itemImage: trimString(rawItem.mainImage || rawItem.itemImage || rawItem.image || images[0]),
      mainImage: trimString(rawItem.mainImage || rawItem.itemImage || rawItem.image || images[0]),
      images: images,
      notes: trimString(rawItem.notes),
      source: trimString(rawItem.source || rawItem.pallet),
      quantity: quantity,
      soldQuantity: soldQuantity,
      salesHistory: salesHistory,
      movementHistory: movementHistory,
      lastUpdated: toIsoDateTime(rawItem.lastUpdated || rawItem.updatedAt, dateAdded)
    };
  }

  function normalizeItems(rawItems) {
    const items = Array.isArray(rawItems) ? rawItems : [];
    const usedIds = new Set();
    const usedItemIds = new Set();
    const counters = {};

    function ensureRecordId(preferredId) {
      let candidate = preferredId || uid("item");
      while (usedIds.has(candidate)) {
        candidate = uid("item");
      }
      usedIds.add(candidate);
      return candidate;
    }

    function resolveItemId(dateAdded, preferredId) {
      const cleaned = trimString(preferredId);
      if (cleaned && !usedItemIds.has(cleaned)) {
        usedItemIds.add(cleaned);
        return cleaned;
      }

      const prefix = getItemIdPrefix(dateAdded);
      let counter = counters[prefix] || 1;
      let candidate = buildItemId(dateAdded, counter);

      while (usedItemIds.has(candidate)) {
        counter += 1;
        candidate = buildItemId(dateAdded, counter);
      }

      counters[prefix] = counter + 1;
      usedItemIds.add(candidate);
      return candidate;
    }

    return items.map(function (item) {
      return normalizeItem(item || {}, {
        ensureRecordId: ensureRecordId,
        resolveItemId: resolveItemId
      });
    });
  }

  function createItem(payload, existingItems) {
    const nowIso = new Date().toISOString();
    const dateAdded = toIsoDateTime(payload.dateAdded, nowIso);
    const status = normalizeSaleStatus(payload.saleStatus || "listed");
    const selectedQuantity = toQuantity(payload.quantity, 1);
    const availableQuantity = status === "sold" || status === "archived" ? 0 : Math.max(1, selectedQuantity || 1);
    const soldQuantity = status === "sold" ? Math.max(1, selectedQuantity || 1) : 0;
    const soldPrice = toMoney(payload.soldPrice);
    const soldDate = status === "sold" ? toIsoDateTime(payload.dateSold, nowIso) : null;
    const soldPlatform = status === "sold" ? normalizePlatform(payload.soldPlatform) : null;
    const itemId = trimString(payload.itemId) || generateNextItemId(existingItems, dateAdded);
    const base = {
      id: uid("item"),
      itemId: itemId,
      name: trimString(payload.name),
      description: trimString(payload.description),
      condition: trimString(payload.condition) || "used",
      category: normalizeCategory(payload.category),
      cost: Math.max(0, toMoney(payload.cost) == null ? 0 : toMoney(payload.cost)),
      listedPrice: toMoney(payload.listedPrice),
      soldPrice: soldPrice,
      saleStatus: status,
      dateAdded: dateAdded,
      dateSold: soldDate,
      storageLocation: normalizeStorageLocation(payload.storageLocation),
      customLocation: trimString(payload.customLocation),
      soldPlatform: soldPlatform,
      originalBarcode: trimString(payload.originalBarcode),
      internalBarcode: itemId,
      itemImage: getMainImage(payload),
      mainImage: getMainImage(payload),
      images: normalizeImages(payload),
      notes: trimString(payload.notes),
      source: trimString(payload.source),
      quantity: availableQuantity,
      soldQuantity: soldQuantity,
      salesHistory: [],
      movementHistory: [
        buildMovement({
          type: "created",
          date: dateAdded,
          note: "Item record created.",
          qtyBefore: 0,
          qtyAfter: status === "sold" ? Math.max(1, soldQuantity) : availableQuantity
        })
      ],
      lastUpdated: nowIso
    };

    if (status === "sold") {
      base.salesHistory = [
        buildSaleHistoryEntry({
          quantity: Math.max(1, soldQuantity),
          soldPrice: soldPrice,
          dateSold: soldDate,
          soldPlatform: soldPlatform,
          note: trimString(payload.notes),
          costPerUnit: base.cost
        })
      ];
      base.movementHistory.push(buildMovement({
        type: "sold",
        date: soldDate,
        note: trimString(payload.notes) || "Item sold.",
        qtyBefore: Math.max(1, soldQuantity),
        qtyAfter: 0,
        soldPrice: soldPrice,
        soldPlatform: soldPlatform
      }));
    }

    return normalizeItems([base])[0];
  }

  function getChangedFields(beforeItem, afterItem) {
    const labels = [];
    const map = [
      ["name", "name"],
      ["description", "description"],
      ["condition", "condition"],
      ["category", "category"],
      ["cost", "cost"],
      ["listedPrice", "listedPrice"],
      ["storageLocation", "storageLocation"],
      ["customLocation", "customLocation"],
      ["originalBarcode", "originalBarcode"],
      ["notes", "notes"],
      ["source", "source"],
      ["quantity", "quantity"],
      ["saleStatus", "saleStatus"]
    ];

    map.forEach(function (pair) {
      const field = pair[0];
      if (String(beforeItem[field]) !== String(afterItem[field])) {
        labels.push(field);
      }
    });

    return labels;
  }

  function updateItem(existingItem, payload) {
    const nowIso = new Date().toISOString();
    const status = normalizeSaleStatus(payload.saleStatus || existingItem.saleStatus);
    let quantity = payload.quantity === undefined || payload.quantity === null || trimString(payload.quantity) === ""
      ? (existingItem.saleStatus === "sold" ? existingItem.quantity : Math.max(existingItem.quantity, 1))
      : Math.max(0, toQuantity(payload.quantity, 1));
    const base = {
      id: existingItem.id,
      itemId: existingItem.itemId,
      internalBarcode: existingItem.internalBarcode || existingItem.itemId,
      name: trimString(payload.name),
      description: trimString(payload.description),
      condition: trimString(payload.condition) || "used",
      category: normalizeCategory(payload.category),
      cost: Math.max(0, toMoney(payload.cost) == null ? 0 : toMoney(payload.cost)),
      listedPrice: toMoney(payload.listedPrice),
      saleStatus: status,
      dateAdded: toIsoDateTime(payload.dateAdded, existingItem.dateAdded),
      storageLocation: normalizeStorageLocation(payload.storageLocation),
      customLocation: trimString(payload.customLocation),
      originalBarcode: trimString(payload.originalBarcode),
      itemImage: getMainImage(payload),
      mainImage: getMainImage(payload),
      images: normalizeImages(payload),
      notes: trimString(payload.notes),
      source: trimString(payload.source),
      lastUpdated: nowIso,
      salesHistory: existingItem.salesHistory.slice(),
      movementHistory: existingItem.movementHistory.slice(),
      soldQuantity: existingItem.soldQuantity,
      soldPrice: existingItem.soldPrice,
      soldPlatform: existingItem.soldPlatform,
      dateSold: existingItem.dateSold
    };

    if (status === "sold" && existingItem.saleStatus !== "sold") {
      const soldQty = Math.max(1, quantity || existingItem.quantity || 1);
      const soldPrice = toMoney(payload.soldPrice);
      const soldDate = toIsoDateTime(payload.dateSold, nowIso);
      const soldPlatform = normalizePlatform(payload.soldPlatform);

      base.quantity = 0;
      base.soldQuantity = existingItem.soldQuantity + soldQty;
      base.soldPrice = soldPrice;
      base.dateSold = soldDate;
      base.soldPlatform = soldPlatform;
      base.salesHistory.push(buildSaleHistoryEntry({
        quantity: soldQty,
        soldPrice: soldPrice,
        dateSold: soldDate,
        soldPlatform: soldPlatform,
        note: trimString(payload.notes),
        costPerUnit: base.cost
      }));
      base.movementHistory.push(buildMovement({
        type: "sold",
        date: soldDate,
        note: trimString(payload.notes) || "Item sold.",
        qtyBefore: Math.max(existingItem.quantity, soldQty),
        qtyAfter: 0,
        soldPrice: soldPrice,
        soldPlatform: soldPlatform
      }));
    } else {
      if (status === "available" || status === "listed" || status === "draft") {
        quantity = Math.max(1, quantity || 1);
      }

      base.quantity = status === "sold" || status === "archived" ? 0 : quantity;

      if (existingItem.saleStatus === "sold" && status === "sold" && base.salesHistory.length) {
        const updatedSale = buildSaleHistoryEntry({
          id: base.salesHistory[base.salesHistory.length - 1].id,
          quantity: base.salesHistory[base.salesHistory.length - 1].quantity,
          soldPrice: payload.soldPrice != null && trimString(payload.soldPrice) !== "" ? payload.soldPrice : base.salesHistory[base.salesHistory.length - 1].soldPrice,
          dateSold: payload.dateSold || base.salesHistory[base.salesHistory.length - 1].dateSold,
          soldPlatform: payload.soldPlatform || base.salesHistory[base.salesHistory.length - 1].soldPlatform,
          note: trimString(payload.notes) || base.salesHistory[base.salesHistory.length - 1].note,
          costPerUnit: base.cost
        });

        base.salesHistory[base.salesHistory.length - 1] = updatedSale;
        base.soldPrice = updatedSale.soldPrice;
        base.dateSold = updatedSale.dateSold;
        base.soldPlatform = updatedSale.soldPlatform;
        base.quantity = 0;
      } else if (existingItem.saleStatus === "sold" && status === "available") {
        base.soldPrice = existingItem.soldPrice;
        base.dateSold = existingItem.dateSold;
        base.soldPlatform = existingItem.soldPlatform;
        base.movementHistory.push(buildMovement({
          type: "restocked",
          date: nowIso,
          note: "Item reopened and restocked.",
          qtyBefore: existingItem.quantity,
          qtyAfter: base.quantity
        }));
      }

      if (existingItem.quantity !== base.quantity && !(existingItem.saleStatus === "sold" && status === "available")) {
        base.movementHistory.push(buildMovement({
          type: "quantity-adjusted",
          date: nowIso,
          note: "Quantity updated.",
          qtyBefore: existingItem.quantity,
          qtyAfter: base.quantity
        }));
      }
    }

    const preview = normalizeItems([base])[0];
    const changedFields = getChangedFields(existingItem, preview);

    if (changedFields.length) {
      base.movementHistory.push(buildMovement({
        type: "edited",
        date: nowIso,
        note: "Item details updated.",
        qtyBefore: existingItem.quantity,
        qtyAfter: preview.quantity
      }));
    }

    return normalizeItems([base])[0];
  }

  function recordSale(existingItem, salePayload) {
    const nowIso = new Date().toISOString();
    const quantityToSell = Math.max(1, toQuantity(salePayload.quantity, 1));
    const nextQuantity = Math.max(0, existingItem.quantity - quantityToSell);
    const soldPrice = toMoney(salePayload.soldPrice);
    const soldDate = toIsoDateTime(salePayload.dateSold, nowIso);
    const soldPlatform = normalizePlatform(salePayload.soldPlatform);
    const note = trimString(salePayload.note);
    const updated = {
      id: existingItem.id,
      itemId: existingItem.itemId,
      internalBarcode: existingItem.internalBarcode || existingItem.itemId,
      name: existingItem.name,
      description: existingItem.description,
      condition: existingItem.condition,
      category: existingItem.category,
      cost: existingItem.cost,
      listedPrice: existingItem.listedPrice,
      soldPrice: soldPrice,
      saleStatus: nextQuantity > 0 ? "available" : "sold",
      dateAdded: existingItem.dateAdded,
      dateSold: soldDate,
      storageLocation: existingItem.storageLocation,
      customLocation: existingItem.customLocation,
      soldPlatform: soldPlatform,
      originalBarcode: existingItem.originalBarcode,
      itemImage: getMainImage(existingItem),
      mainImage: getMainImage(existingItem),
      images: normalizeImages(existingItem),
      notes: existingItem.notes,
      source: existingItem.source,
      quantity: nextQuantity,
      soldQuantity: existingItem.soldQuantity + quantityToSell,
      salesHistory: existingItem.salesHistory.concat([
        buildSaleHistoryEntry({
          quantity: quantityToSell,
          soldPrice: soldPrice,
          dateSold: soldDate,
          soldPlatform: soldPlatform,
          note: note,
          costPerUnit: existingItem.cost
        })
      ]),
      movementHistory: existingItem.movementHistory.concat([
        buildMovement({
          type: "sold",
          date: soldDate,
          note: note || "Item sold.",
          qtyBefore: existingItem.quantity,
          qtyAfter: nextQuantity,
          soldPrice: soldPrice,
          soldPlatform: soldPlatform
        })
      ]),
      lastUpdated: nowIso
    };

    return normalizeItems([updated])[0];
  }

  function recordRestock(existingItem, restockPayload) {
    const nowIso = new Date().toISOString();
    const quantityToAdd = Math.max(1, toQuantity(restockPayload.quantity, 1));
    const note = trimString(restockPayload.note);
    const nextQuantity = Math.max(1, existingItem.quantity + quantityToAdd);
    const updated = {
      id: existingItem.id,
      itemId: existingItem.itemId,
      internalBarcode: existingItem.internalBarcode || existingItem.itemId,
      name: existingItem.name,
      description: existingItem.description,
      condition: existingItem.condition,
      category: existingItem.category,
      cost: existingItem.cost,
      listedPrice: existingItem.listedPrice,
      soldPrice: existingItem.soldPrice,
      saleStatus: "available",
      dateAdded: existingItem.dateAdded,
      dateSold: existingItem.dateSold,
      storageLocation: existingItem.storageLocation,
      customLocation: existingItem.customLocation,
      soldPlatform: existingItem.soldPlatform,
      originalBarcode: existingItem.originalBarcode,
      itemImage: getMainImage(existingItem),
      mainImage: getMainImage(existingItem),
      images: normalizeImages(existingItem),
      notes: existingItem.notes,
      source: existingItem.source,
      quantity: nextQuantity,
      soldQuantity: existingItem.soldQuantity,
      salesHistory: existingItem.salesHistory.slice(),
      movementHistory: existingItem.movementHistory.concat([
        buildMovement({
          type: "restocked",
          date: nowIso,
          note: note || "Item restocked.",
          qtyBefore: existingItem.quantity,
          qtyAfter: nextQuantity
        })
      ]),
      lastUpdated: nowIso
    };

    return normalizeItems([updated])[0];
  }

  function getCategoryLabel(category, t) {
    const meta = CATEGORY_META[normalizeCategory(category)];
    return t ? t(meta.labelKey) : meta.labelKey;
  }

  function getStorageLabel(valueOrItem, t) {
    const storageLocation = typeof valueOrItem === "string"
      ? normalizeStorageLocation(valueOrItem)
      : normalizeStorageLocation(valueOrItem.storageLocation);
    const customLocation = typeof valueOrItem === "string" ? "" : trimString(valueOrItem.customLocation);
    const meta = STORAGE_META[storageLocation];
    const label = t ? t(meta.labelKey) : meta.labelKey;
    return storageLocation === "other" && customLocation ? label + ": " + customLocation : label;
  }

  function getPlatformLabel(platform, t) {
    const normalized = normalizePlatform(platform);
    if (!normalized) {
      return "--";
    }
    return t ? t(PLATFORM_META[normalized].labelKey) : PLATFORM_META[normalized].labelKey;
  }

  function getSaleStatusLabel(status, t) {
    const normalized = normalizeSaleStatus(status);
    const keyMap = {
      draft: "statusDraft",
      listed: "statusListed",
      available: "statusAvailable",
      sold: "statusSold",
      archived: "statusArchived"
    };
    return t ? t(keyMap[normalized] || "statusListed") : normalized;
  }

  function getAvatarClass(category) {
    return CATEGORY_META[normalizeCategory(category)].avatarClass;
  }

  function getAgeInDays(item, nowDate) {
    const reference = nowDate || new Date();
    const date = new Date(item.dateAdded);
    const difference = reference.getTime() - date.getTime();
    return Math.max(0, Math.floor(difference / 86400000));
  }

  function getAgeBucket(item, nowDate) {
    const days = getAgeInDays(item, nowDate);
    if (days >= 90) {
      return { key: "90", days: days, labelKey: "ageAlert90" };
    }
    if (days >= 60) {
      return { key: "60", days: days, labelKey: "ageAlert60" };
    }
    if (days >= 30) {
      return { key: "30", days: days, labelKey: "ageAlert30" };
    }
    return { key: "new", days: days, labelKey: "ageNew" };
  }

  function getPotentialProfit(item) {
    if (item.listedPrice == null) {
      return 0;
    }
    return (item.listedPrice - item.cost) * item.quantity;
  }

  function getRealizedRevenue(item) {
    return item.salesHistory.reduce(function (sum, sale) {
      return sale.soldPrice == null ? sum : sum + sale.soldPrice * sale.quantity;
    }, 0);
  }

  function getRealizedProfit(item) {
    return item.salesHistory.reduce(function (sum, sale) {
      return sale.soldPrice == null ? sum : sum + (sale.soldPrice - item.cost) * sale.quantity;
    }, 0);
  }

  function getProfitMargin(item) {
    const revenue = getRealizedRevenue(item);
    return revenue > 0 ? getRealizedProfit(item) / revenue : null;
  }

  function getLatestSale(item) {
    if (!item.salesHistory.length) {
      return null;
    }
    return item.salesHistory[item.salesHistory.length - 1];
  }

  function buildSearchableText(item) {
    return [
      item.name,
      item.description,
      item.notes,
      item.itemId,
      item.originalBarcode,
      item.internalBarcode,
      item.source,
      item.customLocation,
      item.storageLocation,
      item.soldPlatform,
      item.saleStatus,
      item.category,
      item.condition
    ].join(" ").toLowerCase();
  }

  function matchesSearch(item, query) {
    const cleaned = trimString(query).toLowerCase();
    if (!cleaned) {
      return true;
    }
    const searchable = buildSearchableText(item);
    return cleaned.split(/\s+/).every(function (token) {
      return searchable.indexOf(token) >= 0;
    });
  }

  function getProfitForFilter(item) {
    if (item.salesHistory && item.salesHistory.length) {
      return getRealizedProfit(item);
    }
    return getPotentialProfit(item);
  }

  function matchesProfitRange(item, rangeKey) {
    if (!rangeKey || rangeKey === "all") {
      return true;
    }

    const profit = getProfitForFilter(item);
    if (rangeKey === "loss") {
      return profit < 0;
    }
    if (rangeKey === "0-25") {
      return profit >= 0 && profit <= 25;
    }
    if (rangeKey === "25-100") {
      return profit > 25 && profit <= 100;
    }
    if (rangeKey === "100-plus") {
      return profit > 100;
    }
    return true;
  }

  function matchesFilters(item, filters, nowDate) {
    const activeFilters = filters || {};

    if (activeFilters.category && activeFilters.category !== "all" && item.category !== activeFilters.category) {
      return false;
    }

    if (activeFilters.location && activeFilters.location !== "all" && item.storageLocation !== activeFilters.location) {
      return false;
    }

    if (activeFilters.saleStatus && activeFilters.saleStatus !== "all" && item.saleStatus !== activeFilters.saleStatus) {
      return false;
    }

    if (activeFilters.condition && activeFilters.condition !== "all" && item.condition !== activeFilters.condition) {
      return false;
    }

    if (!matchesProfitRange(item, activeFilters.profitRange)) {
      return false;
    }

    if (activeFilters.age && activeFilters.age !== "all") {
      if (item.saleStatus !== "available") {
        return false;
      }
      const bucket = getAgeBucket(item, nowDate).key;
      if (bucket !== activeFilters.age) {
        return false;
      }
    }

    return true;
  }

  function filterItems(items, options, nowDate) {
    const config = options || {};
    return (Array.isArray(items) ? items : []).filter(function (item) {
      return matchesSearch(item, config.query) && matchesFilters(item, config.filters, nowDate);
    });
  }

  function sortItems(items, sortKey, nowDate) {
    const sorted = (Array.isArray(items) ? items : []).slice();
    sorted.sort(function (left, right) {
      if (sortKey === "oldest") {
        return new Date(left.dateAdded) - new Date(right.dateAdded);
      }
      if (sortKey === "name") {
        return left.name.localeCompare(right.name);
      }
      if (sortKey === "listed-high") {
        return (right.listedPrice || 0) - (left.listedPrice || 0);
      }
      if (sortKey === "listed-low") {
        return (left.listedPrice || 0) - (right.listedPrice || 0);
      }
      if (sortKey === "profit-high") {
        return getPotentialProfit(right) - getPotentialProfit(left);
      }
      if (sortKey === "age-high") {
        return getAgeInDays(right, nowDate) - getAgeInDays(left, nowDate);
      }
      if (sortKey === "quantity-low") {
        return left.quantity - right.quantity;
      }
      if (sortKey === "status") {
        return left.saleStatus.localeCompare(right.saleStatus) || left.name.localeCompare(right.name);
      }
      return new Date(right.dateAdded) - new Date(left.dateAdded);
    });
    return sorted;
  }

  function getInitials(name) {
    return trimString(name).split(" ").filter(Boolean).slice(0, 2).map(function (part) {
      return part.charAt(0);
    }).join("").toUpperCase() || "PF";
  }

  function getAvailableItems(items) {
    return (Array.isArray(items) ? items : []).filter(function (item) {
      return item.saleStatus === "available" || item.saleStatus === "listed";
    });
  }

  function getAgingItems(items, minimumDays, nowDate) {
    return getAvailableItems(items).filter(function (item) {
      return getAgeInDays(item, nowDate) >= minimumDays;
    });
  }

  global.PalletFlowInventory = {
    CATEGORY_META: CATEGORY_META,
    STORAGE_META: STORAGE_META,
    PLATFORM_META: PLATFORM_META,
    CATEGORY_OPTIONS: CATEGORY_OPTIONS,
    STORAGE_OPTIONS: STORAGE_OPTIONS,
    PLATFORM_OPTIONS: PLATFORM_OPTIONS,
    SALE_STATUS_OPTIONS: SALE_STATUS_OPTIONS,
    uid: uid,
    trimString: trimString,
    toMoney: toMoney,
    toQuantity: toQuantity,
    toIsoDateTime: toIsoDateTime,
    toDateInputValue: toDateInputValue,
    normalizeCategory: normalizeCategory,
    normalizeStorageLocation: normalizeStorageLocation,
    normalizePlatform: normalizePlatform,
    normalizeSaleStatus: normalizeSaleStatus,
    normalizeItems: normalizeItems,
    generateNextItemId: generateNextItemId,
    buildMovement: buildMovement,
    buildSaleHistoryEntry: buildSaleHistoryEntry,
    createItem: createItem,
    updateItem: updateItem,
    recordSale: recordSale,
    recordRestock: recordRestock,
    getMainImage: getMainImage,
    normalizeImages: normalizeImages,
    getCategoryLabel: getCategoryLabel,
    getStorageLabel: getStorageLabel,
    getPlatformLabel: getPlatformLabel,
    getSaleStatusLabel: getSaleStatusLabel,
    getAvatarClass: getAvatarClass,
    getAgeInDays: getAgeInDays,
    getAgeBucket: getAgeBucket,
    getPotentialProfit: getPotentialProfit,
    getRealizedRevenue: getRealizedRevenue,
    getRealizedProfit: getRealizedProfit,
    getProfitMargin: getProfitMargin,
    getLatestSale: getLatestSale,
    getProfitForFilter: getProfitForFilter,
    matchesProfitRange: matchesProfitRange,
    matchesSearch: matchesSearch,
    matchesFilters: matchesFilters,
    filterItems: filterItems,
    sortItems: sortItems,
    getInitials: getInitials,
    getAvailableItems: getAvailableItems,
    getAgingItems: getAgingItems
  };
})(window);
