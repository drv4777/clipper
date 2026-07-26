# Clipper

A lightweight Chrome extension for saving highlighted text from any webpage — with notes, tags, and source tracking — so you can build a personal, searchable archive of quotes, ideas, and references without leaving your browser.

## Features

- **Save via right-click** — highlight any text on any page, right-click, and select "Save to Clipper"
- **Save via keyboard shortcut** — `Ctrl+Shift+S` (`Cmd+Shift+S` on Mac) saves the current selection without touching the mouse
- **Notes** — attach a short note to any clip at the time you save it
- **Freeform tags** — tag clips with any comma-separated labels; click a tag in the list to instantly filter by it
- **Search** — live filtering across both clip text and tags
- **Group by site** — toggle between a flat list and clips grouped by source domain
- **Export to Markdown** — download your entire clip collection as a single `.md` file, formatted with quotes, sources, notes, and tags
- **Copy to clipboard** — one-click copy of any saved clip's text

## How it works

- A background service worker listens for the right-click menu action and the keyboard shortcut, captures the selected text along with the page's URL and title, and saves it to `chrome.storage.local`.
- Each clip is stored under its own key (`clip_<id>`) rather than in one large array, which keeps storage operations fast and avoids hitting any single-item size limits.
- After saving, a small popup window opens so you can optionally attach a note and tags before it's finalized.
- The main extension popup reads all saved clips, and handles search, grouping, copying, deleting, and exporting — all client-side, with no external servers or APIs involved.

## Tech / APIs used

- Manifest V3
- `chrome.contextMenus` — right-click "Save to Clipper" action
- `chrome.commands` — keyboard shortcut support
- `chrome.scripting` — reads the current text selection when triggered via keyboard shortcut
- `chrome.storage.local` — persists all clip data locally
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
4. Click the Clipper icon in your toolbar to view, search, group, copy, or delete your saved clips
5. Use **Export Markdown** to download your full collection as a `.md` file

## Design notes / trade-offs

- **`chrome.storage.local` vs. `chrome.storage.sync`** — clips are currently stored locally only (per-device). `chrome.storage.sync` would allow clips to follow a user across devices signed into the same Chrome profile, but comes with strict quotas (100KB total, 8KB per item, 512 items max). The storage layer was intentionally kept simple for v1; switching to `sync` is a small, contained change since clips are already stored as individual keyed items rather than one large array.
- **No backend/database** — all data lives in the browser via the Storage API. This keeps the project dependency-free and easy to install, at the cost of clips not being backed up anywhere outside the local Chrome profile (export to Markdown is the current workaround for backup/portability).

## Possible future improvements

- Cross-device sync via `chrome.storage.sync`
- Edit notes/tags after saving (currently only settable at save time)
- Import previously exported Markdown files back into the extension
- Firefox/Edge compatibility (currently Chrome-only, Manifest V3)

## License

MIT
