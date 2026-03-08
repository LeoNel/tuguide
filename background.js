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
const { registerMenus, createClickHandler } = contextMenus;

function openDirectoryTab(url) {
  chrome.tabs.create({ url });
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.contextMenus) {
  globalThis.__TU_GUIDE_DEBUG__ = {
    registeredMenuItems: []
  };

  chrome.runtime.onInstalled.addListener(() => {
    registerMenus((menu) => {
      globalThis.__TU_GUIDE_DEBUG__.registeredMenuItems.push(menu);
      chrome.contextMenus.create(menu);
    });
  });

  chrome.contextMenus.onClicked.addListener(
    createClickHandler(openDirectoryTab, buildLookupUrl)
  );

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === 'trigger-on-installed') {
      registerMenus((menu) => {
        globalThis.__TU_GUIDE_DEBUG__.registeredMenuItems.push(menu);
      });
    }
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    MAX_SELECTION_LENGTH,
    sanitizeSelection,
    buildLookupUrl
  };
}
