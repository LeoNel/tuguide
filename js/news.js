const FEED_URL = "https://news.temple.edu/rss/news/topics/campus-news";
const MAX_ITEMS = 10;

function escapeHtml(input) {
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

function ensureHttps(url) {
  const parsed = new URL(url);

  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed.");
  }

  return parsed.toString();
}

function getItemDescription(item) {
  const description = item.querySelector("description");
  if (!description || !description.textContent) {
    return "";
  }

  return description.textContent.trim();
}

function buildFeedMarkup(channel, items) {
  const channelTitle = channel.querySelector("title")?.textContent?.trim() ?? "Temple News";

  let markup = '<ul class="news-list">';

  for (const item of items) {
    const title = item.querySelector("title")?.textContent?.trim() ?? "Untitled";
    const link = item.querySelector("link")?.textContent?.trim() ?? FEED_URL;
    const description = getItemDescription(item);

    markup += '<li class="news-item">';
    markup += `<a class="news-link" href="${escapeHtml(link)}" title="Open story in new tab">${escapeHtml(title)}</a>`;

    if (description) {
      markup += `<p class="news-description">${escapeHtml(description)}</p>`;
    }

    markup += "</li>";
  }

  markup += "</ul>";
  markup += `<p class="feed-source">Source: ${escapeHtml(channelTitle)}</p>`;

  return markup;
}

function setStatus(message, tone = "info") {
  const feedStatus = document.getElementById("feedStatus");
  if (!feedStatus) {
    return;
  }

  feedStatus.textContent = message;
  feedStatus.dataset.tone = tone;
}

function setRetryVisible(isVisible) {
  const retryButton = document.getElementById("retryButton");
  if (retryButton) {
    retryButton.hidden = !isVisible;
  }
}

async function renderFeed() {
  const container = document.getElementById("feedRegion");

  if (!container) {
    return;
  }

  container.innerHTML = "";
  setStatus("Loading latest campus news…", "info");
  setRetryVisible(false);

  try {
    const secureFeedUrl = ensureHttps(FEED_URL);
    const response = await fetch(secureFeedUrl, { method: "GET", cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Feed request failed with status ${response.status}.`);
    }

    const xmlText = await response.text();
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");
    const parserError = xml.querySelector("parsererror");

    if (parserError) {
      throw new Error("Feed response could not be parsed.");
    }

    const channel = xml.querySelector("rss > channel");

    if (!channel) {
      throw new Error("Invalid RSS payload.");
    }

    const entries = [...channel.querySelectorAll("item")].slice(0, MAX_ITEMS);

    if (!entries.length) {
      setStatus("No campus news is currently available.", "empty");
      container.innerHTML = '<p class="state-message">Check back again later for updates.</p>';
      return;
    }

    setStatus(`Showing ${entries.length} recent stories.`, "success");
    container.innerHTML = buildFeedMarkup(channel, entries);

    for (const link of container.querySelectorAll("a")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  } catch (error) {
    const message = error?.message || "Unable to load feed.";
    setStatus(`Could not load campus news: ${message}`, "error");
    setRetryVisible(true);
    container.innerHTML = '<p class="state-message">Please check your connection and try again.</p>';
  }
}

function setupPopup() {
  const retryButton = document.getElementById("retryButton");
  if (retryButton) {
    retryButton.addEventListener("click", () => {
      renderFeed();
      retryButton.focus();
    });
  }

  renderFeed();
}

document.addEventListener("DOMContentLoaded", setupPopup);
