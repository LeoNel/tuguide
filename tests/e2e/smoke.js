const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const FEED_URL = 'https://news.temple.edu/rss/news/topics/campus-news';

async function run() {
  const extensionPath = path.join(__dirname, '..', '..');
  const context = await chromium.launchPersistentContext('', {
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  try {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }

    const extensionId = serviceWorker.url().split('/')[2];

    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    const optionsTitle = await optionsPage.textContent('h1');
    const manifestVersion = await optionsPage.evaluate(
      () => chrome.runtime.getManifest().version
    );
    const visibleVersion = await optionsPage.textContent('#extensionVersion');
    assert.match(optionsTitle || '', /TU Guide/);
    assert.equal((visibleVersion || '').trim(), manifestVersion);

    await context.route(FEED_URL, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/xml',
        body: `<?xml version="1.0"?><rss><channel><title>Temple News</title><item><title>Story</title><link>https://news.temple.edu/story</link><description>Desc</description></item></channel></rss>`
      });
    });

    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/news.html`);
    await popupPage.waitForSelector('.news-link');
    const attrs = await popupPage.getAttribute('.news-link', 'rel');
    const target = await popupPage.getAttribute('.news-link', 'target');
    assert.equal(target, '_blank');
    assert.equal(attrs, 'noopener noreferrer');

    const retryHiddenOnSuccess = await popupPage.getAttribute(
      '#retryButton',
      'hidden'
    );
    assert.equal(retryHiddenOnSuccess, '');

    await context.unrouteAll({ behavior: 'ignoreErrors' });
    await context.route(FEED_URL, async (route) => {
      await route.fulfill({ status: 500, body: 'error' });
    });

    await popupPage.reload();
    await popupPage.waitForSelector('#retryButton:not([hidden])');
    const statusText = await popupPage.textContent('#feedStatus');
    assert.match(statusText || '', /Could not load campus news/);
    const statusRole = await popupPage.getAttribute('#feedStatus', 'role');
    const statusLive = await popupPage.getAttribute('#feedStatus', 'aria-live');
    assert.equal(statusRole, 'alert');
    assert.equal(statusLive, 'assertive');

    console.log('e2e smoke tests passed');
  } finally {
    await context.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
