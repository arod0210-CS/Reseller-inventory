(function (global) {
  const inventory = global.PalletFlowInventory;

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function startOfWeek(date) {
    const day = date.getDay();
    const copy = startOfDay(date);
    copy.setDate(copy.getDate() - day);
    return copy;
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function startOfYear(date) {
    return new Date(date.getFullYear(), 0, 1);
  }

  function getSaleEntries(items) {
    const entries = [];

    (Array.isArray(items) ? items : []).forEach(function (item) {
      (item.salesHistory || []).forEach(function (sale) {
        entries.push({
          id: sale.id,
          itemRef: item.id,
          itemId: item.itemId,
          name: item.name,
          category: item.category,
          storageLocation: item.storageLocation,
          customLocation: item.customLocation,
          soldPlatform: sale.soldPlatform,
          soldPrice: sale.soldPrice,
          cost: item.cost,
          listedPrice: item.listedPrice,
          quantity: sale.quantity,
          revenue: sale.soldPrice == null ? 0 : sale.soldPrice * sale.quantity,
          profit: sale.soldPrice == null ? 0 : (sale.soldPrice - item.cost) * sale.quantity,
          dateSold: sale.dateSold,
          note: sale.note || "",
          originalBarcode: item.originalBarcode || "",
          itemImage: inventory.getMainImage(item),
          mainImage: inventory.getMainImage(item),
          images: inventory.normalizeImages(item)
        });
      });
    });

    return entries.sort(function (left, right) {
      return new Date(right.dateSold) - new Date(left.dateSold);
    });
  }

  function getRangeStart(rangeKey, nowDate) {
    if (rangeKey === "today") {
      return startOfDay(nowDate);
    }
    if (rangeKey === "week") {
      return startOfWeek(nowDate);
    }
    if (rangeKey === "month") {
      return startOfMonth(nowDate);
    }
    if (rangeKey === "year") {
      return startOfYear(nowDate);
    }
    return null;
  }

  function filterSalesByRange(entries, rangeKey, nowDate) {
    if (rangeKey === "all") {
      return entries.slice();
    }

    const start = getRangeStart(rangeKey, nowDate || new Date());
    return entries.filter(function (entry) {
      return new Date(entry.dateSold) >= start;
    });
  }

  function sumValues(items, selector) {
    return items.reduce(function (sum, item) {
      return sum + selector(item);
    }, 0);
  }

  function groupAndRank(items, selector, valueSelector) {
    const totals = {};

    items.forEach(function (item) {
      const key = selector(item);
      totals[key] = (totals[key] || 0) + valueSelector(item);
    });

    return Object.keys(totals).map(function (key) {
      return { key: key, value: totals[key] };
    }).sort(function (left, right) {
      return right.value - left.value;
    });
  }

  function getFinanceMetrics(items, rangeKey, nowDate) {
    const allEntries = getSaleEntries(items);
    const datedEntries = filterSalesByRange(allEntries, rangeKey || "all", nowDate || new Date());
    const revenueEntries = datedEntries.filter(function (entry) {
      return entry.soldPrice != null;
    });
    const revenue = sumValues(revenueEntries, function (entry) {
      return entry.revenue;
    });
    const cost = sumValues(datedEntries, function (entry) {
      return entry.cost * entry.quantity;
    });
    const profit = sumValues(revenueEntries, function (entry) {
      return entry.profit;
    });
    const soldItems = sumValues(datedEntries, function (entry) {
      return entry.quantity;
    });
    const recordedSoldUnits = sumValues(revenueEntries, function (entry) {
      return entry.quantity;
    });
    const averageSalePrice = recordedSoldUnits ? revenue / recordedSoldUnits : 0;
    const averageProfit = soldItems ? profit / soldItems : 0;
    const platformTotals = groupAndRank(datedEntries, function (entry) {
      return entry.soldPlatform || "other";
    }, function (entry) {
      return entry.quantity;
    });
    const categoryTotals = groupAndRank(datedEntries, function (entry) {
      return entry.category;
    }, function (entry) {
      return entry.quantity;
    });

    return {
      entries: datedEntries,
      allEntries: allEntries,
      revenue: revenue,
      cost: cost,
      profit: profit,
      soldItems: soldItems,
      averageSalePrice: averageSalePrice,
      averageProfit: averageProfit,
      bestPlatform: platformTotals.length ? platformTotals[0] : null,
      bestCategory: categoryTotals.length ? categoryTotals[0] : null,
      missingSoldPriceCount: datedEntries.length - revenueEntries.length
    };
  }

  function getOverviewMetrics(items, nowDate) {
    const now = nowDate || new Date();
    const allSales = getSaleEntries(items);
    const availableItems = inventory.getAvailableItems(items);
    const inventoryCost = sumValues(availableItems, function (item) {
      return item.cost * item.quantity;
    });
    const totalCost = inventoryCost + sumValues(allSales, function (sale) {
      return sale.cost * sale.quantity;
    });
    const totalRevenue = sumValues(allSales, function (sale) {
      return sale.soldPrice == null ? 0 : sale.revenue;
    });
    const totalProfit = sumValues(allSales, function (sale) {
      return sale.soldPrice == null ? 0 : sale.profit;
    });
    const totalSoldUnits = sumValues(allSales, function (sale) {
      return sale.quantity;
    });
    const totalAvailableUnits = sumValues(availableItems, function (item) {
      return item.quantity;
    });
    const averageProfitPerItem = totalSoldUnits ? totalProfit / totalSoldUnits : 0;
    const unsoldInventoryValue = sumValues(availableItems, function (item) {
      return (item.listedPrice || 0) * item.quantity;
    });
    const soldInventoryValue = totalRevenue;
    const age30 = inventory.getAgingItems(items, 30, now).length;
    const age60 = inventory.getAgingItems(items, 60, now).length;
    const age90 = inventory.getAgingItems(items, 90, now).length;
    const bestPlatform = getFinanceMetrics(items, "all", now).bestPlatform;
    const bestCategory = getFinanceMetrics(items, "all", now).bestCategory;

    return {
      totalRevenue: totalRevenue,
      totalCost: totalCost,
      totalProfit: totalProfit,
      totalSoldUnits: totalSoldUnits,
      totalAvailableUnits: totalAvailableUnits,
      availableItemsCount: availableItems.length,
      soldItemsCount: items.filter(function (item) {
        return item.salesHistory.length > 0;
      }).length,
      averageProfitPerItem: averageProfitPerItem,
      unsoldInventoryValue: unsoldInventoryValue,
      soldInventoryValue: soldInventoryValue,
      bestPlatform: bestPlatform,
      bestCategory: bestCategory,
      age30: age30,
      age60: age60,
      age90: age90,
      inventoryCost: inventoryCost,
      inventoryPotentialProfit: sumValues(availableItems, function (item) {
        return inventory.getPotentialProfit(item);
      })
    };
  }

  function getEarningsBreakdown(items, nowDate) {
    const now = nowDate || new Date();
    return [
      { key: "daily", range: "today", labelKey: "dailyEarnings", metrics: getFinanceMetrics(items, "today", now) },
      { key: "weekly", range: "week", labelKey: "weeklyEarnings", metrics: getFinanceMetrics(items, "week", now) },
      { key: "monthly", range: "month", labelKey: "monthlyEarnings", metrics: getFinanceMetrics(items, "month", now) },
      { key: "yearly", range: "year", labelKey: "yearlyEarnings", metrics: getFinanceMetrics(items, "year", now) }
    ];
  }

  global.PalletFlowFinance = {
    getSaleEntries: getSaleEntries,
    filterSalesByRange: filterSalesByRange,
    getFinanceMetrics: getFinanceMetrics,
    getOverviewMetrics: getOverviewMetrics,
    getEarningsBreakdown: getEarningsBreakdown
  };
})(window);
