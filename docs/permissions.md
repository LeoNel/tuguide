# Permissions minimization review (Ticket 2.3)

## Current permissions

### Extension permissions

- `contextMenus`
  - **Why needed:** Required to add the right-click lookup entries (`Last Name Lookup`, `First Name Lookup`) and the action menu item that opens extension options.
  - **Where used:** `chrome.contextMenus.create(...)` and `chrome.contextMenus.onClicked.addListener(...)` in `background.js`.
  - **Least-privilege note:** No broader permissions (for example `tabs`) are required for these menu features.

### Host permissions

- `https://news.temple.edu/rss/news/topics/campus-news`
  - **Why needed:** Allows the popup (`news.html`) to request the official Temple campus news RSS feed.
  - **Where used:** `fetch(FEED_URL)` in `js/news.js`.
  - **Least-privilege note:** Scope is restricted to the exact RSS endpoint path instead of a wildcard host.

## Removed permissions and rationale

- Removed `tabs` extension permission.
  - **Reason:** `chrome.tabs.create({ url })` is used only to open URLs, and this does not require full `tabs` read/access privileges.
  - **Risk reduction:** Eliminates access to sensitive tab metadata and page details.

- Removed `https://directory.temple.edu/*` host permission.
  - **Reason:** Directory URLs are opened directly in a tab and not fetched or inspected by extension scripts.
  - **Risk reduction:** No host access retained where it is not technically required.

## Chrome Web Store (CWS) listing draft (permission justification)

> **Permission justification draft**
>
> TU Guide requests only one extension permission, `contextMenus`, to provide two quick lookup shortcuts from selected text and one action-menu shortcut to open extension options.
>
> TU Guide requests a single host permission for `https://news.temple.edu/rss/news/topics/campus-news` so the popup can load Temple's campus news RSS feed.
>
> TU Guide does **not** request broad tab-reading access (`tabs`) and does **not** request wildcard host access. All permissions are narrowly scoped to features visible to users.
