// Fires when the user clicks "Save" in the note popup window
document.getElementById("save").addEventListener("click", async () => {
  const note = document.getElementById("note").value;
  const tagsInput = document.getElementById("tags").value;

  // Split comma-separated tag input into a clean array:
  // trim whitespace around each tag, drop any empty entries
  const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);

  // background.js stashed the id of the clip that was just saved
  // so this popup knows which clip to attach the note/tags to
  const { pendingClipId } = await chrome.storage.sync.get("pendingClipId");
  const key = `clip_${pendingClipId}`;

  // Fetch that specific clip by its storage key
  const { [key]: clip } = await chrome.storage.sync.get(key);

  if (clip) {
    // Update the clip in place with the note and tags just entered
    clip.note = note;
    clip.tags = tags;
    await chrome.storage.sync.set({ [key]: clip });
  }

  // Close this small popup window now that saving is done
  window.close();
});