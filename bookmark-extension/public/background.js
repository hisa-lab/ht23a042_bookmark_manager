// タブ
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "index.html" });
});

// ブックマーク更新
function message(type) {
  chrome.runtime.sendMessage({ message: type }).catch((e) => {
    console.log("受信先なし", e);
  });
}

chrome.bookmarks.onRemoved.addListener(() => message("BOOKMARK_REMOVED"));
chrome.bookmarks.onChanged.addListener(() => message("BOOKMARK_UPDATED"));
chrome.bookmarks.onCreated.addListener(() => message("BOOKMARK_UPDATED"));
chrome.bookmarks.onMoved.addListener(() => message("BOOKMARK_UPDATED"));
chrome.bookmarks.onChildrenReordered.addListener(() =>
  message("BOOKMARK_UPDATED")
);

// ロック機能
// ロック確認
async function tryLock() {
  const result = await chrome.storage.local.get("lock");
  const lock = result.lock || { locknow: false, startTime: 0 };
  if (lock.locknow) {
    const now = Date.now() - lock.startTime;
    if (now > 30000) {
      console.log("ロック強制解除");
      await chrome.storage.local.set({
        lock: { locknow: true, startTime: Date.now() },
      });
      return true;
    } else return false;
  } else {
    await chrome.storage.local.set({
      lock: { locknow: true, startTime: Date.now() },
    });
    return true;
  }
}
// ロック解除
async function releaseLock() {
  await chrome.storage.local.set({
    lock: { locknow: false, startTime: 0 },
  });
}

// 起動時
chrome.runtime.onStartup.addListener(async () => {
  if (await tryLock()) {
    try {
      await autoDelete();
      await dataDelete();
    } finally {
      await releaseLock();
    }
  }
});

// アラーム
chrome.alarms.create("autoAlarm", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "autoAlarm") {
    if (await tryLock()) {
      try {
        await autoDelete();
        await dataDelete();
      } finally {
        await releaseLock();
      }
    }
  }
});
function getBookmarks() {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((result) => resolve(result));
  });
}
function getData() {
  return new Promise((resolve) => {
    chrome.storage.local.get("data", (result) => resolve(result.data || {}));
  });
}
function removeBookmark(id) {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.removeTree(id, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}
// id収集
function collectIdsFromNode(node) {
  let ids = [node.id];
  if (node.children) {
    for (const children of node.children) {
      ids = ids.concat(collectIdsFromNode(children));
    }
  }
  return ids;
}

// 日付取得
function nowDate(now) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const nowDate = new Date(year, month, day);
  return nowDate;
}
// 自動削除
async function autoDelete() {
  const data = await getData();
  const bookmarks = await getBookmarks();
  const allIds = [];
  for (const node of bookmarks) {
    allIds.push(...collectIdsFromNode(node));
  }
  const now = new Date();
  const today = nowDate(now);
  const keys = Object.keys(data);
  let subject = [];
  for (const dataId of keys) {
    if (!allIds.includes(dataId)) {
      continue;
    }
    const targetDate = new Date(data[dataId].date);
    const deadline = nowDate(targetDate);
    console.log("確認:", dataId, "期限=", targetDate, "今日=", today);
    if (!isNaN(targetDate.getTime()) && today >= deadline) {
      subject.push(dataId);
    }
  }
  let filteredIds = [...subject];
  for (const id of subject) {
    if (!filteredIds.includes(id)) continue;
    const [node] = await chrome.bookmarks.getSubTree(id);
    if (!node) continue;
    if (node.children) {
      const subIds = [];
      subIds.push(...collectIdsFromNode(node));
      filteredIds = filteredIds.filter(
        (sid) => sid === id || !subIds.includes(sid)
      );
    }
  }
  for (const id of filteredIds) {
    await removeBookmark(id).catch((e) => console.error("削除失敗", e));
  }
}

// データ削除
async function dataDelete() {
  const data = await getData();
  const bookmarks = await getBookmarks();
  const keys = Object.keys(data);
  const allIds = [];
  for (const node of bookmarks) {
    allIds.push(...collectIdsFromNode(node));
  }
  for (const id of keys) {
    if (!allIds.includes(id)) {
      delete data[id];
    }
  }
  await chrome.storage.local.set({ data: data });
}
