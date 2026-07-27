# Clipper

A lightweight Chrome extension for saving highlighted text from any webpage — with notes, tags, and source tracking — so you can build a personal, searchable archive of quotes, ideas, and references without leaving your browser.

**Current version: 1.2**

## Features

- **Save via right-click** — highlight any text on any page, right-click, and select "Save to Clipper"
- **Save via keyboard shortcut** — `Ctrl+Shift+S` (`Cmd+Shift+S` on Mac) saves the current selection without touching the mouse
- **Notes** — attach a short note to any clip at the time you save it
- **Freeform tags** — tag clips with any comma-separated labels; click a tag in the list to instantly filter by it
- **Edit after saving** — update a clip's note or tags anytime via the Edit button, no need to get it right the first time
- **Search** — live filtering across both clip text and tags
- **Group by site** — toggle between a flat list and clips grouped by source domain
- **Export to Markdown** — download your entire clip collection as a single `.md` file, formatted with quotes, sources, notes, and tags
- **Import from Markdown** — bring a previously exported `.md` file back in; duplicate clips (matched by text + source URL) are automatically skipped
- **Delete all** — clear your entire collection at once, with a confirmation prompt to prevent accidental wipes
- **Live clip counter** — see your total saved clip count at a glance in the popup header
- **Copy to clipboard** — one-click copy of any saved clip's text
- **Live-updating popup** — edits, imports, and deletes reflect instantly without needing to close and reopen the popup

## How it works

- A background service worker listens for the right-click menu action and the keyboard shortcut, captures the selected text along with the page's URL and title, and saves it to `chrome.storage.sync`.
- Each clip is stored under its own key (`clip_<id>`) rather than in one large array, which keeps storage operations fast and avoids hitting any single-item size limits.
- After saving, a small popup window opens so you can optionally attach a note and tags before it's finalized. The same popup is reused for editing existing clips, pre-filled with their current note/tags.
- The main extension popup reads all saved clips, and handles search, grouping, copying, editing, deleting, importing, exporting, and the live clip count — all client-side, with no external servers or APIs involved.
- A `chrome.storage.onChanged` listener keeps the popup in sync with changes made from other windows (e.g. saving an edit in the note popup updates the main list immediately).

## Tech / APIs used

- Manifest V3
- `chrome.contextMenus` — right-click "Save to Clipper" action
- `chrome.commands` — keyboard shortcut support
- `chrome.scripting` — reads the current text selection when triggered via keyboard shortcut
- `chrome.storage.sync` — persists all clip data, synced across devices signed into the same Chrome profile
- `chrome.storage.onChanged` — keeps the popup UI live-updated across windows
- `chrome.downloads` — powers the Markdown export feature

## Installation (local / development)

1. Clone this repository
   ```bash
   git clone https://github.com/yourusername/clipper-extension.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `clipper-extension` folder
5. The Clipper icon should now appear in your extensions toolbar

## Usage

1. Highlight any text on a webpage
2. Right-click and choose **"Save to Clipper"**, or press `Ctrl+Shift+S` (`Cmd+Shift+S` on Mac)
3. Optionally add a note and/or tags in the popup that appears, then click **Save**
4. Click the Clipper icon in your toolbar to view, search, group, copy, edit, or delete your saved clips
5. Use **Export Markdown** to download your full collection as a `.md` file, or **Import Markdown** to bring one back in
6. Use **Delete All** to clear your collection entirely (confirmation required)

## Security notes

- All clip content (text, notes, tags, titles) is HTML-escaped before rendering, so a clip saved or imported from a page/file containing markup-like content can't execute as script in the popup.
- Clip source URLs are restricted to `http:`/`https:` only — this blocks dangerous schemes like `javascript:` or `data:` from being stored or rendered as clickable links, which matters most for the Markdown import path since that content originates from a file rather than a live page.
- Markdown imports are capped at 500 clips per file as a basic safety limit against malformed or unexpectedly large files.

## Design notes / trade-offs

- **`chrome.storage.sync`** — clips sync across devices signed into the same Chrome profile. This comes with Chrome's sync storage quotas (100KB total, 8KB per item, 512 items max), which is workable since each clip is stored as its own small keyed item rather than one large array. If quota becomes a limitation, switching to `chrome.storage.local` is a small, contained change.
- **No backend/database** — all data lives in the browser via the Storage API. This keeps the project dependency-free and easy to install, at the cost of clips not being backed up anywhere outside Chrome sync (Markdown export/import is the current workaround for manual backup/portability).
- **Imported clip dates aren't preserved** — the export format stores dates via `toLocaleDateString()`, a display format rather than a reliably reparseable one across locales, so imported clips are timestamped with the import time rather than their original save date.

## Possible future improvements

- Firefox/Edge compatibility (currently Chrome-only, Manifest V3)
- Bulk tag editing / rename a tag across all clips at once
- Sort options beyond newest-first (e.g. alphabetical, by domain)

## License

MIT
