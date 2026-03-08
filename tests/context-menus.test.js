const assert = require('node:assert/strict');
const {
  MENU_DEFINITIONS,
  registerMenus,
  createClickHandler
} = require('../js/context-menus.js');

assert.equal(MENU_DEFINITIONS.length, 3);
assert.deepEqual(MENU_DEFINITIONS[0], {
  id: 'last-name-lookup',
  title: 'Last Name Lookup',
  contexts: ['selection']
});
assert.deepEqual(MENU_DEFINITIONS[1], {
  id: 'first-name-lookup',
  title: 'First Name Lookup',
  contexts: ['selection']
});
assert.deepEqual(MENU_DEFINITIONS[2], {
  id: 'open-options',
  title: 'Options',
  contexts: ['action']
});

const created = [];
registerMenus((menu) => created.push(menu));
assert.deepEqual(created, MENU_DEFINITIONS);

const openedUrls = [];
const built = [];
let openOptionsCalls = 0;
const handler = createClickHandler(
  (url) => openedUrls.push(url),
  (type, selection) => {
    built.push({ type, selection });
    return selection
      ? `https://example.test/${type}?q=${encodeURIComponent(selection)}`
      : '';
  },
  () => {
    openOptionsCalls += 1;
  }
);

handler({ menuItemId: 'last-name-lookup', selectionText: 'Ada Lovelace' });
handler({ menuItemId: 'first-name-lookup', selectionText: 'Grace Hopper' });
handler({ menuItemId: 'first-name-lookup', selectionText: '' });
handler({ menuItemId: 'open-options' });
handler({ menuItemId: 'unknown-id', selectionText: 'Ignored' });

assert.deepEqual(built, [
  { type: 'last-name-lookup', selection: 'Ada Lovelace' },
  { type: 'first-name-lookup', selection: 'Grace Hopper' },
  { type: 'first-name-lookup', selection: '' }
]);

assert.deepEqual(openedUrls, [
  'https://example.test/last-name-lookup?q=Ada%20Lovelace',
  'https://example.test/first-name-lookup?q=Grace%20Hopper'
]);
assert.equal(openOptionsCalls, 1);

console.log('context menu tests passed');
