(function (global) {
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function hashText(text) {
    return String(text).split("").reduce(function (sum, character, index) {
      return sum + character.charCodeAt(0) * (index + 3);
    }, 0);
  }

  function buildBarcodeRects(text) {
    const seed = hashText(text || "INV");
    const bars = [];
    let x = 0;

    for (let index = 0; index < 46; index += 1) {
      const width = ((seed + index * 17) % 3) + 1;
      const height = index % 4 === 0 ? 52 : index % 3 === 0 ? 46 : 38;
      bars.push("<rect x=\"" + x + "\" y=\"" + (56 - height) + "\" width=\"" + width + "\" height=\"" + height + "\" rx=\"0.5\" fill=\"#171717\"></rect>");
      x += width + ((seed + index) % 2 === 0 ? 1 : 2);
    }

    return {
      width: Math.max(140, x),
      markup: bars.join("")
    };
  }

  function buildLabelSvg(item, helpers) {
    const name = escapeHtml(item.name || "Untitled Item");
    const itemId = escapeHtml(item.itemId || item.internalBarcode || "INV");
    const storage = escapeHtml(helpers.storageLabel(item));
    const listedPrice = escapeHtml(helpers.currency(item.listedPrice || 0));
    const barcodeText = escapeHtml(item.originalBarcode || item.internalBarcode || item.itemId || "");
    const barcode = buildBarcodeRects(barcodeText);

    return [
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"360\" height=\"220\" viewBox=\"0 0 360 220\" role=\"img\" aria-label=\"Item label\">",
      "<rect width=\"360\" height=\"220\" rx=\"24\" fill=\"#ffffff\"></rect>",
      "<rect x=\"18\" y=\"18\" width=\"324\" height=\"184\" rx=\"18\" fill=\"#fffaf0\" stroke=\"#f3dfbf\"></rect>",
      "<rect x=\"18\" y=\"18\" width=\"324\" height=\"32\" rx=\"18\" fill=\"#f5a623\"></rect>",
      "<text x=\"34\" y=\"39\" fill=\"#ffffff\" font-size=\"16\" font-weight=\"700\" font-family=\"Segoe UI, Arial, sans-serif\">PalletFlow Label</text>",
      "<text x=\"34\" y=\"76\" fill=\"#1b1b1b\" font-size=\"18\" font-weight=\"700\" font-family=\"Segoe UI, Arial, sans-serif\">" + name + "</text>",
      "<text x=\"34\" y=\"101\" fill=\"#7a6a53\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\">" + itemId + "</text>",
      "<text x=\"34\" y=\"123\" fill=\"#7a6a53\" font-size=\"13\" font-family=\"Segoe UI, Arial, sans-serif\">" + storage + "</text>",
      "<text x=\"34\" y=\"146\" fill=\"#b56e00\" font-size=\"22\" font-weight=\"700\" font-family=\"Segoe UI, Arial, sans-serif\">" + listedPrice + "</text>",
      "<g transform=\"translate(34 200) scale(1 -1)\">" + barcode.markup + "</g>",
      "<text x=\"34\" y=\"192\" fill=\"#1b1b1b\" font-size=\"11\" letter-spacing=\"2\" font-family=\"Consolas, monospace\">" + barcodeText + "</text>",
      "</svg>"
    ].join("");
  }

  function renderLabelPreview(target, item, helpers) {
    if (!target) {
      return;
    }

    target.innerHTML = [
      "<div class=\"label-preview-card\">",
      buildLabelSvg(item, helpers),
      "</div>"
    ].join("");
  }

  function downloadLabel(item, helpers) {
    const svg = buildLabelSvg(item, helpers);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = (item.itemId || "palletflow-label") + ".svg";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function printLabel(item, helpers) {
    const printWindow = window.open("", "_blank", "width=420,height=320");
    if (!printWindow) {
      return false;
    }

    const svg = buildLabelSvg(item, helpers);
    printWindow.document.write(
      "<!DOCTYPE html><html><head><title>Label</title><style>body{margin:0;padding:18px;background:#f6f6f6;font-family:Segoe UI,Arial,sans-serif;display:grid;place-items:center;}svg{max-width:100%;height:auto;box-shadow:0 12px 30px rgba(0,0,0,.12);border-radius:24px;background:#fff;}@media print{body{background:#fff;padding:0;}svg{box-shadow:none;}}</style></head><body>" +
      svg +
      "<script>window.onload=function(){setTimeout(function(){window.print();},120);};<\/script></body></html>"
    );
    printWindow.document.close();
    return true;
  }

  function copyItemId(itemId) {
    const value = String(itemId || "");
    if (!value) {
      return Promise.resolve(false);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value).then(function () {
        return true;
      }).catch(function () {
        return false;
      });
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return Promise.resolve(copied);
  }

  global.PalletFlowLabels = {
    buildLabelSvg: buildLabelSvg,
    renderLabelPreview: renderLabelPreview,
    downloadLabel: downloadLabel,
    printLabel: printLabel,
    copyItemId: copyItemId
  };
})(window);
