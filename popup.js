// Tracks whether the clip list is currently grouped by source domain
let groupBySite = false;

/**
 * Fetches all saved clips from storage and returns them as an array,
 * sorted newest-first.
 *
 * Clips are stored as individual keys (e.g. "clip_172839...") rather than
 * one big array, so we grab everything in storage and filter down to just
 * the keys that belong to clips.
 */
async function getAllClips() {
  const all = await chrome.storage.sync.get(null); // null = get everything
  return Object.entries(all)
    .filter(([key]) => key.startsWith("clip_")) // ignore non-clip keys (e.g. pendingClipId)
    .map(([, value]) => value) // drop the key, keep just the clip object
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first
}

/**
 * Extracts a clean domain name from a full URL, for use in "group by site".
 * Falls back to "unknown" if the URL is malformed for any reason.
 */
function getDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}

/**
 * Escapes HTML special characters so clip text/notes/tags/titles can never
 * be interpreted as markup when inserted via innerHTML. Without this, a
 * clip saved from a page containing something like <img src=x onerror=...>
 * as selected text could execute arbitrary script in the popup.
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/**
 * Builds the DOM element for a single clip card: the quoted text, optional
 * note, tag pills, source link + date, and the Copy/Delete buttons.
 * Returns the element so the caller can decide where to insert it
 * (flat list vs. grouped-by-domain sections).
 */
function renderClip(clip) {
  const div = document.createElement("div");
  div.className = "clip";

  // Build tag pills as a string of <span> elements, one per tag
  const tagsHtml = (clip.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");

  div.innerHTML = `
    <p class="clip-text">"${escapeHtml(clip.text)}"</p>
    ${clip.note ? `<p class="clip-note">Note: ${escapeHtml(clip.note)}</p>` : ""}
    ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ""}
    <div class="clip-meta">
      <a href="${encodeURI(clip.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(clip.title)}</a>
      <span>${new Date(clip.createdAt).toLocaleDateString()}</span>
    </div>
    <div class="clip-actions">
      <button class="copy-btn" data-id="${clip.id}">Copy</button>
      <button class="delete-btn" data-id="${clip.id}">Delete</button>
    </div>
  `;
  return div;
}

/**
 * Main render function: fetches clips, applies the search filter (if any),
 * and renders them either as a flat list or grouped by domain depending on
 * the groupBySite toggle. Re-attaches event handlers afterward since the
 * DOM was just rebuilt from scratch.
 */
async function loadClips(filter = "") {
  const clips = await getAllClips();
  const list = document.getElementById("clip-list");
  list.innerHTML = ""; // clear existing list before re-rendering

  const lowerFilter = filter.toLowerCase();

  // Search matches against both the clip text and any of its tags
  const filtered = filter
    ? clips.filter(c =>
        c.text.toLowerCase().includes(lowerFilter) ||
        (c.tags || []).some(t => t.toLowerCase().includes(lowerFilter))
      )
    : clips;

  // Show a friendly empty state if there's nothing to display
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">No clips yet. Highlight text on any page and right-click "Save to Clipper".</div>`;
    return;
  }

  if (groupBySite) {
    // Bucket clips by domain into an object: { "example.com": [clip, clip], ... }
    const groups = {};
    for (const clip of filtered) {
      const domain = getDomain(clip.url);
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(clip);
    }

    // Render each domain as a header followed by its clips, alphabetically sorted
    for (const domain of Object.keys(groups).sort()) {
      const header = document.createElement("div");
      header.className = "group-header";
      header.textContent = domain;
      list.appendChild(header);
      groups[domain].forEach(clip => list.appendChild(renderClip(clip)));
    }
  } else {
    // Flat list, no grouping
    filtered.forEach(clip => list.appendChild(renderClip(clip)));
  }

  // Buttons were just recreated in the DOM, so their listeners need to be reattached
  attachHandlers();
}

/**
 * Wires up click handlers for all interactive elements currently in the
 * clip list: delete, copy, and clicking a tag pill to filter by it.
 * Called every time loadClips() re-renders the list, since old elements
 * (and their listeners) were just wiped out by list.innerHTML = "".
 */
function attachHandlers() {
  // Delete: remove the clip's storage entry, then re-render
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      await chrome.storage.sync.remove(`clip_${id}`);
      loadClips(document.getElementById("search").value); // preserve current search
    });
  });

  // Copy: write the clip's text to the clipboard, with brief "Copied!" feedback
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const clips = await getAllClips();
      const clip = clips.find(c => c.id === id);
      if (clip) {
        await navigator.clipboard.writeText(clip.text);
        e.target.textContent = "Copied!";
        setTimeout(() => { e.target.textContent = "Copy"; }, 1200); // revert label after a moment
      }
    });
  });

  // Clicking a tag pill drops that tag into the search box, filtering to matching clips
  document.querySelectorAll(".tag").forEach(tagEl => {
    tagEl.addEventListener("click", () => {
      document.getElementById("search").value = tagEl.textContent;
      loadClips(tagEl.textContent);
    });
  });
}

// Live search-as-you-type: re-render the list on every keystroke
document.getElementById("search").addEventListener("input", (e) => {
  loadClips(e.target.value);
});

// Toggle between flat list and grouped-by-domain view
document.getElementById("group-toggle").addEventListener("click", (e) => {
  groupBySite = !groupBySite;
  e.target.textContent = groupBySite ? "Ungroup" : "Group by site";
  loadClips(document.getElementById("search").value); // preserve current search
});

// Export all clips as a single Markdown file and trigger a download
document.getElementById("export-btn").addEventListener("click", async () => {
  const clips = await getAllClips();

  // Build the Markdown content: one blockquote + metadata block per clip
  let md = "# Clipper Export\n\n";
  for (const clip of clips) {
    md += `> ${clip.text}\n\n`;
    md += `**Source:** [${clip.title}](${clip.url})  \n`;
    md += `**Date:** ${new Date(clip.createdAt).toLocaleDateString()}  \n`;
    if (clip.note) md += `**Note:** ${clip.note}  \n`;
    if (clip.tags?.length) md += `**Tags:** ${clip.tags.join(", ")}  \n`;
    md += "\n---\n\n"; // divider between clips
  }

  // Convert the string to a downloadable file via a Blob + object URL
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url,
    filename: "clipper-export.md",
    saveAs: true // prompts the user with a save dialog instead of silent-downloading
  });
});

// Initial render when the popup opens
loadClips();