# Permissions minimization review (Ticket 2.3)

## Current permissions

### Extension permissions

- `contextMenus`
  - **Why needed:** Required to add the right-click lookup entries (`Last Name Lookup`, `First Name Lookup`) and the action menu item that opens extension options.
  - **Where used:** `chrome.contextMenus.create(...)` and `chrome.contextMenus.onClicked.addListener(...)` in `background.js`.
  - **Least-privilege note:** Permission list is intentionally locked to the baseline in `scripts/validate-manifest.js`.

### Host permissions

- `https://news.temple.edu/rss/news/topics/campus-news`
  - **Why needed:** Allows the popup (`news.html`) to request the official Temple campus news RSS feed.
  - **Where used:** `fetch(FEED_URL)` in `js/news.js`.
  - **Least-privilege note:** Scope is restricted to the exact RSS endpoint path; wildcard hosts and wildcard paths fail validation.

## CSP hardening policy

`manifest.json` enforces hardened extension-page CSP:

- `script-src 'self'`
- `object-src 'none'`
- `base-uri 'none'`
- `form-action 'none'`
- `connect-src https://news.temple.edu/rss/news/topics/campus-news`

Validation gates reject `unsafe-inline`, `unsafe-eval`, wildcard hosts, and permission drift from the least-privilege baseline.

## Policy scanner guardrails

`scripts/policy-scan.js` blocks:

- remote scripts, inline event handlers, `eval`, `new Function`
- risky DOM sinks (`innerHTML`, `outerHTML`, `insertAdjacentHTML`)
- dynamic script creation/injection patterns

If a known-safe exceptional pattern is required, a file line can be annotated with `policy-scan: allow` to suppress a single finding.

## Chrome Web Store (CWS) listing draft (permission justification)

> **Permission justification draft**
>
> TU Guide requests only one extension permission, `contextMenus`, to provide two quick lookup shortcuts from selected text and one action-menu shortcut to open extension options.
>
> TU Guide requests a single host permission for `https://news.temple.edu/rss/news/topics/campus-news` so the popup can load Temple's campus news RSS feed.
>
> TU Guide does **not** request broad tab-reading access (`tabs`) and does **not** request wildcard host access. All permissions are narrowly scoped to features visible to users.
