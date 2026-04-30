(function (global) {
  const DEFAULT_HEADERS = [
    "itemId",
    "name",
    "description",
    "category",
    "condition",
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

  function escapeCsvValue(value) {
    if (value == null) {
      return "";
    }
    return "\"" + String(value).replace(/"/g, "\"\"") + "\"";
  }

  function buildCsv(items, headers) {
    const activeHeaders = headers && headers.length ? headers : DEFAULT_HEADERS;
    const rows = (Array.isArray(items) ? items : []).map(function (item) {
      return activeHeaders.map(function (header) {
        return escapeCsvValue(item && item[header]);
      }).join(",");
    });
    return [activeHeaders.join(",")].concat(rows).join("\n");
  }

  global.PalletFlowExport = {
    DEFAULT_HEADERS: DEFAULT_HEADERS,
    escapeCsvValue: escapeCsvValue,
    buildCsv: buildCsv
  };
})(window);
