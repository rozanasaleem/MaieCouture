// Run with node scripts/test_store_preferences.cjs; uses the frontend's installed TypeScript.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../frontend/node_modules/typescript');
const sourceRoot = path.resolve(__dirname, '../frontend/src');
const modules = new Map();
function load(filename) {
  if (!path.extname(filename)) filename += '.ts';
  if (filename.endsWith('.json')) return require(filename);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const localRequire = specifier => {
    if (specifier.startsWith('@/')) return load(path.join(sourceRoot, specifier.slice(2)));
    if (specifier.startsWith('.')) return load(path.resolve(path.dirname(filename), specifier));
    return require(specifier);
  };
  new Function('require', 'module', 'exports', source)(localRequire, module, module.exports);
  return module.exports;
}

const storage = new Map();
const events = [];
global.window = {
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  },
  dispatchEvent: event => { events.push(event.type); },
};
global.document = { documentElement: { dataset: { country: 'PS' } }, cookie: '' };
const country = load(path.join(sourceRoot, 'lib/country-client.ts'));
const money = load(path.join(sourceRoot, 'lib/currency-client.ts'));
const shared = load(path.join(sourceRoot, 'lib/country-shared.ts'));

// Browser language must never override country supplied by the hosting edge.
const dateTimeFormat = Intl.DateTimeFormat;
Intl.DateTimeFormat = () => { throw new Error('Browser language is not geolocation'); };
for (const [detected, currency] of [['PS', 'ILS'], ['US', 'USD'], ['JO', 'JOD'], ['DE', 'EUR'], ['BG', 'EUR'], ['AE', 'USD']]) {
  document.documentElement.dataset.country = detected;
  assert.equal(country.getPreferredCountry(), detected);
  assert.equal(money.getPreferredDisplayCurrency(), currency);
  assert.equal(storage.size, 0, 'Detected defaults must not become a saved manual selection');
}
Intl.DateTimeFormat = dateTimeFormat;

country.setPreferredCountry('PS');
assert.equal(country.getPreferredCountry('US'), 'PS');
assert.equal(money.getPreferredDisplayCurrency('US'), 'ILS');
assert.ok(events.includes('maie-country-updated'));
assert.ok(events.includes('maie-currency-updated'), 'A country change must refresh prices and the currency selector');
money.setPreferredDisplayCurrency('EUR');
country.setPreferredCountry('JO');
assert.equal(money.getPreferredDisplayCurrency('PS'), 'EUR', 'Manual currency wins over country and location');
money.clearPreferredDisplayCurrency();
assert.equal(money.getPreferredDisplayCurrency('US'), 'JOD');
storage.set(shared.COUNTRY_STORAGE_KEY, 'فلسطين');
assert.equal(country.getPreferredCountry('DE'), 'PS', 'Keep older saved country-name preferences');
storage.set(shared.COUNTRY_STORAGE_KEY, 'Jordan');
assert.equal(money.getPreferredDisplayCurrency('US'), 'JOD');
storage.clear();
assert.equal(country.getPreferredCountry('invalid'), 'PS');
assert.equal(shared.normalizeCountryCode('PS,US'), null);
assert.equal(shared.normalizeCountryCode(' ps '), 'PS');
document.documentElement.dataset.country = 'US';
assert.equal(money.toDisplayMoney(1800, 'ILS', 'ILS').currency, 'ILS', 'Rendering uses the shared hydration snapshot');
assert.equal(money.sumMoneyInCurrency([{amount:1800, currency:'ILS', quantity:2}], 'USD').amount, 1180.32,
  'Convert and round unit prices before multiplying quantity, matching the backend order total');
console.log('Store preference checks passed: location defaults, manual overrides, currency events, legacy selections and hydration currency.');
