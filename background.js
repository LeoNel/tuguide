function openDirectoryTab(url) {
  chrome.tabs.create({ url: url });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "last-name-lookup",
    title: "Last Name Lookup",
    contexts: ["page", "selection", "image", "link"]
  });

  chrome.contextMenus.create({
    id: "first-name-lookup",
    title: "First Name Lookup",
    contexts: ["page", "selection", "image", "link"]
  });

  chrome.contextMenus.create({
    id: "open-options",
    title: "Options",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "last-name-lookup") {
    let postUrl = "https://directory.temple.edu/?FN=&LN=";

    if (info.selectionText) {
      postUrl += encodeURI(info.selectionText);
    }

    openDirectoryTab(postUrl);
  }

  if (info.menuItemId === "first-name-lookup") {
    let postUrl = "https://directory.temple.edu/?FN=";

    if (info.selectionText) {
      postUrl += encodeURI(info.selectionText) + "&LN=";
    }

    openDirectoryTab(postUrl);
  }

  if (info.menuItemId === "open-options") {
    openDirectoryTab("options.html");
  }
});
