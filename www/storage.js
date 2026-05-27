(function (global) {
  const inventory = global.PalletFlowInventory;

  const ITEMS_KEY = "palletflow_items";
  const LANGUAGE_KEY = "palletflow_language";
  const SCANNER_ENDPOINT_KEY = "palletflow_scanner_endpoint";

  const seedItems = [
    {
      id: "seed-tv",
      itemId: "INV-20260416-0001",
      name: "Samsung 55\" TV",
      description: "Tested TV with remote included.",
      category: "electronics",
      cost: 110,
      listedPrice: 220,
      saleStatus: "available",
      dateAdded: "2026-04-16T13:20:00.000Z",
      storageLocation: "house",
      customLocation: "Garage shelf A",
      originalBarcode: "",
      itemImage: "",
      notes: "Great showroom piece for local pickup.",
      quantity: 1,
      soldQuantity: 0,
      source: "Target pallet 04/16"
    },
    {
      id: "seed-glass",
      itemId: "INV-20260318-0001",
      name: "Vintage Glass Set",
      description: "Complete vintage tumbler set in good condition.",
      category: "vintage",
      cost: 18,
      listedPrice: 55,
      saleStatus: "available",
      dateAdded: "2026-03-18T10:15:00.000Z",
      storageLocation: "storage",
      customLocation: "Storage rack B",
      originalBarcode: "",
      itemImage: "",
      notes: "Older than 30 days to demonstrate aging alerts.",
      quantity: 1,
      soldQuantity: 0,
      source: "Estate pallet"
    },
    {
      id: "seed-drill",
      itemId: "INV-20260211-0001",
      name: "DeWalt Drill Kit",
      description: "Open-box drill kit with charger and battery.",
      category: "tools",
      cost: 30,
      listedPrice: 75,
      saleStatus: "available",
      dateAdded: "2026-02-11T09:45:00.000Z",
      storageLocation: "car-1",
      customLocation: "",
      originalBarcode: "",
      itemImage: "",
      notes: "Older than 60 days and stored in the car.",
      quantity: 2,
      soldQuantity: 0,
      source: "Home Depot pallet"
    },
    {
      id: "seed-lego",
      itemId: "INV-20260105-0001",
      name: "LEGO Mixed Bundle",
      description: "Bulk LEGO bag sorted by color and theme.",
      category: "toys",
      cost: 20,
      listedPrice: 49,
      saleStatus: "available",
      dateAdded: "2026-01-05T11:10:00.000Z",
      storageLocation: "car-2",
      customLocation: "",
      originalBarcode: "",
      itemImage: "",
      notes: "Older than 90 days and should surface in alerts.",
      quantity: 1,
      soldQuantity: 0,
      source: "Liquidation box"
    },
    {
      id: "seed-hoodie",
      itemId: "INV-20260220-0001",
      name: "Nike Hoodie",
      description: "Men's medium hoodie sold through local marketplace.",
      category: "clothing",
      cost: 12,
      listedPrice: 35,
      saleStatus: "sold",
      dateAdded: "2026-02-20T16:00:00.000Z",
      dateSold: "2026-04-25T14:10:00.000Z",
      soldPrice: 30,
      soldPlatform: "facebook",
      storageLocation: "house",
      customLocation: "Hall closet",
      originalBarcode: "",
      itemImage: "",
      notes: "Sold after a small price drop.",
      quantity: 1,
      salesHistory: [
        {
          id: "sale-hoodie-1",
          quantity: 1,
          soldPrice: 30,
          dateSold: "2026-04-25T14:10:00.000Z",
          soldPlatform: "facebook",
          note: "Sold via Marketplace.",
          costPerUnit: 12
        }
      ],
      source: "Clothing pallet"
    },
    {
      id: "seed-mixer",
      itemId: "INV-20260128-0001",
      name: "KitchenAid Mixer",
      description: "Working stand mixer sold online.",
      category: "home",
      cost: 90,
      listedPrice: 180,
      saleStatus: "sold",
      dateAdded: "2026-01-28T15:45:00.000Z",
      dateSold: "2026-04-01T12:30:00.000Z",
      soldPrice: 165,
      soldPlatform: "ebay",
      storageLocation: "storage",
      customLocation: "Storage shelf C",
      originalBarcode: "",
      itemImage: "",
      notes: "Strong profit example for analytics.",
      quantity: 1,
      salesHistory: [
        {
          id: "sale-mixer-1",
          quantity: 1,
          soldPrice: 165,
          dateSold: "2026-04-01T12:30:00.000Z",
          soldPlatform: "ebay",
          note: "Shipped via eBay.",
          costPerUnit: 90
        }
      ],
      source: "Kitchen pallet"
    },
    {
      id: "seed-table",
      itemId: "INV-20260302-0001",
      name: "Mid-Century Side Table",
      description: "Solid wood side table cleaned and ready to list.",
      category: "furniture",
      cost: 40,
      listedPrice: 110,
      saleStatus: "available",
      dateAdded: "2026-03-02T18:00:00.000Z",
      storageLocation: "other",
      customLocation: "Warehouse loft corner",
      originalBarcode: "",
      itemImage: "",
      notes: "Custom location demo item.",
      quantity: 1,
      soldQuantity: 0,
      source: "Estate pickup"
    }
  ];

  const memoryStore = {};
  const memoryPreferredKeys = {};

  function getStorage() {
    try {
      if (global.localStorage) {
        return global.localStorage;
      }
    } catch (error) {
      // Accessing localStorage itself can fail in locked-down browsers.
    }

    try {
      if (typeof localStorage !== "undefined") {
        return localStorage;
      }
    } catch (error) {
      // Ignore and use the in-memory fallback.
    }

    return null;
  }

  function safeGetItem(key) {
    const hasMemoryValue = Object.prototype.hasOwnProperty.call(memoryStore, key);

    if (memoryPreferredKeys[key]) {
      return hasMemoryValue ? memoryStore[key] : null;
    }

    const storage = getStorage();

    if (storage) {
      try {
        const value = storage.getItem(key);
        if (value !== null && typeof value !== "undefined") {
          return value;
        }
      } catch (error) {
        // Fall through to memoryStore.
      }
    }

    return hasMemoryValue ? memoryStore[key] : null;
  }

  function safeSetItem(key, value) {
    const next = String(value);
    memoryStore[key] = next;

    const storage = getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(key, next);
      delete memoryPreferredKeys[key];
    } catch (error) {
      // Keep the in-memory copy as a recoverable fallback.
      memoryPreferredKeys[key] = true;
    }
  }

  function safeRemoveItem(key) {
    delete memoryStore[key];

    const storage = getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.removeItem(key);
      delete memoryPreferredKeys[key];
    } catch (error) {
      // Memory fallback has already removed the value.
      memoryPreferredKeys[key] = true;
    }
  }

  function saveItems(items) {
    const normalized = inventory.normalizeItems(items);
    safeSetItem(ITEMS_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function loadItems() {
    const raw = safeGetItem(ITEMS_KEY);

    if (!raw) {
      return saveItems(seedItems);
    }

    try {
      const parsed = JSON.parse(raw);
      return saveItems(Array.isArray(parsed) ? parsed : seedItems);
    } catch (error) {
      return saveItems(seedItems);
    }
  }

  function resetItems() {
    return saveItems(seedItems);
  }

  function getLanguage() {
    const stored = safeGetItem(LANGUAGE_KEY);
    return stored === "es" ? "es" : "en";
  }

  function saveLanguage(language) {
    const next = language === "es" ? "es" : "en";
    safeSetItem(LANGUAGE_KEY, next);
    return next;
  }

  function getScannerEndpoint() {
    return String(safeGetItem(SCANNER_ENDPOINT_KEY) || "").trim();
  }

  function saveScannerEndpoint(endpoint) {
    const next = String(endpoint || "").trim();
    if (next) {
      safeSetItem(SCANNER_ENDPOINT_KEY, next);
    } else {
      safeRemoveItem(SCANNER_ENDPOINT_KEY);
    }
    return next;
  }

  global.PalletFlowStorage = {
    ITEMS_KEY: ITEMS_KEY,
    LANGUAGE_KEY: LANGUAGE_KEY,
    SCANNER_ENDPOINT_KEY: SCANNER_ENDPOINT_KEY,
    seedItems: seedItems,
    loadItems: loadItems,
    saveItems: saveItems,
    resetItems: resetItems,
    getLanguage: getLanguage,
    saveLanguage: saveLanguage,
    getScannerEndpoint: getScannerEndpoint,
    saveScannerEndpoint: saveScannerEndpoint
  };
})(window);
