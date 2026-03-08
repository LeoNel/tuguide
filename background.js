let urlUtils;
let contextMenus;

if (typeof importScripts === 'function') {
  importScripts('js/url-utils.js', 'js/context-menus.js');
  urlUtils = globalThis.TUGuideUrlUtils;
  contextMenus = globalThis.TUGuideContextMenus;
} else {
  urlUtils = require('./js/url-utils.js');
  contextMenus = require('./js/context-menus.js');
}

const { MAX_SELECTION_LENGTH, sanitizeSelection, buildLookupUrl } = urlUtils;
const { createClickHandler } = contextMenus;

function openDirectoryTab(url) {
  if (!url) {
    return;
  }

  chrome.tabs.create({ url });
}

function openOptionsPage() {
  chrome.runtime.openOptionsPage();
}

function registerContextMenus() {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error(
        `Failed to clear context menus: ${chrome.runtime.lastError.message}`
      );
      return;
    }

    for (const menu of contextMenus.MENU_DEFINITIONS) {
      chrome.contextMenus.create(menu, () => {
        if (chrome.runtime.lastError) {
          console.error(
            `Failed to register context menu (${menu.id}): ${chrome.runtime.lastError.message}`
          );
        }
      });
    }
  });
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.contextMenus) {
  chrome.runtime.onInstalled.addListener(registerContextMenus);
  chrome.runtime.onStartup.addListener(registerContextMenus);

  chrome.contextMenus.onClicked.addListener(
    createClickHandler(openDirectoryTab, buildLookupUrl, openOptionsPage)
  );
}

if (typeof module !== 'undefined') {
  module.exports = {
    MAX_SELECTION_LENGTH,
    sanitizeSelection,
    buildLookupUrl,
    registerContextMenus
  };
}
