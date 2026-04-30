const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('export.js', 'utf8'), context);
const exporter = context.window.PalletFlowExport;

assert.equal(exporter.escapeCsvValue(null), '');
assert.equal(exporter.escapeCsvValue('Plain'), '"Plain"');
assert.equal(exporter.escapeCsvValue('Quote "here"'), '"Quote ""here"""');
assert.equal(exporter.escapeCsvValue('Line\nbreak'), '"Line\nbreak"');

const csv = exporter.buildCsv([
  {
    itemId: 'INV-1',
    name: 'Camera, Lens',
    condition: 'open-box',
    notes: 'Works "great"'
  }
], ['itemId', 'name', 'condition', 'notes']);

assert.equal(csv, 'itemId,name,condition,notes\n"INV-1","Camera, Lens","open-box","Works ""great"""');

const defaultCsv = exporter.buildCsv([{ itemId: 'INV-2', name: 'Default Headers' }]);
assert.equal(defaultCsv.startsWith('itemId,name,description,category,condition'), true);
assert.equal(defaultCsv.includes('"Default Headers"'), true);

console.log('export.test.js passed');
