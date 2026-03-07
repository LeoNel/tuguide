const MAX_SELECTION_LENGTH = 256;

function sanitizeSelection(selectionText) {
  if (typeof selectionText !== "string") {
    return "";
  }

  return selectionText
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SELECTION_LENGTH);
}

function buildLookupUrl(type, selectionText) {
  const cleanedSelection = sanitizeSelection(selectionText);
  const encodedSelection = encodeURIComponent(cleanedSelection);

  if (type === "last-name-lookup") {
    return `https://directory.temple.edu/?FN=&LN=${encodedSelection}`;
  }

  if (type === "first-name-lookup") {
    return `https://directory.temple.edu/?FN=${encodedSelection}&LN=`;
  }

  return "";
}

function openDirectoryTab(url) {
  chrome.tabs.create({ url });
}

if (typeof chrome !== "undefined" && chrome.runtime && chrome.contextMenus) {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "last-name-lookup",
      title: "Last Name Lookup",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "first-name-lookup",
      title: "First Name Lookup",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "open-options",
      title: "Options",
      contexts: ["action"]
    });
  });

  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === "last-name-lookup") {
      openDirectoryTab(buildLookupUrl("last-name-lookup", info.selectionText));
    }

    if (info.menuItemId === "first-name-lookup") {
      openDirectoryTab(buildLookupUrl("first-name-lookup", info.selectionText));
    }

    if (info.menuItemId === "open-options") {
      openDirectoryTab("options.html");
    }
  });
}

if (typeof module !== "undefined") {
  module.exports = {
    MAX_SELECTION_LENGTH,
    sanitizeSelection,
    buildLookupUrl
  };
}
