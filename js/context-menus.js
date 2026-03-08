(function initContextMenus(globalObject) {
  const MENU_DEFINITIONS = [
    {
      id: 'last-name-lookup',
      title: 'Last Name Lookup',
      contexts: ['selection']
    },
    {
      id: 'first-name-lookup',
      title: 'First Name Lookup',
      contexts: ['selection']
    },
    {
      id: 'open-options',
      title: 'Options',
      contexts: ['action']
    }
  ];

  function registerMenus(createContextMenu) {
    for (const menu of MENU_DEFINITIONS) {
      createContextMenu(menu);
    }
  }

  function createClickHandler(openDirectoryTab, buildLookupUrl) {
    return function onMenuClick(info) {
      if (info.menuItemId === 'last-name-lookup') {
        const url = buildLookupUrl('last-name-lookup', info.selectionText);
        openDirectoryTab(url);
      }

      if (info.menuItemId === 'first-name-lookup') {
        const url = buildLookupUrl('first-name-lookup', info.selectionText);
        openDirectoryTab(url);
      }

      if (info.menuItemId === 'open-options') {
        openDirectoryTab('options.html');
      }
    };
  }

  const exported = {
    MENU_DEFINITIONS,
    registerMenus,
    createClickHandler
  };

  globalObject.TUGuideContextMenus = exported;

  if (typeof module !== 'undefined') {
    module.exports = exported;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
