// タブ
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "index.html" });
});

// 使い始めた時
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    const bookmarks = await getBookmarks();
    const data = await getData();
    const today = nowDate(new Date()).toISOString();
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

// ブックマーク更新
function message(type) {
  chrome.runtime.sendMessage({ message: type }).catch((e) => {
    console.log("受信先なし", e);
  });
}

// 追加日を記録の付け逃し防止
async function fillMissingAddDate() {
  console.log("追加日付け逃し確認開始");
  const tree = await getBookmarks();
  const data = await getData();
  const today = nowDate(new Date()).toISOString();
  function traverse(nodes) {
    for (const node of nodes) {
      if (!data[node.id]) data[node.id] = {};
      if (!data[node.id].adddate) {
        if (node.dateAdded) {
          data[node.id].adddate = nowDate(
            new Date(node.dateAdded)
          ).toISOString();
          console.log(
            "node.id=",
            node.id,
            "node.dateAdded=",
            node.dateAdded,
            "追加日付け逃し発見 dateAddedをつけます"
          );
        } else {
          data[node.id].adddate = today;
          console.log(
            "node.id=",
            node.id,
            "today=",
            today,
            "dateAddがなかったのでtodayをつけます"
          );
        }
      }
      if (node.children) traverse(node.children);
    }
  }
  traverse(tree);
  await chrome.storage.local.set({ data });
  console.log("追加日付け逃し確認完了");
}
const scheduleFill = (() => {
  let timer = null;
  return function () {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fillMissingAddDate, 2000);
  };
})();

chrome.bookmarks.onRemoved.addListener(() => message("BOOKMARK_REMOVED"));
chrome.bookmarks.onChanged.addListener(() => message("BOOKMARK_UPDATED"));
chrome.bookmarks.onMoved.addListener(() => message("BOOKMARK_UPDATED"));
chrome.bookmarks.onChildrenReordered.addListener(() =>
  message("BOOKMARK_UPDATED")
);
chrome.bookmarks.onCreated.addListener(async (id, node) => {
  await message("BOOKMARK_UPDATED");
  console.log("id=", id, "node=", node);
  const data = await getData();
  if (!data[id]) data[id] = {};
  if (!data[id].adddate) {
    data[id].adddate = nowDate(new Date(node.dateAdded)).toISOString();
  }
  await chrome.storage.local.set({ data });
  scheduleFill();
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
      console.log("起動直後の処理開始");
      await autoDelete();
      await dataDelete();
    } finally {
      await releaseLock();
      console.log("起動直後の処理終了");
    }
  }
});

// アラーム
chrome.alarms.create("autoAlarm", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "autoAlarm") {
    if (await tryLock()) {
      try {
        console.log("アラーム内の処理開始");
        await autoDelete();
        await dataDelete();
      } finally {
        await releaseLock();
        console.log("アラーム内の処理終了");
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
  console.log("自動削除確認開始");
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
    const targetDate = new Date(data[dataId].date);
    const deadline = nowDate(targetDate);
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
  console.log("自動削除確認終了");
}

// データ削除
async function dataDelete() {
  console.log("データ削除確認開始");
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
  console.log("データ削除確認完了");
}
