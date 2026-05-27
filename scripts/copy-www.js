const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "www");

const files = [
  "index.html",
  "styles.css",
  "app.js",
  "inventory.js",
  "scanner.js",
  "finance.js",
  "analytics.js",
  "storage.js",
  "labels.js",
  "export.js",
  "i18n.js"
];

if (!fs.existsSync(out)) {
  fs.mkdirSync(out);
}

files.forEach(function (file) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
});

console.log("www/ updated with " + files.length + " files.");
