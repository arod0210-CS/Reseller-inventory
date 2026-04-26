document.addEventListener("DOMContentLoaded", function () {
  const i18nFactory = window.PalletFlowI18n;
  const inventory = window.PalletFlowInventory;
  const storage = window.PalletFlowStorage;
  const finance = window.PalletFlowFinance;
  const analytics = window.PalletFlowAnalytics;
  const scanner = window.PalletFlowScanner;
  const labels = window.PalletFlowLabels;

  const i18n = i18nFactory.createI18n(storage.getLanguage());
  let items = storage.loadItems();

  const state = {
    activeTab: "home",
    homeSearch: "",
    inventorySearch: "",
    inventorySort: "newest",
    inventoryFilters: {
      category: "all",
      location: "all",
      saleStatus: "all",
      age: "all"
    },
    financeRange: "today",
    analyticsChart: "sales-platform",
    itemSheetContext: "add",
    sheetMode: "quick",
    editingItemId: null,
    detailItemId: null,
    labelItemId: null,
    transaction: {
      type: null,
      itemId: null
    }
  };

  let itemSheetImageData = "";
  let scannerImageData = "";
  let itemSheetSnapshot = "";
  let transactionSnapshot = "";
  let scannerToastMessage = "";
  let toastElement = null;

  const refs = {
    loginScreen: document.getElementById("loginScreen"),
    dashboardScreen: document.getElementById("dashboardScreen"),
    loginBtn: document.getElementById("loginBtn"),
    menuBtn: document.getElementById("menuBtn"),
    alertsBtn: document.getElementById("alertsBtn"),
    homeSearchInput: document.getElementById("homeSearchInput"),
    homeRecentList: document.getElementById("homeRecentList"),
    homeAttentionList: document.getElementById("homeAttentionList"),
    homeStatAvailable: document.getElementById("homeStatAvailable"),
    homeStatRevenue: document.getElementById("homeStatRevenue"),
    homeStatProfit: document.getElementById("homeStatProfit"),
    homeStatAge90: document.getElementById("homeStatAge90"),
    homeAge30: document.getElementById("homeAge30"),
    homeAge60: document.getElementById("homeAge60"),
    homeInventoryValue: document.getElementById("homeInventoryValue"),
    homeAddBtn: document.getElementById("homeAddBtn"),
    homeScannerBtn: document.getElementById("homeScannerBtn"),
    inventoryAddBtn: document.getElementById("inventoryAddBtn"),
    inventorySearchInput: document.getElementById("inventorySearchInput"),
    inventorySortSelect: document.getElementById("inventorySortSelect"),
    inventoryAvailableCount: document.getElementById("inventoryAvailableCount"),
    inventorySoldCount: document.getElementById("inventorySoldCount"),
    inventoryLocationCount: document.getElementById("inventoryLocationCount"),
    inventoryFilterSummary: document.getElementById("inventoryFilterSummary"),
    inventoryList: document.getElementById("inventoryList"),
    openFilterBtn: document.getElementById("openFilterBtn"),
    analyticsChartSelect: document.getElementById("analyticsChartSelect"),
    analyticsRevenue: document.getElementById("analyticsRevenue"),
    analyticsCost: document.getElementById("analyticsCost"),
    analyticsProfit: document.getElementById("analyticsProfit"),
    analyticsAverageProfit: document.getElementById("analyticsAverageProfit"),
    analyticsChart: document.getElementById("analyticsChart"),
    analyticsLegend: document.getElementById("analyticsLegend"),
    analyticsChartEmpty: document.getElementById("analyticsChartEmpty"),
    earningsGrid: document.getElementById("earningsGrid"),
    analyticsBestPlatform: document.getElementById("analyticsBestPlatform"),
    analyticsBestCategory: document.getElementById("analyticsBestCategory"),
    analyticsUnsoldValue: document.getElementById("analyticsUnsoldValue"),
    analyticsSoldValue: document.getElementById("analyticsSoldValue"),
    financeRangeRow: document.getElementById("financeRangeRow"),
    financeRevenue: document.getElementById("financeRevenue"),
    financeCost: document.getElementById("financeCost"),
    financeProfit: document.getElementById("financeProfit"),
    financeSoldItems: document.getElementById("financeSoldItems"),
    financeAverageSale: document.getElementById("financeAverageSale"),
    financeAverageProfit: document.getElementById("financeAverageProfit"),
    financeBestPlatform: document.getElementById("financeBestPlatform"),
    financeBestCategory: document.getElementById("financeBestCategory"),
    financeMissingPrice: document.getElementById("financeMissingPrice"),
    financeSalesList: document.getElementById("financeSalesList"),
    profileCurrentListings: document.getElementById("profileCurrentListings"),
    profileSoldHistory: document.getElementById("profileSoldHistory"),
    profilePotentialProfit: document.getElementById("profilePotentialProfit"),
    profileTotalCost: document.getElementById("profileTotalCost"),
    profileTotalRevenue: document.getElementById("profileTotalRevenue"),
    profileTotalProfit: document.getElementById("profileTotalProfit"),
    profileLanguageValue: document.getElementById("profileLanguageValue"),
    profileLastUpdated: document.getElementById("profileLastUpdated"),
    profileCategories: document.getElementById("profileCategories"),
    profileAddBtn: document.getElementById("profileAddBtn"),
    profileScannerBtn: document.getElementById("profileScannerBtn"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
    resetDemoBtn: document.getElementById("resetDemoBtn"),
    menuBackdrop: document.getElementById("menuBackdrop"),
    closeMenuBtn: document.getElementById("closeMenuBtn"),
    menuScannerBtn: document.getElementById("menuScannerBtn"),
    menuExportBtn: document.getElementById("menuExportBtn"),
    menuLanguageCurrent: document.getElementById("menuLanguageCurrent"),
    languageEnBtn: document.getElementById("languageEnBtn"),
    languageEsBtn: document.getElementById("languageEsBtn"),
    alertsBackdrop: document.getElementById("alertsBackdrop"),
    closeAlertsBtn: document.getElementById("closeAlertsBtn"),
    alertsList: document.getElementById("alertsList"),
    filterBackdrop: document.getElementById("filterBackdrop"),
    closeFilterBtn: document.getElementById("closeFilterBtn"),
    filterCategorySelect: document.getElementById("filterCategorySelect"),
    filterLocationSelect: document.getElementById("filterLocationSelect"),
    filterStatusSelect: document.getElementById("filterStatusSelect"),
    filterAgeSelect: document.getElementById("filterAgeSelect"),
    clearFilterBtn: document.getElementById("clearFilterBtn"),
    applyFilterBtn: document.getElementById("applyFilterBtn"),
    sheetBackdrop: document.getElementById("sheetBackdrop"),
    openSheetBtn: document.getElementById("openSheetBtn"),
    closeSheetBtn: document.getElementById("closeSheetBtn"),
    itemSheetTitle: document.getElementById("itemSheetTitle"),
    itemSheetSubtitle: document.getElementById("itemSheetSubtitle"),
    modeSwitch: document.getElementById("modeSwitch"),
    quickMode: document.getElementById("quickMode"),
    fullMode: document.getElementById("fullMode"),
    quickName: document.getElementById("quickName"),
    quickCategory: document.getElementById("quickCategory"),
    quickQuantity: document.getElementById("quickQuantity"),
    quickCost: document.getElementById("quickCost"),
    quickListedPrice: document.getElementById("quickListedPrice"),
    quickStorage: document.getElementById("quickStorage"),
    quickCustomLocationWrap: document.getElementById("quickCustomLocationWrap"),
    quickCustomLocation: document.getElementById("quickCustomLocation"),
    quickScannerBtn: document.getElementById("quickScannerBtn"),
    saveQuickBtn: document.getElementById("saveQuickBtn"),
    fullName: document.getElementById("fullName"),
    fullDescription: document.getElementById("fullDescription"),
    fullCategory: document.getElementById("fullCategory"),
    fullSource: document.getElementById("fullSource"),
    fullCost: document.getElementById("fullCost"),
    fullListedPrice: document.getElementById("fullListedPrice"),
    fullQuantity: document.getElementById("fullQuantity"),
    fullDateAdded: document.getElementById("fullDateAdded"),
    fullStorage: document.getElementById("fullStorage"),
    fullCustomLocationWrap: document.getElementById("fullCustomLocationWrap"),
    fullCustomLocation: document.getElementById("fullCustomLocation"),
    fullBarcode: document.getElementById("fullBarcode"),
    fullImageInput: document.getElementById("fullImageInput"),
    fullImagePreviewWrap: document.getElementById("fullImagePreviewWrap"),
    fullImagePreview: document.getElementById("fullImagePreview"),
    fullSaleStatus: document.getElementById("fullSaleStatus"),
    fullSoldFields: document.getElementById("fullSoldFields"),
    fullSoldPrice: document.getElementById("fullSoldPrice"),
    fullDateSold: document.getElementById("fullDateSold"),
    fullSoldPlatform: document.getElementById("fullSoldPlatform"),
    fullNotes: document.getElementById("fullNotes"),
    fullScannerBtn: document.getElementById("fullScannerBtn"),
    saveFullBtn: document.getElementById("saveFullBtn"),
    detailBackdrop: document.getElementById("detailBackdrop"),
    closeDetailBtn: document.getElementById("closeDetailBtn"),
    detailCloseBtn: document.getElementById("detailCloseBtn"),
    detailSubtitle: document.getElementById("detailSubtitle"),
    detailAvatar: document.getElementById("detailAvatar"),
    detailImageWrap: document.getElementById("detailImageWrap"),
    detailImage: document.getElementById("detailImage"),
    detailName: document.getElementById("detailName"),
    detailMeta: document.getElementById("detailMeta"),
    detailStatusPill: document.getElementById("detailStatusPill"),
    detailAgePill: document.getElementById("detailAgePill"),
    detailFieldGrid: document.getElementById("detailFieldGrid"),
    detailHistoryList: document.getElementById("detailHistoryList"),
    detailEditBtn: document.getElementById("detailEditBtn"),
    detailSellBtn: document.getElementById("detailSellBtn"),
    detailRestockBtn: document.getElementById("detailRestockBtn"),
    detailLabelBtn: document.getElementById("detailLabelBtn"),
    detailDeleteBtn: document.getElementById("detailDeleteBtn"),
    transactionBackdrop: document.getElementById("transactionBackdrop"),
    closeTransactionBtn: document.getElementById("closeTransactionBtn"),
    transactionTitle: document.getElementById("transactionTitle"),
    transactionSubtitle: document.getElementById("transactionSubtitle"),
    transactionQuantity: document.getElementById("transactionQuantity"),
    transactionSaleFields: document.getElementById("transactionSaleFields"),
    transactionSoldPrice: document.getElementById("transactionSoldPrice"),
    transactionDateSold: document.getElementById("transactionDateSold"),
    transactionSoldPlatform: document.getElementById("transactionSoldPlatform"),
    transactionNote: document.getElementById("transactionNote"),
    transactionSubmitBtn: document.getElementById("transactionSubmitBtn"),
    scannerBackdrop: document.getElementById("scannerBackdrop"),
    closeScannerBtn: document.getElementById("closeScannerBtn"),
    scannerBarcodeInput: document.getElementById("scannerBarcodeInput"),
    scannerPhotoInput: document.getElementById("scannerPhotoInput"),
    scannerPhotoPreviewWrap: document.getElementById("scannerPhotoPreviewWrap"),
    scannerPhotoPreview: document.getElementById("scannerPhotoPreview"),
    scannerName: document.getElementById("scannerName"),
    scannerDescription: document.getElementById("scannerDescription"),
    scannerCategory: document.getElementById("scannerCategory"),
    scannerPrice: document.getElementById("scannerPrice"),
    scannerTryBtn: document.getElementById("scannerTryBtn"),
    scannerUseBtn: document.getElementById("scannerUseBtn"),
    labelBackdrop: document.getElementById("labelBackdrop"),
    closeLabelBtn: document.getElementById("closeLabelBtn"),
    labelPreview: document.getElementById("labelPreview"),
    printLabelBtn: document.getElementById("printLabelBtn"),
    downloadLabelBtn: document.getElementById("downloadLabelBtn"),
    copyItemIdBtn: document.getElementById("copyItemIdBtn")
  };

  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const tabViews = Array.from(document.querySelectorAll(".tab-screen"));
  const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));
  const languageButtons = Array.from(document.querySelectorAll(".language-chip"));

  function t(key, variables) {
    return i18n.t(key, variables);
  }

  function currency(value) {
    return i18n.formatCurrency(value);
  }

  function number(value) {
    return i18n.formatNumber(value);
  }

  function percent(value) {
    return i18n.formatPercent(value);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureToast() {
    if (!toastElement) {
      toastElement = document.createElement("div");
      toastElement.className = "toast";
      refs.dashboardScreen.appendChild(toastElement);
    }
    return toastElement;
  }

  function showToast(message) {
    const toast = ensureToast();
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }

  function isDashboardVisible() {
    return refs.dashboardScreen.classList.contains("active");
  }

  function getItemById(itemId) {
    return items.find(function (item) {
      return item.id === itemId;
    }) || null;
  }

  function replaceItem(updatedItem) {
    return items.map(function (item) {
      return item.id === updatedItem.id ? updatedItem : item;
    });
  }

  function saveItems(nextItems) {
    items = storage.saveItems(nextItems);
    return items;
  }

  function getLatestUpdateValue() {
    return items.map(function (item) {
      return item.lastUpdated || item.dateAdded;
    }).sort().pop();
  }

  function getDisplayLocation(item) {
    return inventory.getStorageLabel(item, t);
  }

  function getDisplayPlatform(item) {
    return inventory.getPlatformLabel(item.soldPlatform, t);
  }

  function getItemAgeLabel(item) {
    const bucket = inventory.getAgeBucket(item, new Date());
    return {
      key: bucket.key,
      text: t(bucket.labelKey),
      days: bucket.days
    };
  }

  function getMarginForDisplay(item) {
    if (item.salesHistory.length) {
      return inventory.getProfitMargin(item);
    }
    if (item.listedPrice && item.listedPrice > 0) {
      return (item.listedPrice - item.cost) / item.listedPrice;
    }
    return null;
  }

  function renderEmptyState(target, key) {
    target.innerHTML = "<div class=\"empty-state\">" + escapeHtml(t(key)) + "</div>";
  }

  function setActiveTab(tab) {
    state.activeTab = tab;
    navItems.forEach(function (item) {
      const isActive = item.getAttribute("data-tab") === tab;
      item.classList.toggle("active", isActive);
    });
    tabViews.forEach(function (view) {
      view.classList.toggle("active", view.getAttribute("data-tab-view") === tab);
    });
  }

  function setSheetMode(mode) {
    state.sheetMode = mode;
    modeButtons.forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-mode") === mode);
    });
    refs.quickMode.classList.toggle("hidden", mode !== "quick");
    refs.fullMode.classList.toggle("hidden", mode !== "full");
  }

  function toggleQuickCustomLocation() {
    refs.quickCustomLocationWrap.classList.toggle("hidden", refs.quickStorage.value !== "other");
  }

  function toggleFullCustomLocation() {
    refs.fullCustomLocationWrap.classList.toggle("hidden", refs.fullStorage.value !== "other");
  }

  function toggleSoldFields() {
    refs.fullSoldFields.classList.toggle("hidden", refs.fullSaleStatus.value !== "sold");
  }

  function updateImagePreview(wrapper, image, dataUrl) {
    if (dataUrl) {
      wrapper.classList.remove("hidden");
      image.src = dataUrl;
    } else {
      wrapper.classList.add("hidden");
      image.removeAttribute("src");
    }
  }

  function resetQuickForm() {
    refs.quickName.value = "";
    refs.quickCategory.value = "electronics";
    refs.quickQuantity.value = "1";
    refs.quickCost.value = "";
    refs.quickListedPrice.value = "";
    refs.quickStorage.value = "";
    refs.quickCustomLocation.value = "";
    toggleQuickCustomLocation();
  }

  function resetFullForm() {
    refs.fullName.value = "";
    refs.fullDescription.value = "";
    refs.fullCategory.value = "electronics";
    refs.fullSource.value = "";
    refs.fullCost.value = "";
    refs.fullListedPrice.value = "";
    refs.fullQuantity.value = "1";
    refs.fullDateAdded.value = i18n.formatDateInput(new Date().toISOString());
    refs.fullStorage.value = "";
    refs.fullCustomLocation.value = "";
    refs.fullBarcode.value = "";
    refs.fullSaleStatus.value = "available";
    refs.fullSoldPrice.value = "";
    refs.fullDateSold.value = i18n.formatDateInput(new Date().toISOString());
    refs.fullSoldPlatform.value = "";
    refs.fullNotes.value = "";
    itemSheetImageData = "";
    updateImagePreview(refs.fullImagePreviewWrap, refs.fullImagePreview, itemSheetImageData);
    toggleFullCustomLocation();
    toggleSoldFields();
  }

  function populateFullForm(item) {
    refs.fullName.value = item.name;
    refs.fullDescription.value = item.description;
    refs.fullCategory.value = item.category;
    refs.fullSource.value = item.source || "";
    refs.fullCost.value = item.cost;
    refs.fullListedPrice.value = item.listedPrice == null ? "" : item.listedPrice;
    refs.fullQuantity.value = item.saleStatus === "sold" ? Math.max(item.soldQuantity, 1) : item.quantity;
    refs.fullDateAdded.value = i18n.formatDateInput(item.dateAdded);
    refs.fullStorage.value = item.storageLocation === "unknown" ? "" : item.storageLocation;
    refs.fullCustomLocation.value = item.customLocation || "";
    refs.fullBarcode.value = item.originalBarcode || "";
    refs.fullSaleStatus.value = item.saleStatus;
    refs.fullSoldPrice.value = item.soldPrice == null ? "" : item.soldPrice;
    refs.fullDateSold.value = item.dateSold ? i18n.formatDateInput(item.dateSold) : i18n.formatDateInput(new Date().toISOString());
    refs.fullSoldPlatform.value = item.soldPlatform || "";
    refs.fullNotes.value = item.notes || "";
    itemSheetImageData = item.itemImage || "";
    updateImagePreview(refs.fullImagePreviewWrap, refs.fullImagePreview, itemSheetImageData);
    toggleFullCustomLocation();
    toggleSoldFields();
  }

  function getItemSheetState() {
    return JSON.stringify({
      context: state.itemSheetContext,
      mode: state.sheetMode,
      editingItemId: state.editingItemId,
      image: itemSheetImageData,
      quickName: refs.quickName.value,
      quickCategory: refs.quickCategory.value,
      quickQuantity: refs.quickQuantity.value,
      quickCost: refs.quickCost.value,
      quickListedPrice: refs.quickListedPrice.value,
      quickStorage: refs.quickStorage.value,
      quickCustomLocation: refs.quickCustomLocation.value,
      fullName: refs.fullName.value,
      fullDescription: refs.fullDescription.value,
      fullCategory: refs.fullCategory.value,
      fullSource: refs.fullSource.value,
      fullCost: refs.fullCost.value,
      fullListedPrice: refs.fullListedPrice.value,
      fullQuantity: refs.fullQuantity.value,
      fullDateAdded: refs.fullDateAdded.value,
      fullStorage: refs.fullStorage.value,
      fullCustomLocation: refs.fullCustomLocation.value,
      fullBarcode: refs.fullBarcode.value,
      fullSaleStatus: refs.fullSaleStatus.value,
      fullSoldPrice: refs.fullSoldPrice.value,
      fullDateSold: refs.fullDateSold.value,
      fullSoldPlatform: refs.fullSoldPlatform.value,
      fullNotes: refs.fullNotes.value
    });
  }

  function captureItemSheetSnapshot() {
    itemSheetSnapshot = getItemSheetState();
  }

  function isItemSheetDirty() {
    return refs.sheetBackdrop.classList.contains("show") && itemSheetSnapshot !== getItemSheetState();
  }

  function getTransactionState() {
    return JSON.stringify({
      type: state.transaction.type,
      itemId: state.transaction.itemId,
      quantity: refs.transactionQuantity.value,
      soldPrice: refs.transactionSoldPrice.value,
      dateSold: refs.transactionDateSold.value,
      soldPlatform: refs.transactionSoldPlatform.value,
      note: refs.transactionNote.value
    });
  }

  function captureTransactionSnapshot() {
    transactionSnapshot = getTransactionState();
  }

  function isTransactionDirty() {
    return refs.transactionBackdrop.classList.contains("show") && transactionSnapshot !== getTransactionState();
  }

  function closeMenu() {
    refs.menuBackdrop.classList.remove("show");
  }

  function openMenu() {
    refs.menuBackdrop.classList.add("show");
  }

  function closeAlerts() {
    refs.alertsBackdrop.classList.remove("show");
  }

  function openAlerts() {
    refs.alertsBackdrop.classList.add("show");
    renderAlerts();
  }

  function openFilters() {
    refs.filterCategorySelect.value = state.inventoryFilters.category;
    refs.filterLocationSelect.value = state.inventoryFilters.location;
    refs.filterStatusSelect.value = state.inventoryFilters.saleStatus;
    refs.filterAgeSelect.value = state.inventoryFilters.age;
    refs.filterBackdrop.classList.add("show");
  }

  function closeFilters() {
    refs.filterBackdrop.classList.remove("show");
  }

  function openItemSheet(preferredMode) {
    state.itemSheetContext = "add";
    state.editingItemId = null;
    refs.modeSwitch.classList.remove("hidden");
    refs.itemSheetTitle.textContent = t("itemSheetAddTitle");
    refs.itemSheetSubtitle.textContent = t("itemSheetAddSubtitle");
    refs.saveFullBtn.textContent = t("fullSave");
    resetQuickForm();
    resetFullForm();
    setSheetMode(preferredMode || "quick");
    refs.sheetBackdrop.classList.add("show");
    captureItemSheetSnapshot();
  }

  function openEditSheet(itemId) {
    const item = getItemById(itemId);
    if (!item) {
      return;
    }

    state.itemSheetContext = "edit";
    state.editingItemId = item.id;
    refs.modeSwitch.classList.add("hidden");
    refs.itemSheetTitle.textContent = t("itemSheetEditTitle");
    refs.itemSheetSubtitle.textContent = t("itemSheetEditSubtitle");
    refs.saveFullBtn.textContent = t("fullUpdate");
    populateFullForm(item);
    setSheetMode("full");
    refs.sheetBackdrop.classList.add("show");
    captureItemSheetSnapshot();
  }

  function closeItemSheet(force) {
    if (!force && isItemSheetDirty() && !window.confirm(t("discardChanges"))) {
      return;
    }

    refs.sheetBackdrop.classList.remove("show");
    state.itemSheetContext = "add";
    state.editingItemId = null;
    refs.modeSwitch.classList.remove("hidden");
    captureItemSheetSnapshot();
  }

  function openDetail(itemId) {
    state.detailItemId = itemId;
    renderDetail();
    refs.detailBackdrop.classList.add("show");
  }

  function closeDetail() {
    refs.detailBackdrop.classList.remove("show");
    state.detailItemId = null;
  }

  function openTransaction(type, itemId) {
    const item = getItemById(itemId);
    if (!item) {
      return;
    }

    state.transaction.type = type;
    state.transaction.itemId = item.id;
    refs.transactionQuantity.value = "1";
    refs.transactionNote.value = "";
    refs.transactionSoldPrice.value = item.listedPrice == null ? "" : item.listedPrice;
    refs.transactionDateSold.value = i18n.formatDateInput(new Date().toISOString());
    refs.transactionSoldPlatform.value = "";

    if (type === "sell") {
      refs.transactionTitle.textContent = t("transactionSellTitle");
      refs.transactionSubtitle.textContent = t("transactionSellSubtitle");
      refs.transactionSubmitBtn.textContent = t("transactionSaveSale");
      refs.transactionSaleFields.classList.remove("hidden");
      refs.transactionQuantity.max = String(Math.max(item.quantity, 1));
    } else {
      refs.transactionTitle.textContent = t("transactionRestockTitle");
      refs.transactionSubtitle.textContent = t("transactionRestockSubtitle");
      refs.transactionSubmitBtn.textContent = t("transactionSaveRestock");
      refs.transactionSaleFields.classList.add("hidden");
      refs.transactionQuantity.removeAttribute("max");
    }

    refs.transactionBackdrop.classList.add("show");
    captureTransactionSnapshot();
  }

  function closeTransaction(force) {
    if (!force && isTransactionDirty() && !window.confirm(t("discardTransaction"))) {
      return;
    }
    refs.transactionBackdrop.classList.remove("show");
    state.transaction.type = null;
    state.transaction.itemId = null;
    captureTransactionSnapshot();
  }

  function resetScannerForm() {
    refs.scannerBarcodeInput.value = "";
    refs.scannerName.value = "";
    refs.scannerDescription.value = "";
    refs.scannerCategory.value = "electronics";
    refs.scannerPrice.value = "";
    refs.scannerPhotoInput.value = "";
    scannerImageData = "";
    updateImagePreview(refs.scannerPhotoPreviewWrap, refs.scannerPhotoPreview, scannerImageData);
  }

  function openScanner() {
    refs.scannerBackdrop.classList.add("show");
  }

  function closeScanner() {
    refs.scannerBackdrop.classList.remove("show");
  }

  function openLabel(itemId) {
    state.labelItemId = itemId;
    renderLabelPreview();
    refs.labelBackdrop.classList.add("show");
  }

  function closeLabel() {
    refs.labelBackdrop.classList.remove("show");
    state.labelItemId = null;
  }

  function applyNavTranslations() {
    const map = {
      home: i18n.getLanguage() === "es" ? "Inicio" : "Home",
      inventory: t("inventoryTitle"),
      analytics: t("analyticsTitle"),
      finance: t("financeTitle"),
      profile: t("profileTitle")
    };

    navItems.forEach(function (item) {
      const label = item.querySelector(".nav-label");
      const key = item.getAttribute("data-tab");
      if (label && map[key]) {
        label.textContent = map[key];
      }
    });
  }

  function applyStaticHelpers() {
    document.documentElement.lang = i18n.getLanguage();
    document.title = t("appTitle");
    i18n.apply(document);
    applyNavTranslations();
    const activeLanguage = i18n.getLanguage() === "es" ? t("spanish") : t("english");
    refs.profileLanguageValue.textContent = activeLanguage;
    refs.menuLanguageCurrent.textContent = t("menuLanguageCurrent") + ": " + activeLanguage;
    languageButtons.forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-language") === i18n.getLanguage());
    });
  }

  function renderSummaryFilterChips() {
    const chips = [];

    if (state.inventoryFilters.category !== "all") {
      chips.push(inventory.getCategoryLabel(state.inventoryFilters.category, t));
    }
    if (state.inventoryFilters.location !== "all") {
      chips.push(inventory.getStorageLabel(state.inventoryFilters.location, t));
    }
    if (state.inventoryFilters.saleStatus !== "all") {
      chips.push(inventory.getSaleStatusLabel(state.inventoryFilters.saleStatus, t));
    }
    if (state.inventoryFilters.age !== "all") {
      const ageLabels = {
        "new": t("filterAgingNew"),
        "30": t("filterAging30"),
        "60": t("filterAging60"),
        "90": t("filterAging90")
      };
      chips.push(ageLabels[state.inventoryFilters.age]);
    }
    if (state.inventorySearch) {
      chips.push(state.inventorySearch);
    }

    if (!chips.length) {
      refs.inventoryFilterSummary.innerHTML = "<div class=\"filter-chip\">" + escapeHtml(t("filterAll")) + "</div>";
      return;
    }

    refs.inventoryFilterSummary.innerHTML = chips.map(function (chip) {
      return "<div class=\"filter-chip\">" + escapeHtml(chip) + "</div>";
    }).join("");
  }

  function buildAgeBadgeHtml(item) {
    const age = getItemAgeLabel(item);
    const className = age.key === "30" ? "is-alert-30" : age.key === "60" ? "is-alert-60" : age.key === "90" ? "is-alert-90" : "";
    return "<span class=\"age-badge " + className + "\">" + escapeHtml(age.text) + "</span>";
  }

  function buildStatusHtml(item) {
    return "<span class=\"status " + item.saleStatus + "\">" + escapeHtml(inventory.getSaleStatusLabel(item.saleStatus, t)) + "</span>";
  }

  function buildItemCard(item) {
    return [
      "<button class=\"item-card action-open-item\" type=\"button\" data-item-id=\"" + escapeHtml(item.id) + "\">",
      "<div class=\"avatar " + escapeHtml(inventory.getAvatarClass(item.category)) + "\">" + escapeHtml(inventory.getInitials(item.name)) + "</div>",
      "<div class=\"item-copy\">",
      "<div class=\"item-name\">" + escapeHtml(item.name) + "</div>",
      "<div class=\"item-meta\">" + escapeHtml(inventory.getCategoryLabel(item.category, t)) + " · " + escapeHtml(item.itemId) + "</div>",
      "<div class=\"item-submeta\">" + escapeHtml(getDisplayLocation(item)) + "</div>",
      buildStatusHtml(item),
      "</div>",
      "<div class=\"item-side\">",
      "<div class=\"item-price\">" + escapeHtml(currency(item.listedPrice || 0)) + "</div>",
      "<div class=\"item-qty\">" + escapeHtml(t("quantityRemaining")) + ": " + escapeHtml(number(item.quantity)) + "</div>",
      "<div class=\"item-profit\">" + escapeHtml(buildAgeLabelText(item)) + "</div>",
      "</div>",
      "</button>"
    ].join("");
  }

  function buildAgeLabelText(item) {
    const age = inventory.getAgeInDays(item, new Date());
    return age + " " + t("dayLabel");
  }

  function buildAttentionCard(item) {
    return [
      "<button class=\"alert-item action-open-item\" type=\"button\" data-item-id=\"" + escapeHtml(item.id) + "\">",
      "<div class=\"alert-item-title\">" + escapeHtml(item.name) + "</div>",
      "<div class=\"alert-item-meta\">" + escapeHtml(getItemAgeLabel(item).text) + " · " + escapeHtml(buildAgeLabelText(item)) + "</div>",
      "<div class=\"alert-item-submeta\">" + escapeHtml(getDisplayLocation(item)) + "</div>",
      "</button>"
    ].join("");
  }

  function buildInventoryCard(item) {
    const latestSale = inventory.getLatestSale(item);
    return [
      "<div class=\"inventory-card\">",
      "<button class=\"inventory-card-main action-open-item\" type=\"button\" data-item-id=\"" + escapeHtml(item.id) + "\">",
      "<div class=\"avatar " + escapeHtml(inventory.getAvatarClass(item.category)) + "\">" + escapeHtml(inventory.getInitials(item.name)) + "</div>",
      "<div class=\"item-copy\">",
      "<div class=\"item-name\">" + escapeHtml(item.name) + "</div>",
      "<div class=\"item-meta\">" + escapeHtml(inventory.getCategoryLabel(item.category, t)) + " · " + escapeHtml(item.itemId) + "</div>",
      "<div class=\"item-submeta\">" + escapeHtml(getDisplayLocation(item)) + "</div>",
      buildStatusHtml(item),
      " " + buildAgeBadgeHtml(item),
      "</div>",
      "<div class=\"item-side\">",
      "<div class=\"item-price\">" + escapeHtml(currency(item.listedPrice || 0)) + "</div>",
      "<div class=\"item-qty\">" + escapeHtml(t("quantityRemaining")) + ": " + escapeHtml(number(item.quantity)) + "</div>",
      "<div class=\"item-profit\">" + escapeHtml(item.saleStatus === "sold" ? (latestSale && latestSale.soldPrice != null ? currency(latestSale.soldPrice) : t("salePriceMissing")) : currency(inventory.getPotentialProfit(item))) + "</div>",
      "</div>",
      "</button>",
      "<div class=\"inventory-card-meta\">",
      "<div class=\"detail-field\"><div class=\"detail-field-label\">" + escapeHtml(t("availableOn")) + "</div><div class=\"detail-field-value\">" + escapeHtml(getDisplayLocation(item)) + "</div></div>",
      "<div class=\"detail-field\"><div class=\"detail-field-label\">" + escapeHtml(t("ageShort")) + "</div><div class=\"detail-field-value\">" + escapeHtml(buildAgeLabelText(item)) + "</div></div>",
      "</div>",
      "<div class=\"inventory-card-actions\">",
      "<button class=\"inventory-action-btn secondary action-edit-item\" type=\"button\" data-item-id=\"" + escapeHtml(item.id) + "\">" + escapeHtml(t("editItem")) + "</button>",
      "<button class=\"inventory-action-btn action-sell-restock\" type=\"button\" data-item-id=\"" + escapeHtml(item.id) + "\" data-action=\"" + escapeHtml(item.saleStatus === "sold" ? "restock" : "sell") + "\">" + escapeHtml(item.saleStatus === "sold" ? t("restock") : t("markSold")) + "</button>",
      "<button class=\"inventory-action-btn secondary action-open-label\" type=\"button\" data-item-id=\"" + escapeHtml(item.id) + "\">" + escapeHtml(t("detailLabel")) + "</button>",
      "</div>",
      "</div>"
    ].join("");
  }

  function buildSaleCard(entry) {
    return [
      "<button class=\"item-card action-open-item\" type=\"button\" data-item-id=\"" + escapeHtml(entry.itemRef) + "\">",
      "<div class=\"avatar " + escapeHtml(inventory.getAvatarClass(entry.category)) + "\">" + escapeHtml(inventory.getInitials(entry.name)) + "</div>",
      "<div class=\"item-copy\">",
      "<div class=\"item-name\">" + escapeHtml(entry.name) + "</div>",
      "<div class=\"item-meta\">" + escapeHtml(inventory.getPlatformLabel(entry.soldPlatform, t)) + " · " + escapeHtml(i18n.formatDateTime(entry.dateSold)) + "</div>",
      "<div class=\"item-submeta\">" + escapeHtml(entry.itemId) + " · " + escapeHtml(getDisplayLocation(entry)) + "</div>",
      "<span class=\"status sold\">" + escapeHtml(t("statusSold")) + "</span>",
      "</div>",
      "<div class=\"item-side\">",
      "<div class=\"item-price\">" + escapeHtml(entry.soldPrice == null ? t("salePriceMissing") : currency(entry.revenue)) + "</div>",
      "<div class=\"item-qty\">" + escapeHtml(t("quantitySold")) + ": " + escapeHtml(number(entry.quantity)) + "</div>",
      "<div class=\"item-profit\">" + escapeHtml(entry.soldPrice == null ? "--" : currency(entry.profit)) + "</div>",
      "</div>",
      "</button>"
    ].join("");
  }

  function buildHistoryItem(entry, type) {
    return [
      "<div class=\"history-item\">",
      "<div class=\"history-type\">" + escapeHtml(type === "sale" ? t("statusSold") : entry.type) + "</div>",
      "<div class=\"history-date\">" + escapeHtml(i18n.formatDateTime(type === "sale" ? entry.dateSold : entry.date)) + "</div>",
      "<div class=\"history-note\">" + escapeHtml(entry.note || "") + "</div>",
      "<div class=\"history-meta\">" + escapeHtml(type === "sale"
        ? (entry.soldPrice == null ? t("salePriceMissing") : currency(entry.soldPrice) + " · " + inventory.getPlatformLabel(entry.soldPlatform, t))
        : ("Qty " + entry.qtyBefore + " → " + entry.qtyAfter)) + "</div>",
      "</div>"
    ].join("");
  }

  function renderHome() {
    const overview = finance.getOverviewMetrics(items, new Date());
    const filteredItems = inventory.sortItems(inventory.filterItems(items, {
      query: state.homeSearch,
      filters: {}
    }, new Date()), "newest", new Date()).slice(0, 5);
    const attentionItems = inventory.getAgingItems(items, 30, new Date()).slice(0, 5);

    refs.homeStatAvailable.textContent = number(overview.availableItemsCount);
    refs.homeStatRevenue.textContent = currency(overview.totalRevenue);
    refs.homeStatProfit.textContent = currency(overview.totalProfit);
    refs.homeStatAge90.textContent = number(overview.age90);
    refs.homeAge30.textContent = number(overview.age30);
    refs.homeAge60.textContent = number(overview.age60);
    refs.homeInventoryValue.textContent = currency(overview.unsoldInventoryValue);

    if (!filteredItems.length) {
      renderEmptyState(refs.homeRecentList, "noItems");
    } else {
      refs.homeRecentList.innerHTML = filteredItems.map(buildItemCard).join("");
    }

    if (!attentionItems.length) {
      renderEmptyState(refs.homeAttentionList, "alertsEmpty");
    } else {
      refs.homeAttentionList.innerHTML = attentionItems.map(buildAttentionCard).join("");
    }
  }

  function renderInventory() {
    const filteredItems = inventory.sortItems(inventory.filterItems(items, {
      query: state.inventorySearch,
      filters: state.inventoryFilters
    }, new Date()), state.inventorySort, new Date());
    const availableCount = inventory.getAvailableItems(items).length;
    const soldCount = items.filter(function (item) {
      return item.salesHistory.length > 0;
    }).length;
    const locationCount = new Set(items.map(function (item) {
      return item.storageLocation + ":" + (item.customLocation || "");
    })).size;

    refs.inventoryAvailableCount.textContent = number(availableCount);
    refs.inventorySoldCount.textContent = number(soldCount);
    refs.inventoryLocationCount.textContent = number(locationCount);
    renderSummaryFilterChips();

    if (!filteredItems.length) {
      renderEmptyState(refs.inventoryList, "noItems");
      return;
    }

    refs.inventoryList.innerHTML = filteredItems.map(buildInventoryCard).join("");
  }

  function renderAnalytics() {
    const overview = finance.getOverviewMetrics(items, new Date());
    refs.analyticsRevenue.textContent = currency(overview.totalRevenue);
    refs.analyticsCost.textContent = currency(overview.totalCost);
    refs.analyticsProfit.textContent = currency(overview.totalProfit);
    refs.analyticsAverageProfit.textContent = currency(overview.averageProfitPerItem);
    refs.analyticsBestPlatform.textContent = overview.bestPlatform ? inventory.getPlatformLabel(overview.bestPlatform.key, t) : "--";
    refs.analyticsBestCategory.textContent = overview.bestCategory ? inventory.getCategoryLabel(overview.bestCategory.key, t) : "--";
    refs.analyticsUnsoldValue.textContent = currency(overview.unsoldInventoryValue);
    refs.analyticsSoldValue.textContent = currency(overview.soldInventoryValue);

    const dataset = analytics.buildDataset(items, state.analyticsChart, t);
    analytics.renderPieChart({
      chart: refs.analyticsChart,
      legend: refs.analyticsLegend,
      empty: refs.analyticsChartEmpty
    }, dataset, {
      currency: currency,
      count: number,
      percent: percent,
      totalLabel: t("chartTotal"),
      emptyText: t("noChartData")
    });

    const earnings = finance.getEarningsBreakdown(items, new Date());
    refs.earningsGrid.innerHTML = earnings.map(function (entry) {
      return [
        "<div class=\"earnings-card\">",
        "<div class=\"earnings-label\">" + escapeHtml(t(entry.labelKey)) + "</div>",
        "<div class=\"earnings-profit\">" + escapeHtml(currency(entry.metrics.profit)) + "</div>",
        "<div class=\"earnings-revenue\">" + escapeHtml(t("metricRevenue")) + ": " + escapeHtml(currency(entry.metrics.revenue)) + "</div>",
        "</div>"
      ].join("");
    }).join("");
  }

  function renderFinance() {
    const metrics = finance.getFinanceMetrics(items, state.financeRange, new Date());
    refs.financeRevenue.textContent = currency(metrics.revenue);
    refs.financeCost.textContent = currency(metrics.cost);
    refs.financeProfit.textContent = currency(metrics.profit);
    refs.financeSoldItems.textContent = number(metrics.soldItems);
    refs.financeAverageSale.textContent = currency(metrics.averageSalePrice);
    refs.financeAverageProfit.textContent = currency(metrics.averageProfit);
    refs.financeBestPlatform.textContent = metrics.bestPlatform ? inventory.getPlatformLabel(metrics.bestPlatform.key, t) : "--";
    refs.financeBestCategory.textContent = metrics.bestCategory ? inventory.getCategoryLabel(metrics.bestCategory.key, t) : "--";
    refs.financeMissingPrice.textContent = number(metrics.missingSoldPriceCount);

    Array.from(refs.financeRangeRow.querySelectorAll(".chip")).forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-range") === state.financeRange);
    });

    if (!metrics.entries.length) {
      renderEmptyState(refs.financeSalesList, "noSales");
    } else {
      refs.financeSalesList.innerHTML = metrics.entries.map(buildSaleCard).join("");
    }
  }

  function renderProfile() {
    const overview = finance.getOverviewMetrics(items, new Date());
    const languageName = i18n.getLanguage() === "es" ? t("spanish") : t("english");
    const categories = Array.from(new Set(items.map(function (item) {
      return inventory.getCategoryLabel(item.category, t);
    })));

    refs.profileCurrentListings.textContent = number(overview.availableItemsCount);
    refs.profileSoldHistory.textContent = number(overview.soldItemsCount);
    refs.profilePotentialProfit.textContent = currency(overview.inventoryPotentialProfit);
    refs.profileTotalCost.textContent = currency(overview.totalCost);
    refs.profileTotalRevenue.textContent = currency(overview.totalRevenue);
    refs.profileTotalProfit.textContent = currency(overview.totalProfit);
    refs.profileLanguageValue.textContent = languageName;
    refs.profileLastUpdated.textContent = getLatestUpdateValue() ? i18n.formatDateTime(getLatestUpdateValue()) : "--";
    refs.profileCategories.textContent = categories.length ? categories.join(", ") : "--";
  }

  function renderAlerts() {
    const alertItems = inventory.getAgingItems(items, 30, new Date());
    if (!alertItems.length) {
      renderEmptyState(refs.alertsList, "alertsEmpty");
      refs.alertsBtn.removeAttribute("data-badge");
      return;
    }

    refs.alertsBtn.setAttribute("data-badge", String(alertItems.length));
    refs.alertsList.innerHTML = alertItems.map(buildAttentionCard).join("");
  }

  function renderDetail() {
    const item = getItemById(state.detailItemId);
    if (!item) {
      closeDetail();
      return;
    }

    const age = getItemAgeLabel(item);
    const displayProfit = item.salesHistory.length ? inventory.getRealizedProfit(item) : inventory.getPotentialProfit(item);
    const margin = getMarginForDisplay(item);
    const soldPrice = item.soldPrice == null ? t("salePriceMissing") : currency(item.soldPrice);
    const latestSale = inventory.getLatestSale(item);

    refs.detailName.textContent = item.name;
    refs.detailMeta.textContent = item.itemId + " · " + getDisplayLocation(item);
    refs.detailSubtitle.textContent = i18n.formatDateTime(item.lastUpdated);
    refs.detailStatusPill.className = "status " + item.saleStatus;
    refs.detailStatusPill.textContent = inventory.getSaleStatusLabel(item.saleStatus, t);
    refs.detailAgePill.className = "age-badge" + (age.key === "30" ? " is-alert-30" : age.key === "60" ? " is-alert-60" : age.key === "90" ? " is-alert-90" : "");
    refs.detailAgePill.textContent = age.text;
    refs.detailAvatar.className = "detail-avatar " + inventory.getAvatarClass(item.category);
    refs.detailAvatar.textContent = inventory.getInitials(item.name);
    updateImagePreview(refs.detailImageWrap, refs.detailImage, item.itemImage);

    const detailFields = [
      { label: t("detailDescription"), value: item.description || "--", wide: true },
      { label: t("detailCategory"), value: inventory.getCategoryLabel(item.category, t) },
      { label: t("detailCost"), value: currency(item.cost) },
      { label: t("detailListedPrice"), value: item.listedPrice == null ? "--" : currency(item.listedPrice) },
      { label: t("detailSoldPrice"), value: soldPrice },
      { label: t("detailProfit"), value: currency(displayProfit) },
      { label: t("detailProfitMargin"), value: percent(margin) },
      { label: t("detailStorage"), value: getDisplayLocation(item) },
      { label: t("detailSalePlatform"), value: item.soldPlatform ? getDisplayPlatform(item) : "--" },
      { label: t("detailOriginalBarcode"), value: item.originalBarcode || "--" },
      { label: t("detailInternalId"), value: item.itemId },
      { label: t("detailDateAdded"), value: i18n.formatDate(item.dateAdded) },
      { label: t("detailDateSold"), value: item.dateSold ? i18n.formatDate(item.dateSold) : "--" },
      { label: t("detailQuantity"), value: number(item.quantity) },
      { label: t("detailSource"), value: item.source || "--" },
      { label: t("detailNotes"), value: item.notes || "--", wide: true }
    ];

    refs.detailFieldGrid.innerHTML = detailFields.map(function (field) {
      return [
        "<div class=\"detail-field" + (field.wide ? " detail-field-wide" : "") + "\">",
        "<div class=\"detail-field-label\">" + escapeHtml(field.label) + "</div>",
        "<div class=\"detail-field-value\">" + escapeHtml(field.value) + "</div>",
        "</div>"
      ].join("");
    }).join("");

    const historyEntries = item.movementHistory.slice().sort(function (left, right) {
      return new Date(right.date) - new Date(left.date);
    }).map(function (entry) {
      return buildHistoryItem(entry, "movement");
    });

    if (latestSale) {
      historyEntries.unshift(buildHistoryItem(latestSale, "sale"));
    }

    refs.detailHistoryList.innerHTML = historyEntries.length ? historyEntries.join("") : "<div class=\"empty-state\">" + escapeHtml(t("noHistory")) + "</div>";
    refs.detailSellBtn.disabled = item.saleStatus !== "available" || item.quantity < 1;
  }

  function renderLabelPreview() {
    const item = getItemById(state.labelItemId);
    if (!item) {
      closeLabel();
      return;
    }

    labels.renderLabelPreview(refs.labelPreview, item, {
      storageLabel: getDisplayLocation,
      currency: currency
    });
  }

  function refreshAll() {
    applyStaticHelpers();
    renderHome();
    renderInventory();
    renderAnalytics();
    renderFinance();
    renderProfile();
    renderAlerts();

    if (refs.detailBackdrop.classList.contains("show")) {
      renderDetail();
    }
    if (refs.labelBackdrop.classList.contains("show")) {
      renderLabelPreview();
    }
  }

  function parseMoneyField(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  function validateStorage(storageValue, customValue) {
    if (!storageValue) {
      showToast(t("chooseStorage"));
      return false;
    }
    if (storageValue === "other" && !inventory.trimString(customValue)) {
      showToast(t("enterCustomLocation"));
      return false;
    }
    return true;
  }

  function resolveSoldPrice(candidateValue, listedPrice) {
    const parsed = parseMoneyField(candidateValue);
    if (parsed != null) {
      return parsed;
    }
    if (listedPrice != null && window.confirm(t("useListedPriceConfirm", { price: currency(listedPrice) }))) {
      return listedPrice;
    }
    return null;
  }

  function readQuickPayload() {
    const name = inventory.trimString(refs.quickName.value);
    const cost = parseMoneyField(refs.quickCost.value);
    const listedPrice = parseMoneyField(refs.quickListedPrice.value);

    if (!name) {
      showToast(t("enterName"));
      refs.quickName.focus();
      return null;
    }
    if (cost == null) {
      showToast(t("enterCost"));
      refs.quickCost.focus();
      return null;
    }
    if (listedPrice == null) {
      showToast(t("enterListedPrice"));
      refs.quickListedPrice.focus();
      return null;
    }
    if (!validateStorage(refs.quickStorage.value, refs.quickCustomLocation.value)) {
      refs.quickStorage.focus();
      return null;
    }

    return {
      name: name,
      description: "",
      category: refs.quickCategory.value,
      source: "",
      cost: cost,
      listedPrice: listedPrice,
      quantity: refs.quickQuantity.value || 1,
      dateAdded: new Date().toISOString(),
      storageLocation: refs.quickStorage.value,
      customLocation: refs.quickCustomLocation.value,
      originalBarcode: "",
      itemImage: "",
      saleStatus: "available",
      soldPrice: null,
      dateSold: null,
      soldPlatform: null,
      notes: ""
    };
  }

  function readFullPayload() {
    const name = inventory.trimString(refs.fullName.value);
    const cost = parseMoneyField(refs.fullCost.value);
    const listedPrice = parseMoneyField(refs.fullListedPrice.value);

    if (!name) {
      showToast(t("enterName"));
      refs.fullName.focus();
      return null;
    }
    if (cost == null) {
      showToast(t("enterCost"));
      refs.fullCost.focus();
      return null;
    }
    if (listedPrice == null) {
      showToast(t("enterListedPrice"));
      refs.fullListedPrice.focus();
      return null;
    }
    if (!validateStorage(refs.fullStorage.value, refs.fullCustomLocation.value)) {
      refs.fullStorage.focus();
      return null;
    }

    const payload = {
      name: name,
      description: inventory.trimString(refs.fullDescription.value),
      category: refs.fullCategory.value,
      source: inventory.trimString(refs.fullSource.value),
      cost: cost,
      listedPrice: listedPrice,
      quantity: refs.fullQuantity.value || 1,
      dateAdded: refs.fullDateAdded.value || new Date().toISOString(),
      storageLocation: refs.fullStorage.value,
      customLocation: refs.fullCustomLocation.value,
      originalBarcode: inventory.trimString(refs.fullBarcode.value),
      itemImage: itemSheetImageData,
      saleStatus: refs.fullSaleStatus.value,
      soldPrice: null,
      dateSold: null,
      soldPlatform: null,
      notes: inventory.trimString(refs.fullNotes.value)
    };

    if (payload.saleStatus === "sold") {
      const soldPrice = resolveSoldPrice(refs.fullSoldPrice.value, payload.listedPrice);
      if (soldPrice == null) {
        showToast(t("enterSoldPrice"));
        refs.fullSoldPrice.focus();
        return null;
      }
      if (!refs.fullDateSold.value) {
        showToast(t("chooseSoldDate"));
        refs.fullDateSold.focus();
        return null;
      }
      if (!refs.fullSoldPlatform.value) {
        showToast(t("chooseSoldPlatform"));
        refs.fullSoldPlatform.focus();
        return null;
      }
      payload.soldPrice = soldPrice;
      payload.dateSold = refs.fullDateSold.value;
      payload.soldPlatform = refs.fullSoldPlatform.value;
    }

    return payload;
  }

  function saveQuickItem() {
    const payload = readQuickPayload();
    if (!payload) {
      return;
    }
    const newItem = inventory.createItem(payload, items);
    saveItems(items.concat([newItem]));
    refreshAll();
    closeItemSheet(true);
    setActiveTab("inventory");
    showToast(t("itemAdded", { name: newItem.name }));
  }

  function saveFullItem() {
    const payload = readFullPayload();
    if (!payload) {
      return;
    }

    if (state.itemSheetContext === "edit") {
      const current = getItemById(state.editingItemId);
      if (!current) {
        return;
      }
      const updated = inventory.updateItem(current, payload);
      saveItems(replaceItem(updated));
      refreshAll();
      closeItemSheet(true);
      showToast(t("itemUpdated", { name: updated.name }));
      return;
    }

    const newItem = inventory.createItem(payload, items);
    saveItems(items.concat([newItem]));
    refreshAll();
    closeItemSheet(true);
    setActiveTab(newItem.saleStatus === "sold" ? "finance" : "inventory");
    showToast(t("itemAdded", { name: newItem.name }));
  }

  function deleteItem(itemId) {
    const item = getItemById(itemId);
    if (!item) {
      return;
    }
    if (!window.confirm(t("deleteConfirm", { name: item.name }))) {
      return;
    }
    saveItems(items.filter(function (entry) {
      return entry.id !== itemId;
    }));
    if (state.detailItemId === itemId) {
      closeDetail();
    }
    if (state.labelItemId === itemId) {
      closeLabel();
    }
    refreshAll();
    showToast(t("itemDeleted", { name: item.name }));
  }

  function submitTransaction() {
    const item = getItemById(state.transaction.itemId);
    if (!item) {
      return;
    }

    const quantity = Number(refs.transactionQuantity.value);
    if (!Number.isFinite(quantity) || quantity < 1) {
      showToast(t("validQuantity"));
      refs.transactionQuantity.focus();
      return;
    }

    if (state.transaction.type === "sell") {
      if (quantity > item.quantity) {
        showToast(t("validQuantity"));
        refs.transactionQuantity.focus();
        return;
      }
      const soldPrice = resolveSoldPrice(refs.transactionSoldPrice.value, item.listedPrice);
      if (soldPrice == null) {
        showToast(t("enterSoldPrice"));
        refs.transactionSoldPrice.focus();
        return;
      }
      if (!refs.transactionDateSold.value) {
        showToast(t("chooseSoldDate"));
        refs.transactionDateSold.focus();
        return;
      }
      if (!refs.transactionSoldPlatform.value) {
        showToast(t("chooseSoldPlatform"));
        refs.transactionSoldPlatform.focus();
        return;
      }

      const updated = inventory.recordSale(item, {
        quantity: quantity,
        soldPrice: soldPrice,
        dateSold: refs.transactionDateSold.value,
        soldPlatform: refs.transactionSoldPlatform.value,
        note: refs.transactionNote.value
      });
      saveItems(replaceItem(updated));
      refreshAll();
      closeTransaction(true);
      closeDetail();
      showToast(t("saleRecorded"));
      return;
    }

    const restocked = inventory.recordRestock(item, {
      quantity: quantity,
      note: refs.transactionNote.value
    });
    saveItems(replaceItem(restocked));
    refreshAll();
    closeTransaction(true);
    closeDetail();
    showToast(t("restockRecorded"));
  }

  function exportCsv() {
    const headers = [
      "itemId",
      "name",
      "description",
      "category",
      "cost",
      "listedPrice",
      "soldPrice",
      "saleStatus",
      "dateAdded",
      "dateSold",
      "storageLocation",
      "customLocation",
      "soldPlatform",
      "originalBarcode",
      "internalBarcode",
      "quantity",
      "soldQuantity",
      "source",
      "notes"
    ];
    const rows = items.map(function (item) {
      return headers.map(function (header) {
        return item[header] == null ? "" : String(item[header]);
      });
    });
    const csv = [headers.join(",")].concat(rows.map(function (row) {
      return row.map(function (value) {
        return "\"" + value.replace(/"/g, "\"\"") + "\"";
      }).join(",");
    })).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "palletflow-export.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(t("exportDone"));
  }

  function resetDemoData() {
    if (!window.confirm(t("resetConfirm"))) {
      return;
    }
    items = storage.resetItems();
    state.homeSearch = "";
    state.inventorySearch = "";
    state.inventorySort = "newest";
    state.inventoryFilters = {
      category: "all",
      location: "all",
      saleStatus: "all",
      age: "all"
    };
    refs.homeSearchInput.value = "";
    refs.inventorySearchInput.value = "";
    refs.inventorySortSelect.value = "newest";
    closeItemSheet(true);
    closeDetail();
    closeTransaction(true);
    closeLabel();
    closeScanner();
    closeMenu();
    closeAlerts();
    closeFilters();
    refreshAll();
    showToast(t("resetDone"));
  }

  async function handleFullImageChange() {
    const file = refs.fullImageInput.files && refs.fullImageInput.files[0];
    if (!file) {
      return;
    }
    itemSheetImageData = await scanner.fileToDataUrl(file);
    updateImagePreview(refs.fullImagePreviewWrap, refs.fullImagePreview, itemSheetImageData);
  }

  async function handleScannerImageChange() {
    const file = refs.scannerPhotoInput.files && refs.scannerPhotoInput.files[0];
    if (!file) {
      return;
    }
    scannerImageData = await scanner.fileToDataUrl(file);
    updateImagePreview(refs.scannerPhotoPreviewWrap, refs.scannerPhotoPreview, scannerImageData);
  }

  async function runScannerLookup() {
    const result = await scanner.runScannerLookup({
      barcode: refs.scannerBarcodeInput.value,
      imageDataUrl: scannerImageData
    });

    refs.scannerName.value = result.draft.name || refs.scannerName.value;
    refs.scannerDescription.value = result.draft.description || refs.scannerDescription.value;
    refs.scannerCategory.value = result.draft.category || refs.scannerCategory.value;
    refs.scannerPrice.value = result.draft.listedPrice == null ? refs.scannerPrice.value : result.draft.listedPrice;
    scannerToastMessage = result.message;
    showToast(result.message);
  }

  function useScannerDraftInForm() {
    openItemSheet("full");
    refs.fullName.value = refs.scannerName.value;
    refs.fullDescription.value = refs.scannerDescription.value;
    refs.fullCategory.value = refs.scannerCategory.value || "other";
    refs.fullListedPrice.value = refs.scannerPrice.value;
    refs.fullBarcode.value = refs.scannerBarcodeInput.value;
    itemSheetImageData = scannerImageData;
    updateImagePreview(refs.fullImagePreviewWrap, refs.fullImagePreview, itemSheetImageData);
    closeScanner();
    captureItemSheetSnapshot();
    if (scannerToastMessage) {
      showToast(scannerToastMessage);
    }
  }

  function applyLanguage(nextLanguage) {
    i18n.setLanguage(storage.saveLanguage(nextLanguage));
    refreshAll();
    showToast(t("languageSaved"));
  }

  function handleItemActionClick(event) {
    const openButton = event.target.closest(".action-open-item");
    if (openButton) {
      openDetail(openButton.getAttribute("data-item-id"));
      return;
    }
    const editButton = event.target.closest(".action-edit-item");
    if (editButton) {
      openEditSheet(editButton.getAttribute("data-item-id"));
      return;
    }
    const saleButton = event.target.closest(".action-sell-restock");
    if (saleButton) {
      openTransaction(saleButton.getAttribute("data-action"), saleButton.getAttribute("data-item-id"));
      return;
    }
    const labelButton = event.target.closest(".action-open-label");
    if (labelButton) {
      openLabel(labelButton.getAttribute("data-item-id"));
    }
  }

  refs.loginBtn.addEventListener("click", function () {
    refs.loginScreen.classList.remove("active");
    refs.dashboardScreen.classList.add("active");
    setActiveTab(state.activeTab);
    refreshAll();
  });

  refs.menuBtn.addEventListener("click", openMenu);
  refs.closeMenuBtn.addEventListener("click", closeMenu);
  refs.menuScannerBtn.addEventListener("click", function () {
    closeMenu();
    openScanner();
  });
  refs.menuExportBtn.addEventListener("click", function () {
    closeMenu();
    exportCsv();
  });
  refs.languageEnBtn.addEventListener("click", function () {
    applyLanguage("en");
  });
  refs.languageEsBtn.addEventListener("click", function () {
    applyLanguage("es");
  });

  refs.alertsBtn.addEventListener("click", openAlerts);
  refs.closeAlertsBtn.addEventListener("click", closeAlerts);
  refs.openFilterBtn.addEventListener("click", openFilters);
  refs.closeFilterBtn.addEventListener("click", closeFilters);
  refs.clearFilterBtn.addEventListener("click", function () {
    state.inventoryFilters = {
      category: "all",
      location: "all",
      saleStatus: "all",
      age: "all"
    };
    closeFilters();
    renderInventory();
  });
  refs.applyFilterBtn.addEventListener("click", function () {
    state.inventoryFilters = {
      category: refs.filterCategorySelect.value,
      location: refs.filterLocationSelect.value,
      saleStatus: refs.filterStatusSelect.value,
      age: refs.filterAgeSelect.value
    };
    closeFilters();
    renderInventory();
  });

  refs.openSheetBtn.addEventListener("click", function () {
    openItemSheet("quick");
  });
  refs.homeAddBtn.addEventListener("click", function () {
    openItemSheet("quick");
  });
  refs.homeScannerBtn.addEventListener("click", openScanner);
  refs.inventoryAddBtn.addEventListener("click", function () {
    openItemSheet("full");
  });
  refs.profileAddBtn.addEventListener("click", function () {
    openItemSheet("full");
  });
  refs.profileScannerBtn.addEventListener("click", openScanner);
  refs.closeSheetBtn.addEventListener("click", function () {
    closeItemSheet(false);
  });

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setSheetMode(button.getAttribute("data-mode"));
    });
  });

  refs.quickStorage.addEventListener("change", toggleQuickCustomLocation);
  refs.fullStorage.addEventListener("change", toggleFullCustomLocation);
  refs.fullSaleStatus.addEventListener("change", toggleSoldFields);
  refs.quickScannerBtn.addEventListener("click", openScanner);
  refs.fullScannerBtn.addEventListener("click", openScanner);
  refs.saveQuickBtn.addEventListener("click", saveQuickItem);
  refs.saveFullBtn.addEventListener("click", saveFullItem);
  refs.fullImageInput.addEventListener("change", handleFullImageChange);

  refs.homeSearchInput.addEventListener("input", function () {
    state.homeSearch = refs.homeSearchInput.value;
    renderHome();
  });
  refs.inventorySearchInput.addEventListener("input", function () {
    state.inventorySearch = refs.inventorySearchInput.value;
    renderInventory();
  });
  refs.inventorySortSelect.addEventListener("change", function () {
    state.inventorySort = refs.inventorySortSelect.value;
    renderInventory();
  });
  refs.analyticsChartSelect.addEventListener("change", function () {
    state.analyticsChart = refs.analyticsChartSelect.value;
    renderAnalytics();
  });
  refs.financeRangeRow.addEventListener("click", function (event) {
    const button = event.target.closest("[data-range]");
    if (!button) {
      return;
    }
    state.financeRange = button.getAttribute("data-range");
    renderFinance();
  });

  refs.homeRecentList.addEventListener("click", handleItemActionClick);
  refs.homeAttentionList.addEventListener("click", handleItemActionClick);
  refs.inventoryList.addEventListener("click", handleItemActionClick);
  refs.financeSalesList.addEventListener("click", handleItemActionClick);
  refs.alertsList.addEventListener("click", handleItemActionClick);

  refs.closeDetailBtn.addEventListener("click", closeDetail);
  refs.detailCloseBtn.addEventListener("click", closeDetail);
  refs.detailEditBtn.addEventListener("click", function () {
    if (state.detailItemId) {
      closeDetail();
      openEditSheet(state.detailItemId);
    }
  });
  refs.detailSellBtn.addEventListener("click", function () {
    if (state.detailItemId) {
      closeDetail();
      openTransaction("sell", state.detailItemId);
    }
  });
  refs.detailRestockBtn.addEventListener("click", function () {
    if (state.detailItemId) {
      closeDetail();
      openTransaction("restock", state.detailItemId);
    }
  });
  refs.detailLabelBtn.addEventListener("click", function () {
    if (state.detailItemId) {
      openLabel(state.detailItemId);
    }
  });
  refs.detailDeleteBtn.addEventListener("click", function () {
    if (state.detailItemId) {
      deleteItem(state.detailItemId);
    }
  });

  refs.closeTransactionBtn.addEventListener("click", function () {
    closeTransaction(false);
  });
  refs.transactionSubmitBtn.addEventListener("click", submitTransaction);

  refs.closeScannerBtn.addEventListener("click", closeScanner);
  refs.scannerPhotoInput.addEventListener("change", handleScannerImageChange);
  refs.scannerTryBtn.addEventListener("click", runScannerLookup);
  refs.scannerUseBtn.addEventListener("click", useScannerDraftInForm);

  refs.closeLabelBtn.addEventListener("click", closeLabel);
  refs.printLabelBtn.addEventListener("click", function () {
    const item = getItemById(state.labelItemId);
    if (!item) {
      return;
    }
    labels.printLabel(item, {
      storageLabel: getDisplayLocation,
      currency: currency
    });
  });
  refs.downloadLabelBtn.addEventListener("click", function () {
    const item = getItemById(state.labelItemId);
    if (!item) {
      return;
    }
    labels.downloadLabel(item, {
      storageLabel: getDisplayLocation,
      currency: currency
    });
    showToast(t("downloadLabel"));
  });
  refs.copyItemIdBtn.addEventListener("click", function () {
    const item = getItemById(state.labelItemId);
    if (!item) {
      return;
    }
    labels.copyItemId(item.itemId).then(function () {
      showToast(t("copiedIdToast"));
    });
  });

  refs.exportCsvBtn.addEventListener("click", exportCsv);
  refs.resetDemoBtn.addEventListener("click", resetDemoData);

  navItems.forEach(function (item) {
    item.addEventListener("click", function () {
      setActiveTab(item.getAttribute("data-tab"));
    });
  });

  refs.menuBackdrop.addEventListener("click", function (event) {
    if (event.target === refs.menuBackdrop) {
      closeMenu();
    }
  });
  refs.alertsBackdrop.addEventListener("click", function (event) {
    if (event.target === refs.alertsBackdrop) {
      closeAlerts();
    }
  });
  refs.filterBackdrop.addEventListener("click", function (event) {
    if (event.target === refs.filterBackdrop) {
      closeFilters();
    }
  });
  refs.sheetBackdrop.addEventListener("click", function (event) {
    if (event.target === refs.sheetBackdrop) {
      closeItemSheet(false);
    }
  });
  refs.detailBackdrop.addEventListener("click", function (event) {
    if (event.target === refs.detailBackdrop) {
      closeDetail();
    }
  });
  refs.transactionBackdrop.addEventListener("click", function (event) {
    if (event.target === refs.transactionBackdrop) {
      closeTransaction(false);
    }
  });
  refs.scannerBackdrop.addEventListener("click", function (event) {
    if (event.target === refs.scannerBackdrop) {
      closeScanner();
    }
  });
  refs.labelBackdrop.addEventListener("click", function (event) {
    if (event.target === refs.labelBackdrop) {
      closeLabel();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
      return;
    }
    if (refs.labelBackdrop.classList.contains("show")) {
      closeLabel();
      return;
    }
    if (refs.scannerBackdrop.classList.contains("show")) {
      closeScanner();
      return;
    }
    if (refs.transactionBackdrop.classList.contains("show")) {
      closeTransaction(false);
      return;
    }
    if (refs.detailBackdrop.classList.contains("show")) {
      closeDetail();
      return;
    }
    if (refs.sheetBackdrop.classList.contains("show")) {
      closeItemSheet(false);
      return;
    }
    if (refs.filterBackdrop.classList.contains("show")) {
      closeFilters();
      return;
    }
    if (refs.alertsBackdrop.classList.contains("show")) {
      closeAlerts();
      return;
    }
    if (refs.menuBackdrop.classList.contains("show")) {
      closeMenu();
    }
  });

  resetQuickForm();
  resetFullForm();
  resetScannerForm();
  captureItemSheetSnapshot();
  captureTransactionSnapshot();
  refs.inventorySortSelect.value = state.inventorySort;
  refs.analyticsChartSelect.value = state.analyticsChart;
  setSheetMode("quick");

  if (isDashboardVisible()) {
    setActiveTab(state.activeTab);
    refreshAll();
  } else {
    applyStaticHelpers();
  }
});
