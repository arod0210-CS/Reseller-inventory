const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('i18n.js', 'utf8'), context);

const translations = context.window.PalletFlowI18n.translations;
const htmlKeys = Array.from(html.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)).map(match => match[1]);
const appJs = fs.readFileSync('app.js', 'utf8');
const appKeys = Array.from(appJs.matchAll(/(?:^|[^A-Za-z0-9_$])t\("([A-Za-z][A-Za-z0-9]+)"(?=[,)])/g)).map(match => match[1]);
const keys = [...new Set(htmlKeys.concat(appKeys))];

for (const language of ['en', 'es']) {
  const missing = keys.filter(key => !(key in translations[language]));
  assert.deepEqual(missing, [], `${language} is missing translations`);
}

const i18n = context.window.PalletFlowI18n.createI18n('en');
assert.equal(i18n.t('itemAdded', { name: 'Camera' }), '"Camera" added.');
assert.equal(i18n.t('missingKeyExample'), 'missingKeyExample');

i18n.setLanguage('es');
assert.equal(i18n.getLanguage(), 'es');
assert.equal(i18n.t('statusSold'), 'Vendido');

i18n.setLanguage('fr');
assert.equal(i18n.getLanguage(), 'en');

console.log('i18n.test.js passed');
