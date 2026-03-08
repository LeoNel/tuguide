const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

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
    const optionsConsoleErrors = [];
    optionsPage.on('console', (message) => {
      if (message.type() === 'error') {
        optionsConsoleErrors.push(message.text());
      }
    });

    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    const optionsTitle = await optionsPage.textContent('h1');
    assert.match(optionsTitle || '', /TU Guide/);
    assert.deepEqual(optionsConsoleErrors, []);

    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/news.html`);
    const popupTitle = await popupPage.textContent('h1');
    assert.match(popupTitle || '', /Temple Campus News/);

    const statusText = await popupPage.textContent('#feedStatus');
    assert.match(
      statusText || '',
      /Loading|Showing|No campus news|Could not load/
    );

    console.log('e2e smoke tests passed');
  } finally {
    await context.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
