(function (global) {
  const inventory = global.PalletFlowInventory;
  const finance = global.PalletFlowFinance;

  const palette = [
    "#f5a623",
    "#4a90e2",
    "#3bb273",
    "#e85d5d",
    "#7a5cff",
    "#2ea59b",
    "#8d633f",
    "#7f8190",
    "#f28c28"
  ];

  function groupSegments(items, keySelector, valueSelector) {
    const totals = {};
    items.forEach(function (item) {
      const key = keySelector(item);
      totals[key] = (totals[key] || 0) + valueSelector(item);
    });

    return Object.keys(totals).map(function (key, index) {
      return {
        key: key,
        value: totals[key],
        color: palette[index % palette.length]
      };
    }).filter(function (segment) {
      return segment.value > 0;
    }).sort(function (left, right) {
      return right.value - left.value;
    });
  }

  function buildDataset(items, chartType, t) {
    const sales = finance.getSaleEntries(items);
    const available = inventory.getAvailableItems(items);

    if (chartType === "inventory-category") {
      return {
        format: "count",
        segments: groupSegments(available, function (item) {
          return item.category;
        }, function (item) {
          return item.quantity;
        }).map(function (segment) {
          return {
            key: segment.key,
            value: segment.value,
            color: inventory.CATEGORY_META[segment.key].color,
            label: inventory.getCategoryLabel(segment.key, t)
          };
        })
      };
    }

    if (chartType === "sold-category") {
      return {
        format: "count",
        segments: groupSegments(sales, function (sale) {
          return sale.category;
        }, function (sale) {
          return sale.quantity;
        }).map(function (segment) {
          return {
            key: segment.key,
            value: segment.value,
            color: inventory.CATEGORY_META[segment.key].color,
            label: inventory.getCategoryLabel(segment.key, t)
          };
        })
      };
    }

    if (chartType === "profit-platform") {
      return {
        format: "currency",
        segments: groupSegments(sales.filter(function (sale) {
          return sale.soldPrice != null;
        }), function (sale) {
          return sale.soldPlatform || "other";
        }, function (sale) {
          return sale.profit;
        }).map(function (segment) {
          return {
            key: segment.key,
            value: segment.value,
            color: inventory.PLATFORM_META[segment.key].color,
            label: inventory.getPlatformLabel(segment.key, t)
          };
        })
      };
    }

    if (chartType === "inventory-location") {
      return {
        format: "count",
        segments: groupSegments(available, function (item) {
          return item.storageLocation;
        }, function (item) {
          return item.quantity;
        }).map(function (segment) {
          return {
            key: segment.key,
            value: segment.value,
            color: inventory.STORAGE_META[segment.key].color,
            label: inventory.getStorageLabel(segment.key, t)
          };
        })
      };
    }

    return {
      format: "count",
      segments: groupSegments(sales, function (sale) {
        return sale.soldPlatform || "other";
      }, function (sale) {
        return sale.quantity;
      }).map(function (segment) {
        return {
          key: segment.key,
          value: segment.value,
          color: inventory.PLATFORM_META[segment.key].color,
          label: inventory.getPlatformLabel(segment.key, t)
        };
      })
    };
  }

  function renderPieChart(targets, dataset, helpers) {
    const chartTarget = targets.chart;
    const legendTarget = targets.legend;
    const emptyTarget = targets.empty;
    const formatter = helpers || {};
    const segments = dataset.segments || [];
    const total = segments.reduce(function (sum, segment) {
      return sum + segment.value;
    }, 0);

    if (!segments.length || total <= 0) {
      chartTarget.innerHTML = "";
      legendTarget.innerHTML = "";
      emptyTarget.textContent = formatter.emptyText || "";
      emptyTarget.classList.remove("hidden");
      return;
    }

    emptyTarget.classList.add("hidden");

    let runningShare = 0;
    const stops = [];

    segments.forEach(function (segment) {
      const start = runningShare * 360;
      const share = segment.value / total;
      runningShare += share;
      const end = runningShare * 360;
      stops.push(segment.color + " " + start + "deg " + end + "deg");
      segment.share = share;
    });

    chartTarget.innerHTML = [
      "<div class=\"chart-donut\" style=\"background: conic-gradient(" + stops.join(", ") + ")\">",
      "<div class=\"chart-hole\">",
      "<div class=\"chart-total-label\">" + (formatter.totalLabel || "Total") + "</div>",
      "<div class=\"chart-total-value\">" + (dataset.format === "currency" ? formatter.currency(total) : formatter.count(total)) + "</div>",
      "</div>",
      "</div>"
    ].join("");

    legendTarget.innerHTML = segments.map(function (segment) {
      const valueLabel = dataset.format === "currency" ? formatter.currency(segment.value) : formatter.count(segment.value);
      return [
        "<div class=\"chart-legend-item\">",
        "<span class=\"chart-swatch\" style=\"background:" + segment.color + ";\"></span>",
        "<div class=\"chart-legend-copy\">",
        "<div class=\"chart-legend-label\">" + segment.label + "</div>",
        "<div class=\"chart-legend-meta\">" + valueLabel + " · " + formatter.percent(segment.share) + "</div>",
        "</div>",
        "</div>"
      ].join("");
    }).join("");
  }

  global.PalletFlowAnalytics = {
    buildDataset: buildDataset,
    renderPieChart: renderPieChart
  };
})(window);
