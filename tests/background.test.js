const assert = require('node:assert/strict');
const {
  MAX_SELECTION_LENGTH,
  sanitizeSelection,
  buildLookupUrl
} = require('../background.js');

assert.equal(MAX_SELECTION_LENGTH, 256);

assert.equal(sanitizeSelection(undefined), '');
assert.equal(sanitizeSelection(null), '');
assert.equal(sanitizeSelection(42), '');

assert.equal(
  sanitizeSelection('  Alice\n\tSmith  '),
  'Alice Smith'
);

assert.equal(
  sanitizeSelection('A\u0000B\u001FC\u007FD'),
  'A B C D'
);

const longSelection = 'x'.repeat(MAX_SELECTION_LENGTH + 20);
assert.equal(sanitizeSelection(longSelection).length, MAX_SELECTION_LENGTH);

assert.equal(
  buildLookupUrl('last-name-lookup', 'O\'Connor & Sons'),
  "https://directory.temple.edu/?FN=&LN=O'Connor%20%26%20Sons"
);

assert.equal(
  buildLookupUrl('first-name-lookup', 'Jane/Doe?'),
  'https://directory.temple.edu/?FN=Jane%2FDoe%3F&LN='
);

assert.equal(
  buildLookupUrl('last-name-lookup', '   '),
  'https://directory.temple.edu/?FN=&LN='
);

assert.equal(buildLookupUrl('unknown', 'Alice'), '');

console.log('background tests passed');
