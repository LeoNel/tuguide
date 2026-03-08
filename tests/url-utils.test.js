const assert = require('node:assert/strict');
const {
  MAX_SELECTION_LENGTH,
  sanitizeSelection,
  buildLookupUrl
} = require('../js/url-utils.js');

assert.equal(MAX_SELECTION_LENGTH, 256);

assert.equal(sanitizeSelection(undefined), '');
assert.equal(sanitizeSelection(null), '');
assert.equal(sanitizeSelection(42), '');

assert.equal(sanitizeSelection('  Alice\n\tSmith  '), 'Alice Smith');
assert.equal(sanitizeSelection('A\u0000B\u001FC\u007FD'), 'A B C D');

const longSelection = 'x'.repeat(MAX_SELECTION_LENGTH + 20);
assert.equal(sanitizeSelection(longSelection).length, MAX_SELECTION_LENGTH);

assert.equal(
  buildLookupUrl('last-name-lookup', "O'Connor & Sons"),
  "https://directory.temple.edu/?FN=&LN=O'Connor%20%26%20Sons"
);

assert.equal(
  buildLookupUrl('first-name-lookup', 'Jane/Doe?'),
  'https://directory.temple.edu/?FN=Jane%2FDoe%3F&LN='
);

assert.equal(
  buildLookupUrl('first-name-lookup', 'José Núñez'),
  'https://directory.temple.edu/?FN=Jos%C3%A9%20N%C3%BA%C3%B1ez&LN='
);

assert.equal(
  buildLookupUrl('last-name-lookup', 'a+b=c & d/e'),
  'https://directory.temple.edu/?FN=&LN=a%2Bb%3Dc%20%26%20d%2Fe'
);

assert.equal(buildLookupUrl('last-name-lookup', '   '), '');
assert.equal(buildLookupUrl('unknown', 'Alice'), '');

console.log('url utils tests passed');
