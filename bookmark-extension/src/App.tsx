import "./App.css";
import { useCallback, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Listlog } from "./components/Listlog";
import { CompileDate } from "./components/CompileDate";

function App() {
  // ブックマークのツリーの状態保存
  const [bookmarks, setBookmarks] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([]);

  // 現在のフォルダの取得
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // パスを保存
  const [currentPathArray, setCurrentPathArray] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([]);

  // 使用回数の少ないもの
  const lowFolderId = "low-folder";

  // 期限設定のモード切り替え
  const [modalMode, setmodalMode] = useState<"compile" | null>(null);

  // チェックボックスの状態保存
  const [checkState, setcheckState] = useState<string[]>([]);

  // データ保存用
  type bookmarkRecord = {
    count?: number;
    date?: string;
  };
  const [data, setData] = useState<Record<string, bookmarkRecord>>({});

  // データ更新用
  type BookmarkMessage = { message: string };

  // フォルダとブックマーク単体のオブジェクトを確認
  const findNodeById = useCallback(
    (
      tree: chrome.bookmarks.BookmarkTreeNode[],
      id: string
    ): chrome.bookmarks.BookmarkTreeNode | null => {
      for (const node of tree) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNodeById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  // ブックマーク取得、一覧表示
  const refreshBookmarks = useCallback((): void => {
    chrome.bookmarks.getTree((nodes) => {
      const children = nodes[0].children ?? [];
      setBookmarks(children);
      if (!currentFolderId) {
        setCurrentFolderId(children[0]?.id || null);
      }
    });
  }, [currentFolderId]);

  // 削除されたとき専用、ブックマーク取得、一覧表示
  const refreshBookmarksOnRemove = useCallback((): void => {
    chrome.bookmarks.getTree((nodes) => {
      const children = nodes[0].children ?? [];
      setBookmarks(children);
      if (currentFolderId) {
        let newFolderId = currentFolderId;
        let newPathArray = [...currentPathArray];
        let exist = findNodeById(children, currentFolderId);
        while (!exist && currentFolderId !== lowFolderId) {
          if (newPathArray.length > 1) {
            const parent = newPathArray[newPathArray.length - 2];
            newFolderId = parent.id;
            newPathArray = newPathArray.slice(0, -1);
            exist = findNodeById(children, newFolderId);
          } else {
            break;
          }
        }
        if (exist) {
          setCurrentFolderId(newFolderId);
        } else {
          setCurrentFolderId(children[0]?.id || null);
        }
      } else {
        setCurrentFolderId(children[0]?.id || null);
      }
    });
  }, [currentFolderId, currentPathArray, findNodeById]);

  // スクロールリセット
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentFolderId]);

  useEffect(() => {
    // ブックマーク取得、ブックマークに変更があった場合の取得
    refreshBookmarks();
    const handler = (msg: BookmarkMessage) => {
      if (msg.message === "BOOKMARK_REMOVED") {
        refreshBookmarksOnRemove();
      } else if (msg.message === "BOOKMARK_UPDATED") {
        refreshBookmarks();
      }
    };

    chrome.runtime.onMessage.addListener(handler);

    // データ呼び出し
    chrome.storage.local.get("data", (result) => {
      setData(result.data || {});
    });

    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, [refreshBookmarks, refreshBookmarksOnRemove]);

  // パスを求める
  useEffect(() => {
    function currentPath(
      tree: chrome.bookmarks.BookmarkTreeNode[],
      id: string | null
    ): chrome.bookmarks.BookmarkTreeNode[] {
      for (const node of tree) {
        if (node.id === id) {
          return [node];
        }
        if (node.children) {
          const found = currentPath(node.children, id);
          if (found.length > 0) return [node, ...found];
        }
      }
      return [];
    }
    if (currentFolderId !== null) {
      if (currentFolderId === lowFolderId) {
        setCurrentPathArray([
          {
            id: lowFolderId,
            title: "使用回数の少ないもの",
          } as chrome.bookmarks.BookmarkTreeNode,
        ]);
      } else {
        const pathArray = currentPath(bookmarks, currentFolderId);
        setCurrentPathArray(pathArray);
      }
    }
  }, [currentFolderId, bookmarks]);

  // ツリーから指定フォルダ探す関数
  function findFolderById(
    tree: chrome.bookmarks.BookmarkTreeNode[],
    id: string | null
  ): chrome.bookmarks.BookmarkTreeNode[] {
    if (id === null) return tree;
    for (const node of tree) {
      if (node.id === id) return node.children || [];
      if (node.children) {
        const found = findFolderById(node.children, id);
        if (found.length > 0) return found;
      }
    }
    return [];
  }
  const currentFolderChildren = findFolderById(bookmarks, currentFolderId);

  // 指定したノードから、そのノード自身と子孫ノードすべての id を再帰的に集める
  function collectIdsFromNode(
    node: chrome.bookmarks.BookmarkTreeNode
  ): string[] {
    const ids: string[] = [node.id];
    if (node.children) {
      for (const child of node.children) {
        ids.push(...collectIdsFromNode(child));
      }
    }
    return ids;
  }

  // クリック数をカウント
  function clickCount(id: string): void {
    const newCounts = { ...data };
    newCounts[id] = newCounts[id] || { count: 0, date: undefined };
    newCounts[id].count = (newCounts[id].count || 0) + 1;
    saveData(newCounts);
  }

  // 拡張機能内でのクリック数で並び替え
  function sortBookmarks(
    tree: chrome.bookmarks.BookmarkTreeNode[]
  ): chrome.bookmarks.BookmarkTreeNode[] {
    const sortCount = [...tree];
    return sortCount.sort((bookmark1, bookmark2) => {
      const countA = data[bookmark1.id]?.count || 0;
      const countB = data[bookmark2.id]?.count || 0;
      return countB - countA;
    });
  }

  // 使用回数が3回以下、期限が決まってないものを抽出(フォルダは除外)
  function countLow(
    data: Record<string, bookmarkRecord>,
    bookmarks: chrome.bookmarks.BookmarkTreeNode[]
  ): chrome.bookmarks.BookmarkTreeNode[] {
    const lowlist = [];
    for (const node of bookmarks) {
      if (node.children) {
        const lowchildren = countLow(data, node.children);
        lowlist.push(...lowchildren);
      } else {
        const count = data[node.id]?.count ?? 0;
        if (count <= 3 && data[node.id]?.date === undefined) {
          lowlist.push(node);
        }
      }
    }
    return lowlist;
  }

  // チェックボックスの状態を保存
  function changeState(id: string, state: boolean): void {
    const node = findNodeById(bookmarks, id);
    const idsToToggle = node ? collectIdsFromNode(node) : [id];
    setcheckState((prev) => {
      if (state) {
        const merged = [...prev, ...idsToToggle];
        return Array.from(new Set(merged));
      } else {
        return prev.filter((item) => !idsToToggle.includes(item));
      }
    });
  }

  // ブックマーク削除
  async function delete_bookmark(id_list: string[]): Promise<void> {
    if (id_list.length === 0) {
      return;
    } else {
      const confirmation = window.confirm(
        "本当に削除しますか?\n(フォルダを選んでいる場合は中身が未チェックでも中身も全て削除されます。)"
      );
      if (!confirmation) return;
      if (confirmation) {
        // 二重削除防止
        let filteredIds = [...id_list];
        for (const id of id_list) {
          if (!filteredIds.includes(id)) continue;
          const [node] = await chrome.bookmarks.getSubTree(id);
          if (!node) continue;
          if (node.children) {
            const subIds: string[] = [];
            subIds.push(...collectIdsFromNode(node));
            filteredIds = filteredIds.filter(
              (sid) => sid === id || !subIds.includes(sid)
            );
          }
        }
        await Promise.all(
          filteredIds.map((id) =>
            chrome.bookmarks
              .removeTree(id)
              .catch((e) => console.error("削除失敗", e))
          )
        );
        await setcheckState([]);
      }
    }
  }

  // 期限設定切り替え
  const renderModal = () => {
    if (modalMode === "compile") {
      return (
        <CompileDate
          selectedId={checkState}
          onSave={(selectedId, date) => {
            date_bookmark(selectedId, date);
          }}
          onClose={() => setmodalMode(null)}
        />
      );
    }
    return null;
  };

  // ブックマーク期限設定
  function date_bookmark(id_list: string[], dateData: string): void {
    const newDate = { ...data };
    for (const id of id_list) {
      newDate[id] = newDate[id] || { count: 0, date: undefined };
      newDate[id].date = dateData;
    }
    setcheckState([]);
    saveData(newDate);
  }

  // ブックマーク期限設定削除
  function delete_date(id_list: string[]): void {
    const newDate = { ...data };
    for (const id of id_list) {
      newDate[id] = newDate[id] || { count: 0, date: undefined };
      newDate[id].date = undefined;
    }
    setcheckState([]);
    saveData(newDate);
  }

  // データ保存
  function saveData(newData: typeof data) {
    setData(newData);
    chrome.storage.local.set({ data: newData });
  }

  return (
    <>
      <Header
        onDelete_Bookmark={() => delete_bookmark(checkState)}
        onSetmodalMode={() => setmodalMode("compile")}
        onDelete_date={() => delete_date(checkState)}
      />
      <Sidebar
        bookmarks={bookmarks}
        lowlistLength={countLow(data, bookmarks).length}
        onSidebarClick={(id) => {
          if (id === "lowlist") {
            setCurrentFolderId(lowFolderId);
          } else {
            setCurrentFolderId(id);
          }
        }}
      />
      <Listlog path={currentPathArray} onlog={setCurrentFolderId} />
      <div className="list">
        <ul>
          {currentFolderId === lowFolderId
            ? sortBookmarks(countLow(data, bookmarks)).map((bookmark) => (
                <li key={bookmark.id}>
                  <input
                    className="check"
                    type="checkbox"
                    checked={checkState.includes(bookmark.id)}
                    onChange={(event) => {
                      changeState(bookmark.id, event.target.checked);
                    }}
                  />
                  <a
                    role="link"
                    onClick={() => {
                      clickCount(bookmark.id);
                      chrome.tabs.create({ url: bookmark.url });
                    }}
                  >
                    <div>{bookmark.title}</div>
                    <div className="bookmark-detail">
                      {data[bookmark.id]?.count || 0}回使用 削除日：
                      {data[bookmark.id]?.date || "未設定"}
                    </div>
                  </a>
                </li>
              ))
            : sortBookmarks(currentFolderChildren).map((bookmark) => (
                <li key={bookmark.id}>
                  <input
                    className="check"
                    type="checkbox"
                    checked={checkState.includes(bookmark.id)}
                    onChange={(event) => {
                      changeState(bookmark.id, event.target.checked);
                    }}
                  />
                  {bookmark.children ? (
                    <div
                      role="button"
                      onClick={() => {
                        setCurrentFolderId(bookmark.id);
                        clickCount(bookmark.id);
                      }}
                    >
                      <div>📁 {bookmark.title}</div>
                      <div className="bookmark-detail">
                        削除日：{data[bookmark.id]?.date || "未設定"}
                      </div>
                    </div>
                  ) : (
                    <a
                      role="link"
                      onClick={() => {
                        clickCount(bookmark.id);
                        chrome.tabs.create({ url: bookmark.url });
                      }}
                    >
                      <div>{bookmark.title}</div>
                      <div className="bookmark-detail">
                        {data[bookmark.id]?.count || 0}回使用 削除日：
                        {data[bookmark.id]?.date || "未設定"}
                      </div>
                    </a>
                  )}
                </li>
              ))}
        </ul>
      </div>
      {renderModal()}
    </>
  );
}

export default App;
