/*
Purpose: deterministic client-side search for Mullusi public docs.
Governance scope: static search-index loading, query matching, result rendering, and explicit failure state.
Dependencies: browser DOM APIs and /data/search-index.json.
Invariants: no backend dependency, no mutation outside the search view, and no silent index failure.
*/

const searchInput = document.querySelector("#docs-search");
const searchButton = document.querySelector("#docs-search-button");
const resultsRegion = document.querySelector("#results");

function normalizeQuery(value) {
  return value.trim().toLowerCase();
}

function entryMatchesQuery(entry, query) {
  const searchableText = [
    entry.title,
    entry.section,
    entry.summary,
    ...(entry.keywords || []),
  ].join(" ").toLowerCase();
  return searchableText.includes(query);
}

function createResultElement(entry) {
  const resultLink = document.createElement("a");
  resultLink.className = "result-card";
  resultLink.href = entry.url;

  const section = document.createElement("span");
  section.className = "card-kicker";
  section.textContent = entry.section;

  const title = document.createElement("h2");
  title.textContent = entry.title;

  const summary = document.createElement("p");
  summary.textContent = entry.summary;

  resultLink.append(section, title, summary);
  return resultLink;
}

function renderMessage(message) {
  if (resultsRegion === null) {
    return;
  }
  const messageElement = document.createElement("p");
  messageElement.className = "empty-state";
  messageElement.textContent = message;
  resultsRegion.replaceChildren(messageElement);
}

function renderResults(entries, query) {
  if (resultsRegion === null) {
    return;
  }
  if (query.length === 0) {
    renderMessage("Enter a term to search the docs index.");
    return;
  }
  const matchedEntries = entries.filter((entry) => entryMatchesQuery(entry, query));
  if (matchedEntries.length === 0) {
    renderMessage(`No docs matched "${query}".`);
    return;
  }
  resultsRegion.replaceChildren(...matchedEntries.map(createResultElement));
}

async function loadSearchEntries() {
  const response = await fetch("/data/search-index.json", { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`search_index_fetch_failed:${response.status}`);
  }
  const responsePayload = await response.json();
  if (!Array.isArray(responsePayload.entries)) {
    throw new Error("search_index_schema_invalid");
  }
  return responsePayload.entries;
}

async function initializeSearch() {
  if (!(searchInput instanceof HTMLInputElement) || resultsRegion === null) {
    return;
  }
  try {
    const searchEntries = await loadSearchEntries();
    const urlQuery = new URLSearchParams(window.location.search).get("q") || "";
    searchInput.value = urlQuery;
    renderResults(searchEntries, normalizeQuery(urlQuery));

    const executeSearch = () => {
      const query = normalizeQuery(searchInput.value);
      const nextUrl = query.length > 0 ? `/docs/search.html?q=${encodeURIComponent(query)}` : "/docs/search.html";
      window.history.replaceState({}, "", nextUrl);
      renderResults(searchEntries, query);
    };

    searchInput.addEventListener("input", executeSearch);
    if (searchButton !== null) {
      searchButton.addEventListener("click", executeSearch);
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "search_index_unknown_error";
    renderMessage(`Search index unavailable: ${reason}`);
  }
}

initializeSearch();
