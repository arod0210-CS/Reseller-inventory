const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('labels.js', 'utf8'), context);
const labels = context.window.PalletFlowLabels;

const helpers = {
  storageLabel() {
    return 'Shelf <A>';
  },
  currency(value) {
    return `$${Number(value).toFixed(2)}`;
  }
};

const item = {
  name: 'Camera & Lens "Kit"',
  itemId: 'INV-TEST-0001',
  internalBarcode: 'INV-TEST-0001',
  originalBarcode: '123456789',
  listedPrice: 129.99
};

const svg = labels.buildLabelSvg(item, helpers);
assert.ok(svg.startsWith('<svg'));
assert.ok(svg.includes('Camera &amp; Lens &quot;Kit&quot;'));
assert.ok(svg.includes('Shelf &lt;A&gt;'));
assert.ok(svg.includes('$129.99'));
assert.ok(svg.includes('123456789'));
assert.equal(svg.includes('<script'), false);

const target = { innerHTML: '' };
labels.renderLabelPreview(target, item, helpers);
assert.ok(target.innerHTML.includes('label-preview-card'));
assert.ok(target.innerHTML.includes('INV-TEST-0001'));

labels.renderLabelPreview(null, item, helpers);

console.log('labels.test.js passed');
