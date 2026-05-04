const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('scanner.js', 'utf8'), context);
const scanner = context.window.PalletFlowScanner;

(async function run() {
  let fetchCalledForEmptyLookup = false;
  context.window.fetch = async function () {
    fetchCalledForEmptyLookup = true;
    throw new Error('Empty lookup should not call fetch');
  };

  const emptyLookup = await scanner.runScannerLookup({});
  assert.equal(emptyLookup.draft, null);
  assert.equal(emptyLookup.validationError, true);
  assert.match(emptyLookup.message, /barcode or upload a photo/i);
  assert.equal(fetchCalledForEmptyLookup, false);

  const emptyDescription = await scanner.generateItemDescription({});
  assert.equal(emptyDescription, '');
  const photoDescription = await scanner.generateItemDescription({ imageDataUrl: 'data:image/jpeg;base64,photo' });
  assert.ok(photoDescription.includes('Photo captured'));
  assert.doesNotMatch(photoDescription, /object Object|objectObject/i);

  delete context.window.fetch;

  const known = await scanner.runScannerLookup({ barcode: '036000291452', imageDataUrl: 'data:image/jpeg;base64,test' });
  assert.equal(known.draft.name, 'Kleenex Tissue Pack');
  assert.equal(known.draft.category, 'home');
  assert.equal(known.draft.originalBarcode, '036000291452');
  assert.equal(known.draft.itemImage, 'data:image/jpeg;base64,test');
  assert.equal(known.draft.listedPrice, 8.99);
  assert.equal(known.draft.source, 'Demo catalog');

  context.window.PALLET_FLOW_SCANNER_ENDPOINT = '/api/scan-product';
  context.window.fetch = async function (url, options) {
    assert.equal(url, '/api/scan-product');
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.equal(body.barcode, '777777777777');
    assert.equal(body.imageDataUrl, 'data:image/jpeg;base64,ai-photo');
    return {
      ok: true,
      json: async function () {
        return {
          name: 'Sony Bluetooth Speaker',
          description: 'AI matched a portable speaker from the photo and barcode.',
          category: 'electronics',
          estimatedPrice: 45,
          imageUrl: 'https://example.com/speaker.jpg',
          source: 'Vision API'
        };
      }
    };
  };

  const aiBackend = await scanner.runScannerLookup({ barcode: '777777777777', imageDataUrl: 'data:image/jpeg;base64,ai-photo' });
  assert.equal(aiBackend.draft.name, 'Sony Bluetooth Speaker');
  assert.equal(aiBackend.draft.category, 'electronics');
  assert.equal(aiBackend.draft.originalBarcode, '777777777777');
  assert.equal(aiBackend.draft.itemImage, 'data:image/jpeg;base64,ai-photo');
  assert.equal(aiBackend.draft.listedPrice, 45);
  assert.equal(aiBackend.draft.source, 'Vision API');
  delete context.window.PALLET_FLOW_SCANNER_ENDPOINT;

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
