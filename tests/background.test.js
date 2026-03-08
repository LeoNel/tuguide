const assert = require('node:assert/strict');
const {
  MAX_SELECTION_LENGTH,
  sanitizeSelection,
  buildLookupUrl
} = require('../background.js');

assert.equal(MAX_SELECTION_LENGTH, 256);
assert.equal(sanitizeSelection('  Test User  '), 'Test User');
assert.equal(
  buildLookupUrl('last-name-lookup', 'User'),
  'https://directory.temple.edu/?FN=&LN=User'
);

console.log('background exports tests passed');
