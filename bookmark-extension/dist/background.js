// タブ
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "index.html" });
});

// 使い始めた時
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    const bookmarks = await getBookmarks();
    const data = await getData();
    const today = new Date().toISOString();
    const allIds = [];
    for (const node of bookmarks) {
      allIds.push(...collectIdsFromNode(node));
    }
    for (const id of allIds) {
      if (!data[id]) {
        data[id] = {};
      }
      if (!data[id].adddate) {
        data[id].adddate = today;
      }
    }
    await chrome.storage.local.set({ data: data });
  }
});

// ブックマーク更新時のメッセージ送信
function message(type) {
  chrome.runtime.sendMessage({ message: type }).catch((e) => {
    if (e.message?.includes("Receiving end does not exist")) {
      console.log("受信先なし", e);
    } else {
      console.error("sendMessageエラー:", e);
    }
  });
}

// 更新メッセージデバウンス
const debounceUpdate = (() => {
  let timer = null;
  return function () {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      message("BOOKMARK_UPDATED");
    }, 300);
  };
})();

// 削除更新デバウンス
const debounceRemove = (() => {
  let timer = null;
  return function () {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      message("BOOKMARK_REMOVED");
    }, 100);
  };
})();

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

// ゴミデータ削除デバウンス
const debounceRemoveDate = (() => {
  let timer = null;
  return function () {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      dataDelete();
    }, 20000);
  };
})();

// 追加日記録
async function fillMissingAddDate() {
  const tree = await getBookmarks();
  const data = await getData();
  const today = new Date().toISOString();
  function traverse(nodes) {
    for (const node of nodes) {
      if (!data[node.id]) data[node.id] = {};
      if (!data[node.id].adddate) {
        data[node.id].adddate = today;
      }
      if (node.children) traverse(node.children);
    }
  }
  traverse(tree);
  await chrome.storage.local.set({ data });
}

// 追加日記録デバウンス
const debounceAdddate = (() => {
  let timer = null;
  return function () {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fillMissingAddDate, 500);
  };
})();

// 更新イベント
chrome.bookmarks.onRemoved.addListener(async () => {
  debounceRemove();
  debounceRemoveDate();
});
chrome.bookmarks.onChanged.addListener(debounceUpdate);
chrome.bookmarks.onMoved.addListener(debounceUpdate);
chrome.bookmarks.onChildrenReordered.addListener(debounceUpdate);
chrome.bookmarks.onCreated.addListener(async () => {
  debounceUpdate();
  debounceAdddate();
});

// ロック機能
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
      } finally {
        await releaseLock();
      }
    }
  }
});

// ブックマーク取得
function getBookmarks() {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((result) => resolve(result));
  });
}

// データ取得
function getData() {
  return new Promise((resolve) => {
    chrome.storage.local.get("data", (result) => resolve(result.data || {}));
  });
}

// ブックマーク削除
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

// 日付をローカルに変更
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
  const today = nowDate(new Date());
  const keys = Object.keys(data);
  let subject = [];
  for (const dataId of keys) {
    if (!allIds.includes(dataId)) {
      continue;
    }
    if (!data[dataId].date) continue;
    const [y, m, d] = data[dataId].date.split("-").map(Number);
    const targetDate = new Date(y, m - 1, d);
    if (isNaN(targetDate.getTime())) continue;
    const deadline = nowDate(targetDate);
    if (today >= deadline) {
      subject.push(dataId);
    }
  }
  let filteredIds = [...subject];
  for (const id of subject) {
    if (!filteredIds.includes(id)) continue;
    const nodes = await chrome.bookmarks.getSubTree(id);
    if (!nodes || nodes.length === 0) continue;
    const node = nodes[0];
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
