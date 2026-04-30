const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('scanner.js', 'utf8'), context);
const scanner = context.window.PalletFlowScanner;

(async function run() {
  const known = await scanner.runScannerLookup({ barcode: '036000291452', imageDataUrl: 'data:image/jpeg;base64,test' });
  assert.equal(known.draft.name, 'Kleenex Tissue Pack');
  assert.equal(known.draft.category, 'home');
  assert.equal(known.draft.originalBarcode, '036000291452');
  assert.equal(known.draft.itemImage, 'data:image/jpeg;base64,test');
  assert.equal(known.draft.listedPrice, 8.99);

  const unknown = await scanner.runScannerLookup({ barcode: 'ABC-123-XYZ' });
  assert.equal(unknown.draft.name, 'Scanned Item 23-XYZ');
  assert.equal(unknown.draft.category, 'other');
  assert.equal(unknown.draft.originalBarcode, 'ABC-123-XYZ');
  assert.equal(unknown.draft.listedPrice, 19.99);

  const photoOnly = await scanner.runScannerLookup({ imageDataUrl: 'data:image/jpeg;base64,photo' });
  assert.equal(photoOnly.draft.name, 'Photo Item');
  assert.equal(photoOnly.draft.itemImage, 'data:image/jpeg;base64,photo');
  assert.equal(photoOnly.draft.listedPrice, 19.99);

  console.log('scanner.test.js passed');
})();
