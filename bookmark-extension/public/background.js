chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "index.html" });
});
chrome.bookmarks.onChanged.addListener(() => {
  chrome.runtime.sendMessage({
    message: "BOOKMARK_UPDATED",
  });
});
chrome.bookmarks.onChildrenReordered.addListener(() => {
  chrome.runtime.sendMessage({ message: "BOOKMARK_UPDATED" });
});
chrome.bookmarks.onCreated.addListener(() => {
  chrome.runtime.sendMessage({
    message: "BOOKMARK_UPDATED",
  });
});
chrome.bookmarks.onMoved.addListener(() => {
  chrome.runtime.sendMessage({
    message: "BOOKMARK_UPDATED",
  });
});
chrome.bookmarks.onRemoved.addListener(() => {
  chrome.runtime.sendMessage({
    message: "BOOKMARK_UPDATED",
  });
});
