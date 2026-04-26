(function (global) {
  function lookupBarcode(barcode) {
    return Promise.resolve(barcode ? null : null);
  }

  function generateItemDescription(imageOrBarcode) {
    return Promise.resolve(imageOrBarcode ? "" : "");
  }

  function estimateItemPrice(itemData) {
    return Promise.resolve(itemData ? null : null);
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
    return {
      name: "",
      description: "",
      category: "other",
      listedPrice: null,
      originalBarcode: barcode || "",
      itemImage: imageDataUrl || ""
    };
  }

  async function runScannerLookup(config) {
    const barcode = String(config && config.barcode ? config.barcode : "").trim();
    const imageDataUrl = config && config.imageDataUrl ? config.imageDataUrl : "";
    const lookup = await lookupBarcode(barcode);
    const generatedDescription = await generateItemDescription(imageDataUrl || barcode);
    const estimatedPrice = await estimateItemPrice({
      barcode: barcode,
      imageDataUrl: imageDataUrl,
      lookup: lookup
    });

    return {
      draft: {
        name: lookup && lookup.name ? lookup.name : "",
        description: generatedDescription || (lookup && lookup.description ? lookup.description : ""),
        category: lookup && lookup.category ? lookup.category : "other",
        listedPrice: estimatedPrice != null ? estimatedPrice : (lookup && lookup.estimatedPrice != null ? lookup.estimatedPrice : null),
        originalBarcode: barcode,
        itemImage: imageDataUrl
      },
      message: "AI lookup is not connected yet. Manual entry is available."
    };
  }

  global.PalletFlowScanner = {
    lookupBarcode: lookupBarcode,
    generateItemDescription: generateItemDescription,
    estimateItemPrice: estimateItemPrice,
    fileToDataUrl: fileToDataUrl,
    buildFallbackDraft: buildFallbackDraft,
    runScannerLookup: runScannerLookup
  };
})(window);
