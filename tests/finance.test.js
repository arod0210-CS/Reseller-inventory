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

const items = [listed, sold];
const now = new Date('2026-04-30T12:00:00.000Z');
const overview = finance.getOverviewMetrics(items, now);

assert.equal(overview.totalAvailableUnits, 2);
assert.equal(overview.availableItemsCount, 1);
assert.equal(overview.totalSoldUnits, 1);
assert.equal(overview.inventoryCost, 80);
assert.equal(overview.unsoldInventoryValue, 200);
assert.equal(overview.inventoryPotentialProfit, 120);
assert.equal(overview.totalRevenue, 65);
assert.equal(overview.totalProfit, 40);
assert.equal(overview.totalCost, 105);

const allMetrics = finance.getFinanceMetrics(items, 'all', now);
assert.equal(allMetrics.revenue, 65);
assert.equal(allMetrics.cost, 25);
assert.equal(allMetrics.profit, 40);
assert.equal(allMetrics.soldItems, 1);
assert.equal(allMetrics.averageSalePrice, 65);
assert.equal(allMetrics.averageProfit, 40);
assert.equal(allMetrics.bestPlatform.key, 'facebook');
assert.equal(allMetrics.bestCategory.key, 'tools');

const todayMetrics = finance.getFinanceMetrics(items, 'today', now);
assert.equal(todayMetrics.soldItems, 0);
assert.equal(todayMetrics.revenue, 0);

console.log('finance.test.js passed');
