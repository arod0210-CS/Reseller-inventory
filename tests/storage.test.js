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

function createThrowingLocalStorage(methods) {
  const backing = createLocalStorage();
  return {
    getItem(key) {
      if (methods.getItem) {
        throw new Error('getItem blocked');
      }
      return backing.getItem(key);
    },
    setItem(key, value) {
      if (methods.setItem) {
        throw new Error('setItem blocked');
      }
      backing.setItem(key, value);
    },
    removeItem(key) {
      if (methods.removeItem) {
        throw new Error('removeItem blocked');
      }
      backing.removeItem(key);
    }
  };
}

function loadStorage(localStorage) {
  const context = {
    window: {},
    localStorage
  };
  context.window.localStorage = context.localStorage;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('inventory.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('storage.js', 'utf8'), context);
  return {
    storage: context.window.PalletFlowStorage,
    inventory: context.window.PalletFlowInventory,
    localStorage: context.localStorage
  };
}

{
  const { storage, inventory, localStorage } = loadStorage(createLocalStorage());

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

  localStorage.setItem(storage.ITEMS_KEY, '{bad json');
  const recovered = storage.loadItems();
  assert.ok(recovered.length > 0);
  assert.notEqual(recovered[0].name, 'Persisted Test Item');

  assert.equal(storage.getLanguage(), 'en');
  assert.equal(storage.saveLanguage('es'), 'es');
  assert.equal(storage.getLanguage(), 'es');
  assert.equal(storage.saveLanguage('fr'), 'en');
  assert.equal(storage.getLanguage(), 'en');

  assert.equal(storage.getScannerEndpoint(), '');
  assert.equal(storage.saveScannerEndpoint(' /api/scan-product '), '/api/scan-product');
  assert.equal(storage.getScannerEndpoint(), '/api/scan-product');
  assert.equal(storage.saveScannerEndpoint(''), '');
  assert.equal(storage.getScannerEndpoint(), '');
}

{
  const { storage } = loadStorage(createThrowingLocalStorage({
    getItem: true,
    setItem: true,
    removeItem: true
  }));

  const initialItems = storage.loadItems();
  assert.ok(initialItems.length > 0);
  assert.equal(initialItems[0].itemId.startsWith('INV-'), true);

  const saved = storage.saveItems([{ name: 'Memory Only Item', quantity: 1 }]);
  assert.equal(saved.length, 1);
  assert.equal(storage.loadItems()[0].name, 'Memory Only Item');

  assert.equal(storage.getLanguage(), 'en');
  assert.equal(storage.saveLanguage('es'), 'es');
  assert.equal(storage.getLanguage(), 'es');
  assert.equal(storage.saveLanguage('fr'), 'en');
  assert.equal(storage.getLanguage(), 'en');

  assert.equal(storage.getScannerEndpoint(), '');
  assert.equal(storage.saveScannerEndpoint(' /api/scan-product '), '/api/scan-product');
  assert.equal(storage.getScannerEndpoint(), '/api/scan-product');
  assert.equal(storage.saveScannerEndpoint(''), '');
  assert.equal(storage.getScannerEndpoint(), '');
}

{
  const { storage } = loadStorage(createThrowingLocalStorage({ setItem: true }));

  storage.loadItems();
  const saved = storage.saveItems([{ name: 'Set Blocked Item', quantity: 1 }]);
  assert.equal(saved.length, 1);
  assert.equal(storage.loadItems()[0].name, 'Set Blocked Item');

  assert.equal(storage.saveLanguage('es'), 'es');
  assert.equal(storage.getLanguage(), 'es');

  assert.equal(storage.saveScannerEndpoint(' /api/scan-product '), '/api/scan-product');
  assert.equal(storage.getScannerEndpoint(), '/api/scan-product');
}

{
  const { storage } = loadStorage(createThrowingLocalStorage({ removeItem: true }));

  assert.equal(storage.saveScannerEndpoint(' /api/scan-product '), '/api/scan-product');
  assert.equal(storage.getScannerEndpoint(), '/api/scan-product');
  assert.equal(storage.saveScannerEndpoint(''), '');
  assert.equal(storage.getScannerEndpoint(), '');
}

console.log('storage.test.js passed');
