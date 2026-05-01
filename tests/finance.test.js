const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('inventory.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('finance.js', 'utf8'), context);

const inventory = context.window.PalletFlowInventory;
const finance = context.window.PalletFlowFinance;

const listed = inventory.createItem({
  name: 'Listed Camera',
  category: 'electronics',
  cost: 40,
  listedPrice: 100,
  quantity: 2,
  saleStatus: 'listed',
  dateAdded: '2026-04-01T12:00:00.000Z'
}, []);

const soldBase = inventory.createItem({
  name: 'Sold Drill',
  category: 'tools',
  cost: 25,
  listedPrice: 70,
  quantity: 1,
  saleStatus: 'available',
  dateAdded: '2026-04-02T12:00:00.000Z'
}, [listed]);

const sold = inventory.recordSale(soldBase, {
  quantity: 1,
  soldPrice: 65,
  dateSold: '2026-04-29T12:00:00.000Z',
  soldPlatform: 'facebook',
  note: 'Finance test sale'
});

const partialBase = inventory.createItem({
  name: 'Partial Lot',
  category: 'tools',
  cost: 10,
  listedPrice: 30,
  quantity: 2,
  saleStatus: 'listed',
  dateAdded: '2026-04-03T12:00:00.000Z'
}, [listed, sold]);

const partial = inventory.recordSale(partialBase, {
  quantity: 1,
  soldPrice: 25,
  dateSold: '2026-04-29T13:00:00.000Z',
  soldPlatform: 'ebay',
  note: 'Finance partial sale'
});

assert.equal(partial.saleStatus, 'available');
assert.equal(partial.quantity, 1);

const items = [listed, sold, partial];
const now = new Date('2026-04-30T12:00:00.000Z');
const overview = finance.getOverviewMetrics(items, now);

assert.equal(overview.totalAvailableUnits, 3);
assert.equal(overview.availableItemsCount, 2);
assert.equal(overview.totalSoldUnits, 2);
assert.equal(overview.inventoryCost, 90);
assert.equal(overview.unsoldInventoryValue, 230);
assert.equal(overview.inventoryPotentialProfit, 140);
assert.equal(overview.totalRevenue, 90);
assert.equal(overview.totalProfit, 55);
assert.equal(overview.totalCost, 125);

const allMetrics = finance.getFinanceMetrics(items, 'all', now);
assert.equal(allMetrics.revenue, 90);
assert.equal(allMetrics.cost, 35);
assert.equal(allMetrics.profit, 55);
assert.equal(allMetrics.soldItems, 2);
assert.equal(allMetrics.averageSalePrice, 45);
assert.equal(allMetrics.averageProfit, 27.5);
assert.equal(allMetrics.bestPlatform.key, 'ebay');
assert.equal(allMetrics.bestCategory.key, 'tools');

const todayMetrics = finance.getFinanceMetrics(items, 'today', now);
assert.equal(todayMetrics.soldItems, 0);
assert.equal(todayMetrics.revenue, 0);

console.log('finance.test.js passed');
