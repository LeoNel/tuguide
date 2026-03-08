const assert = require('node:assert/strict');
const path = require('node:path');

const backgroundPath = path.join(__dirname, '..', 'background.js');

const originalChrome = global.chrome;

function loadBackgroundWithChrome(chromeMock) {
  delete require.cache[require.resolve(backgroundPath)];
  global.chrome = chromeMock;
  return require(backgroundPath);
}

const warnings = [];
const originalConsoleError = console.error;
console.error = (message) => warnings.push(message);

const chromeMock = {
  runtime: {
    onInstalled: { addListener: () => {} },
    onStartup: { addListener: () => {} },
    openOptionsPage: () => {},
    lastError: null
  },
  tabs: {
    create: () => {}
  },
  contextMenus: {
    onClicked: { addListener: () => {} },
    removeAll(callback) {
      callback();
    },
    create(menu, callback) {
      callback();
    }
  }
};

const backgroundModule = loadBackgroundWithChrome(chromeMock);

assert.equal(backgroundModule.MAX_SELECTION_LENGTH, 256);
assert.equal(backgroundModule.sanitizeSelection('  Test User  '), 'Test User');
assert.equal(
  backgroundModule.buildLookupUrl('last-name-lookup', 'User'),
  'https://directory.temple.edu/?FN=&LN=User'
);

chromeMock.runtime.lastError = { message: 'removeAll failed' };
backgroundModule.registerContextMenus();
assert.equal(warnings[0], 'Failed to clear context menus: removeAll failed');

chromeMock.runtime.lastError = null;
chromeMock.contextMenus.create = (menu, callback) => {
  if (menu.id === 'first-name-lookup') {
    chromeMock.runtime.lastError = { message: 'create failed' };
  } else {
    chromeMock.runtime.lastError = null;
  }
  callback();
  chromeMock.runtime.lastError = null;
};
backgroundModule.registerContextMenus();
assert.equal(
  warnings[1],
  'Failed to register context menu (first-name-lookup): create failed'
);

console.error = originalConsoleError;
global.chrome = originalChrome;

console.log('background exports tests passed');
