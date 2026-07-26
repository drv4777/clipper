/** This extension doesn't currently need a content script for its core
functionality, text selection is read via chrome.scripting.executeScript
on demand instead (see background.js). Kept as an empty file since it's
declared in manifest.json and could be used later for in-page features
 (e.g. a floating "save" button on text selection).*/