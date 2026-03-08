const FEED_URL = 'https://news.temple.edu/rss/news/topics/campus-news';
const MAX_ITEMS = 10;
const REQUEST_TIMEOUT_MS = 10000;

function ensureHttps(url) {
  const parsed = new URL(url);

  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed.');
  }

  return parsed.toString();
}

function getItemDescription(item) {
  const description = item.querySelector('description');
  if (!description || !description.textContent) {
    return '';
  }

  return description.textContent.trim();
}

function buildFeedNodes(channel, items, documentObject = document) {
  const fragment = documentObject.createDocumentFragment();
  const channelTitle =
    channel.querySelector('title')?.textContent?.trim() ?? 'Temple News';

  const list = documentObject.createElement('ul');
  list.className = 'news-list';

  for (const item of items) {
    const title =
      item.querySelector('title')?.textContent?.trim() ?? 'Untitled';
    const rawLink = item.querySelector('link')?.textContent?.trim() ?? FEED_URL;
    const description = getItemDescription(item);

    let safeLink = FEED_URL;
    try {
      safeLink = ensureHttps(rawLink);
    } catch {
      safeLink = FEED_URL;
    }

    const listItem = documentObject.createElement('li');
    listItem.className = 'news-item';

    const anchor = documentObject.createElement('a');
    anchor.className = 'news-link';
    anchor.href = safeLink;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.title = 'Open story in new tab';
    anchor.textContent = title;
    listItem.append(anchor);

    if (description) {
      const descriptionNode = documentObject.createElement('p');
      descriptionNode.className = 'news-description';
      descriptionNode.textContent = description;
      listItem.append(descriptionNode);
    }

    list.append(listItem);
  }

  const source = documentObject.createElement('p');
  source.className = 'feed-source';
  source.textContent = `Source: ${channelTitle}`;

  fragment.append(list, source);
  return fragment;
}

function setStatus(message, tone = 'info', documentObject = document) {
  const feedStatus = documentObject.getElementById('feedStatus');
  if (!feedStatus) {
    return;
  }

  const isError = tone === 'error';
  feedStatus.textContent = message;
  feedStatus.dataset.tone = tone;
  feedStatus.setAttribute('aria-live', isError ? 'assertive' : 'polite');
  feedStatus.setAttribute('role', isError ? 'alert' : 'status');
}

function setRetryVisible(isVisible, documentObject = document) {
  const retryButton = documentObject.getElementById('retryButton');
  if (retryButton) {
    retryButton.hidden = !isVisible;
  }
}

function setContainerState(container, busy) {
  container.setAttribute('aria-busy', busy ? 'true' : 'false');
}

function renderStateMessage(container, message, documentObject = document) {
  const paragraph = documentObject.createElement('p');
  paragraph.className = 'state-message';
  paragraph.textContent = message;
  container.replaceChildren(paragraph);
}

async function fetchWithTimeout(url, timeoutMs, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseFeedDocument(xmlText, parser = new DOMParser()) {
  const xml = parser.parseFromString(xmlText, 'application/xml');
  const parserError = xml.querySelector('parsererror');

  if (parserError) {
    throw new Error('Feed response could not be parsed.');
  }

  const channel = xml.querySelector('rss > channel');

  if (!channel) {
    throw new Error('Invalid RSS payload.');
  }

  const entries = [...channel.querySelectorAll('item')].slice(0, MAX_ITEMS);
  return { channel, entries };
}

async function renderFeed(deps = {}) {
  const documentObject = deps.documentObject || document;
  const fetchImpl = deps.fetchImpl || fetch;
  const parser = deps.parser || new DOMParser();
  const container = documentObject.getElementById('feedRegion');

  if (!container) {
    return { ok: false, reason: 'missing-container' };
  }

  container.replaceChildren();
  setContainerState(container, true);
  setStatus('Loading latest campus news…', 'info', documentObject);
  setRetryVisible(false, documentObject);

  try {
    const secureFeedUrl = ensureHttps(FEED_URL);
    const response = await fetchWithTimeout(
      secureFeedUrl,
      REQUEST_TIMEOUT_MS,
      fetchImpl
    );

    if (!response.ok) {
      throw new Error(`Feed request failed with status ${response.status}.`);
    }

    const xmlText = await response.text();
    const { channel, entries } = parseFeedDocument(xmlText, parser);

    if (!entries.length) {
      setStatus(
        'No campus news is currently available.',
        'empty',
        documentObject
      );
      renderStateMessage(
        container,
        'Check back again later for updates.',
        documentObject
      );
      return { ok: true, count: 0 };
    }

    setStatus(
      `Showing ${entries.length} recent stories.`,
      'success',
      documentObject
    );
    container.replaceChildren(buildFeedNodes(channel, entries, documentObject));

    const firstLink = container.querySelector('.news-link');
    if (firstLink) {
      firstLink.focus();
    }

    return { ok: true, count: entries.length };
  } catch (error) {
    const message =
      error?.name === 'AbortError'
        ? 'Feed request timed out.'
        : error?.message || 'Unable to load feed.';

    setStatus(
      `Could not load campus news: ${message}`,
      'error',
      documentObject
    );
    setRetryVisible(true, documentObject);
    renderStateMessage(
      container,
      'Please check your connection and try again.',
      documentObject
    );

    const feedStatus = documentObject.getElementById('feedStatus');
    if (feedStatus) {
      feedStatus.focus();
    }

    return { ok: false, message };
  } finally {
    setContainerState(container, false);
  }
}

function setupPopup() {
  const retryButton = document.getElementById('retryButton');
  if (retryButton) {
    retryButton.addEventListener('click', () => {
      renderFeed();
    });
  }

  renderFeed();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', setupPopup);
}

if (typeof module !== 'undefined') {
  module.exports = {
    ensureHttps,
    setStatus,
    parseFeedDocument,
    renderFeed,
    buildFeedNodes
  };
}
