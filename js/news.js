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

function buildFeedNodes(channel, items) {
  const fragment = document.createDocumentFragment();
  const channelTitle =
    channel.querySelector('title')?.textContent?.trim() ?? 'Temple News';

  const list = document.createElement('ul');
  list.className = 'news-list';

  for (const item of items) {
    const title = item.querySelector('title')?.textContent?.trim() ?? 'Untitled';
    const rawLink = item.querySelector('link')?.textContent?.trim() ?? FEED_URL;
    const description = getItemDescription(item);

    let safeLink = FEED_URL;
    try {
      safeLink = ensureHttps(rawLink);
    } catch {
      safeLink = FEED_URL;
    }

    const listItem = document.createElement('li');
    listItem.className = 'news-item';

    const anchor = document.createElement('a');
    anchor.className = 'news-link';
    anchor.href = safeLink;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.title = 'Open story in new tab';
    anchor.textContent = title;
    listItem.append(anchor);

    if (description) {
      const descriptionNode = document.createElement('p');
      descriptionNode.className = 'news-description';
      descriptionNode.textContent = description;
      listItem.append(descriptionNode);
    }

    list.append(listItem);
  }

  const source = document.createElement('p');
  source.className = 'feed-source';
  source.textContent = `Source: ${channelTitle}`;

  fragment.append(list, source);
  return fragment;
}

function setStatus(message, tone = 'info') {
  const feedStatus = document.getElementById('feedStatus');
  if (!feedStatus) {
    return;
  }

  feedStatus.textContent = message;
  feedStatus.dataset.tone = tone;
}

function setRetryVisible(isVisible) {
  const retryButton = document.getElementById('retryButton');
  if (retryButton) {
    retryButton.hidden = !isVisible;
  }
}

function setContainerState(container, busy) {
  container.setAttribute('aria-busy', busy ? 'true' : 'false');
}

function renderStateMessage(container, message) {
  const paragraph = document.createElement('p');
  paragraph.className = 'state-message';
  paragraph.textContent = message;
  container.replaceChildren(paragraph);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function renderFeed() {
  const container = document.getElementById('feedRegion');

  if (!container) {
    return;
  }

  container.replaceChildren();
  setContainerState(container, true);
  setStatus('Loading latest campus news…', 'info');
  setRetryVisible(false);

  try {
    const secureFeedUrl = ensureHttps(FEED_URL);
    const response = await fetchWithTimeout(secureFeedUrl, REQUEST_TIMEOUT_MS);

    if (!response.ok) {
      throw new Error(`Feed request failed with status ${response.status}.`);
    }

    const xmlText = await response.text();
    const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
    const parserError = xml.querySelector('parsererror');

    if (parserError) {
      throw new Error('Feed response could not be parsed.');
    }

    const channel = xml.querySelector('rss > channel');

    if (!channel) {
      throw new Error('Invalid RSS payload.');
    }

    const entries = [...channel.querySelectorAll('item')].slice(0, MAX_ITEMS);

    if (!entries.length) {
      setStatus('No campus news is currently available.', 'empty');
      renderStateMessage(container, 'Check back again later for updates.');
      return;
    }

    setStatus(`Showing ${entries.length} recent stories.`, 'success');
    container.replaceChildren(buildFeedNodes(channel, entries));
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'Feed request timed out.'
      : error?.message || 'Unable to load feed.';

    setStatus(`Could not load campus news: ${message}`, 'error');
    setRetryVisible(true);
    renderStateMessage(container, 'Please check your connection and try again.');
  } finally {
    setContainerState(container, false);
  }
}

function setupPopup() {
  const retryButton = document.getElementById('retryButton');
  if (retryButton) {
    retryButton.addEventListener('click', () => {
      renderFeed();
      retryButton.focus();
    });
  }

  renderFeed();
}

document.addEventListener('DOMContentLoaded', setupPopup);
