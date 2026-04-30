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
  assert.equal(known.draft.source, 'Demo catalog');

  context.window.fetch = async function (url) {
    assert.ok(String(url).includes('737628064502'));
    return {
      ok: true,
      json: async function () {
        return {
          status: 1,
          product: {
            product_name: 'Instant Noodles',
            brands: 'Nongshim',
            generic_name: 'Noodle soup',
            categories: 'Pantry, packaged food',
            image_url: 'https://example.com/noodles.jpg',
            quantity: '120 g'
          }
        };
      }
    };
  };

  const productDb = await scanner.runScannerLookup({ barcode: '737628064502' });
  assert.equal(productDb.draft.name, 'Nongshim Instant Noodles');
  assert.equal(productDb.draft.category, 'home');
  assert.equal(productDb.draft.originalBarcode, '737628064502');
  assert.equal(productDb.draft.itemImage, 'https://example.com/noodles.jpg');
  assert.equal(productDb.draft.source, 'Open Food Facts');
  assert.ok(productDb.draft.description.includes('Matched product database result.'));

  context.window.fetch = async function () {
    throw new Error('Network down');
  };

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
