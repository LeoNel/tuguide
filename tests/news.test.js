const assert = require('node:assert/strict');
const { parseFeedDocument } = require('../js/news.js');

const parserErrorParser = {
  parseFromString() {
    return {
      querySelector(selector) {
        if (selector === 'parsererror') {
          return { textContent: 'bad xml' };
        }
        return null;
      }
    };
  }
};

assert.throws(
  () => parseFeedDocument('<bad>', parserErrorParser),
  /could not be parsed/
);

const invalidPayloadParser = {
  parseFromString() {
    return {
      querySelector(selector) {
        if (selector === 'parsererror') {
          return null;
        }

        if (selector === 'rss > channel') {
          return null;
        }

        return null;
      }
    };
  }
};

assert.throws(
  () => parseFeedDocument('<rss></rss>', invalidPayloadParser),
  /Invalid RSS payload/
);

console.log('news parser tests passed');
