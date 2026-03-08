(function initUrlUtils(globalObject) {
  const MAX_SELECTION_LENGTH = 256;

  function sanitizeSelection(selectionText) {
    if (typeof selectionText !== 'string') {
      return '';
    }

    return selectionText
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_SELECTION_LENGTH);
  }

  function buildLookupUrl(type, selectionText) {
    const cleanedSelection = sanitizeSelection(selectionText);
    if (!cleanedSelection) {
      return '';
    }

    const encodedSelection = encodeURIComponent(cleanedSelection);

    if (type === 'last-name-lookup') {
      return `https://directory.temple.edu/?FN=&LN=${encodedSelection}`;
    }

    if (type === 'first-name-lookup') {
      return `https://directory.temple.edu/?FN=${encodedSelection}&LN=`;
    }

    return '';
  }

  const exported = {
    MAX_SELECTION_LENGTH,
    sanitizeSelection,
    buildLookupUrl
  };

  globalObject.TUGuideUrlUtils = exported;

  if (typeof module !== 'undefined') {
    module.exports = exported;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
