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
  const channelLink = channel.querySelector("link")?.textContent?.trim() ?? FEED_URL;

  let markup = `<div class="rssHeader"><a href="${escapeHtml(channelLink)}" title="${escapeHtml(channelTitle)}">${escapeHtml(channelTitle)}</a></div>`;
  markup += '<div class="rssBody"><ul>';

  for (const [index, item] of items.entries()) {
    const rowClass = index % 2 === 0 ? "odd" : "even";
    const title = item.querySelector("title")?.textContent?.trim() ?? "Untitled";
    const link = item.querySelector("link")?.textContent?.trim() ?? FEED_URL;
    const description = getItemDescription(item);

    markup += `<li class="rssRow ${rowClass}">`;
    markup += `<h4><a href="${escapeHtml(link)}" title="View this story">${escapeHtml(title)}</a></h4>`;

    if (description) {
      markup += `<p>${escapeHtml(description)}</p>`;
    }

    markup += "</li>";
  }

  markup += "</ul></div>";
  return markup;
}

async function renderFeed() {
  const container = document.getElementById("Content");

  try {
    const secureFeedUrl = ensureHttps(FEED_URL);
    const response = await fetch(secureFeedUrl, { method: "GET", cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Feed request failed with status ${response.status}.`);
    }

    const xmlText = await response.text();
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");
    const channel = xml.querySelector("rss > channel");

    if (!channel) {
      throw new Error("Invalid RSS payload.");
    }

    const entries = [...channel.querySelectorAll("item")].slice(0, MAX_ITEMS);

    if (!entries.length) {
      container.innerHTML = '<div class="rssError"><p>No campus news is currently available.</p></div>';
      return;
    }

    container.innerHTML = buildFeedMarkup(channel, entries);
    for (const link of container.querySelectorAll("a")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  } catch (error) {
    container.innerHTML = `<div class="rssError"><p>${escapeHtml(error.message || "Unable to load feed.")}</p></div>`;
  }
}

document.addEventListener("DOMContentLoaded", renderFeed);
