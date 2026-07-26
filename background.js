// Runs once when the extension is first installed (or updated).
// Sets up the right-click context menu item that appears whenever
// text is selected on any page.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-clipper",
    title: "Save to Clipper",
    contexts: ["selection"] // only show this menu item when text is highlighted
  });
});

/**
 * Creates a new clip object and saves it to storage, then opens the
 * note popup so the user can optionally attach a note/tags.
 * Shared by both the context menu and keyboard shortcut save paths,
 * since they both end up needing to do the exact same thing.
 */
async function saveClip(text, url, title) {
  const clip = {
    id: Date.now().toString(), // timestamp-based id, unique enough for this use case
    text,
    url,
    title,
    note: "",   // empty until the user fills in the note popup
    tags: [],   // empty until the user adds tags in the note popup
    createdAt: new Date().toISOString()
  };

  // Save the clip under its own key (e.g. "clip_1721938...")
  await chrome.storage.sync.set({ [`clip_${clip.id}`]: clip });

  // Remember which clip was just created, so note-popup.js knows
  // which one to update once the user submits a note/tags
  await chrome.storage.sync.set({ pendingClipId: clip.id });

  // Open the small popup window for adding an optional note/tags
  chrome.windows.create({
    url: "note-popup.html",
    type: "popup",
    width: 320,
    height: 200
  });
}

// Fires when the user clicks "Save to Clipper" in the right-click menu.
// info.selectionText is only available here because of contexts: ["selection"] above.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-to-clipper") {
    saveClip(info.selectionText, tab.url, tab.title);
  }
});

// Fires when the user presses the keyboard shortcut defined in manifest.json.
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-clip") {
    // Find the tab the user is currently looking at
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Keyboard commands don't come with selected text like context menu
    // clicks do, so we inject a small script into the page to read
    // whatever the user currently has highlighted
    const [{ result: selectedText }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });

    if (!selectedText) return; // nothing highlighted, so there's nothing to save

    saveClip(selectedText, tab.url, tab.title);
  }
});