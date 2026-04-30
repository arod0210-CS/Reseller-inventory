const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createLocalStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

const context = {
  window: {},
  localStorage: createLocalStorage()
};
context.window.localStorage = context.localStorage;
vm.createContext(context);
vm.runInContext(fs.readFileSync('inventory.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('storage.js', 'utf8'), context);

const storage = context.window.PalletFlowStorage;
const inventory = context.window.PalletFlowInventory;

const initialItems = storage.loadItems();
assert.ok(initialItems.length > 0);
assert.equal(initialItems[0].itemId.startsWith('INV-'), true);

const customItem = inventory.createItem({
  name: 'Persisted Test Item',
  category: 'tools',
  cost: 10,
  listedPrice: 30,
  quantity: 1,
  saleStatus: 'listed'
}, initialItems);

const saved = storage.saveItems([customItem]);
assert.equal(saved.length, 1);
assert.equal(storage.loadItems()[0].name, 'Persisted Test Item');

context.localStorage.setItem(storage.ITEMS_KEY, '{bad json');
const recovered = storage.loadItems();
assert.ok(recovered.length > 0);
assert.notEqual(recovered[0].name, 'Persisted Test Item');

assert.equal(storage.getLanguage(), 'en');
assert.equal(storage.saveLanguage('es'), 'es');
assert.equal(storage.getLanguage(), 'es');
assert.equal(storage.saveLanguage('fr'), 'en');
assert.equal(storage.getLanguage(), 'en');

console.log('storage.test.js passed');
