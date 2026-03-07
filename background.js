const MENU_IDS = {
  lastNameLookup: 'last-name-lookup',
  firstNameLookup: 'first-name-lookup',
  options: 'open-options'
};

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_IDS.lastNameLookup,
      title: 'Last Name Lookup',
      contexts: ['page', 'selection', 'image', 'link']
    });

    chrome.contextMenus.create({
      id: MENU_IDS.firstNameLookup,
      title: 'First Name Lookup',
      contexts: ['page', 'selection', 'image', 'link']
    });

    chrome.contextMenus.create({
      id: MENU_IDS.options,
      title: 'Options',
      contexts: ['selection']
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === MENU_IDS.lastNameLookup) {
    let postUrl = 'https://directory.temple.edu/?FN=&LN=';

    if (info.selectionText) {
      postUrl += encodeURI(info.selectionText);
    }

    chrome.tabs.create({ url: postUrl });
    return;
  }

  if (info.menuItemId === MENU_IDS.firstNameLookup) {
    let postUrl = 'https://directory.temple.edu/?FN=';

    if (info.selectionText) {
      postUrl += `${encodeURI(info.selectionText)}&LN=`;
    }

    chrome.tabs.create({ url: postUrl });
    return;
  }

  if (info.menuItemId === MENU_IDS.options) {
    chrome.tabs.create({ url: 'options.html' });
  }
});

createContextMenus();
