const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('inventory.js', 'utf8'), context);
const inventory = context.window.PalletFlowInventory;

const img1 = 'data:image/jpeg;base64,one';
const img2 = 'data:image/jpeg;base64,two';

const item = inventory.createItem({
  name: 'Test Sneakers',
  description: 'Clean pair with box',
  condition: 'open-box',
  category: 'clothing',
  cost: 20,
  listedPrice: 60,
  quantity: 2,
  storageLocation: 'house',
  saleStatus: 'listed',
  images: [img1, img2],
  mainImage: img2,
  itemImage: img2,
  notes: 'Photo test'
}, []);

assert.equal(item.saleStatus, 'listed');
assert.equal(item.condition, 'open-box');
assert.deepEqual(item.images, [img1, img2]);
assert.equal(inventory.getMainImage(item), img2);

const normalized = inventory.normalizeItems([{ ...item, mainImage: '', itemImage: '', image: img1 }])[0];
assert.equal(inventory.getMainImage(normalized), img1);

const updated = inventory.updateItem(item, {
  name: 'Test Sneakers Updated',
  description: 'Updated',
  condition: 'used',
  category: 'clothing',
  cost: 22,
  listedPrice: 70,
  quantity: 2,
  storageLocation: 'house',
  saleStatus: 'listed',
  images: [img1, img2],
  mainImage: img1,
  itemImage: img1,
  notes: 'Changed main image'
});

assert.equal(updated.condition, 'used');
assert.equal(inventory.getMainImage(updated), img1);
assert.deepEqual(updated.images, [img1, img2]);

const sold = inventory.recordSale(updated, {
  quantity: 2,
  soldPrice: 65,
  dateSold: '2026-04-29',
  soldPlatform: 'facebook',
  note: 'Sold with photos intact'
});

assert.equal(sold.saleStatus, 'sold');
assert.equal(sold.quantity, 0);
assert.equal(inventory.getMainImage(sold), img1);
assert.deepEqual(sold.images, [img1, img2]);

const partialBase = inventory.createItem({
  name: 'Partial Quantity Item',
  category: 'tools',
  cost: 10,
  listedPrice: 30,
  quantity: 2,
  saleStatus: 'listed'
}, [sold]);
const partialSale = inventory.recordSale(partialBase, {
  quantity: 1,
  soldPrice: 25,
  dateSold: '2026-04-29',
  soldPlatform: 'ebay',
  note: 'Sold one unit'
});

assert.equal(partialSale.saleStatus, 'available');
assert.equal(partialSale.quantity, 1);
assert.equal(partialSale.soldQuantity, 1);
assert.equal(partialSale.salesHistory.length, 1);
assert.equal(partialSale.salesHistory[0].quantity, 1);
assert.equal(inventory.getAvailableItems([partialSale]).length, 1);

const normalizedPartial = inventory.normalizeItems([{ ...partialSale, saleStatus: 'sold' }])[0];
assert.equal(normalizedPartial.saleStatus, 'available');
assert.equal(normalizedPartial.quantity, 1);
assert.equal(normalizedPartial.soldQuantity, 1);

const matches = inventory.filterItems([sold], { query: 'sneakers facebook clothing used', filters: { saleStatus: 'sold' } }, new Date());
assert.equal(matches.length, 1);

const conditionMatches = inventory.filterItems([sold], { query: '', filters: { condition: 'used' } }, new Date());
assert.equal(conditionMatches.length, 1);

const conditionMisses = inventory.filterItems([sold], { query: '', filters: { condition: 'new' } }, new Date());
assert.equal(conditionMisses.length, 0);

const highProfitMatches = inventory.filterItems([sold], { query: '', filters: { profitRange: '25-100' } }, new Date());
assert.equal(highProfitMatches.length, 1);

const highProfitMisses = inventory.filterItems([sold], { query: '', filters: { profitRange: '100-plus' } }, new Date());
assert.equal(highProfitMisses.length, 0);

const lossItem = inventory.createItem({
  name: 'Loss Item',
  cost: 50,
  listedPrice: 25,
  quantity: 1,
  saleStatus: 'listed'
}, [sold]);
const lossMatches = inventory.filterItems([lossItem], { query: '', filters: { profitRange: 'loss' } }, new Date());
assert.equal(lossMatches.length, 1);

console.log('inventory.test.js passed');
