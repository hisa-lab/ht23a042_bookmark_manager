import "./App.css";
import { useEffect, useState } from "react";
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

  // パンくずリスト用のパスを保存
  const [currentPathArray, setCurrentPathArray] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([]);

  // 削除設定の状態切り替え
  const [deleteMode, setdeleteMode] = useState<boolean>(false);

  // 期限設定の状態切り替え
  const [dateMode, setdateMode] = useState<boolean>(false);

  // 期限設定のモード切り替え
  const [modalMode, setmodalMode] = useState<"compile" | "dateDelete" | null>(
    null
  );

  // 削除チェックボックスの状態保存
  const [checkState, setcheckState] = useState<string[]>([]);

  // 期限設定チェックボックスの状態保存
  const [dateCheckState, setdateCheckState] = useState<string[]>([]);

  // データ保存用
  type bookmarkRecord = {
    count?: number;
    date?: string;
  };
  const [data, setData] = useState<Record<string, bookmarkRecord>>({});

  // データ更新用
  type BookmarkMessage = { message: string };

  useEffect(() => {
    // ブックマーク取得、ブックマークに変更があった場合の取得
    getBookmark();
    const handler = (message: BookmarkMessage) => {
      if (message.message === "BOOKMARK_UPDATED") {
        getBookmark();
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
  }, []);

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
      const pathArray = currentPath(bookmarks, currentFolderId);
      setCurrentPathArray(pathArray);
    }
  }, [currentFolderId, bookmarks]);

  // 削除設定、期限設定がfalseならチェック初期化
  useEffect(() => {
    if (deleteMode === false) {
      setcheckState([]);
    }
    if (dateMode === false) {
      setdateCheckState([]);
    }
  }, [deleteMode, dateMode]);

  // ブックマーク取得
  function getBookmark(): void {
    chrome.bookmarks.getTree((nodes) => {
      const children = nodes[0].children ?? [];
      setBookmarks(children);
      setCurrentFolderId(children[0]?.id);
    });
  }

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

  // フォルダとブックマーク単体のオブジェクトを確認
  function findNodeById(
    tree: chrome.bookmarks.BookmarkTreeNode[],
    id: string
  ): chrome.bookmarks.BookmarkTreeNode | null {
    for (const node of tree) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

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

  // モード変更
  function changeMode(mode: "delete" | "date") {
    if (mode === "delete") {
      if (deleteMode) {
        setdeleteMode(false);
      } else {
        setdeleteMode(true);
        setdateMode(false);
      }
    } else if (mode === "date") {
      if (dateMode) {
        setdateMode(false);
      } else {
        setdateMode(true);
        setdeleteMode(false);
      }
    }
  }

  // 削除チェックボックスの状態を保存
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

  // 期限設定チェックボックスの状態を保存
  function dateChangeState(id: string, state: boolean): void {
    const node = findNodeById(bookmarks, id);
    const idsToToggle = node ? collectIdsFromNode(node) : [id];
    setdateCheckState((prev) => {
      if (state) {
        const merged = [...prev, ...idsToToggle];
        return Array.from(new Set(merged));
      } else {
        return prev.filter((item) => !idsToToggle.includes(item));
      }
    });
  }

  // ブックマーク削除
  function delete_bookmark(id_list: string[]): void {
    if (id_list.length === 0) {
      window.alert("何も選択されていません。");
      return;
    } else {
      const confirmation = window.confirm(
        "本当に削除しますか?\n(フォルダを選んでいる場合は中身が未チェックでも中身も全て削除されます。)"
      );
      if (!confirmation) return;
      if (confirmation) {
        let deletion = 0;
        for (const id of id_list) {
          const node = findNodeById(bookmarks, id);
          const idsToDelete = node ? collectIdsFromNode(node) : [id];
          chrome.bookmarks.removeTree(id, () => {
            deletion++;
            if (deletion === id_list.length) {
              getBookmark();
              window.alert("削除しました!");
              setcheckState([]);
            }
          });
          chrome.storage.local.get("data", (result) => {
            const updated = { ...result.data };
            for (const delId of idsToDelete) {
              delete updated[delId];
            }
            chrome.storage.local.set({ data: updated });
          });
        }
      }
    }
  }

  // アクションバー分岐まとめ
  const renderActionBar = () => {
    if (!deleteMode && !dateMode) return null;
    return (
      <div className="action_bar">
        {deleteMode && (
          <button onClick={() => delete_bookmark(checkState)}>削除する</button>
        )}
        {dateMode && (
          <button onClick={() => setmodalMode("compile")}>
            期限を設定する
          </button>
        )}
        {dateMode && (
          <button
            onClick={() => {
              setmodalMode("dateDelete");
              delete_date(dateCheckState);
            }}
          >
            期限削除
          </button>
        )}
      </div>
    );
  };

  // 期限設定切り替え
  const renderModal = () => {
    if (modalMode === "compile") {
      return (
        <CompileDate
          selectedId={dateCheckState}
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
    saveData(newDate);
  }

  // ブックマーク期限設定削除
  function delete_date(id_list: string[]): void {
    const newDate = { ...data };
    for (const id of id_list) {
      newDate[id] = newDate[id] || { count: 0, date: undefined };
      newDate[id].date = undefined;
    }
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
        deleteMode={deleteMode}
        dateMode={dateMode}
        onDeleteMode={() => changeMode("delete")}
        onDateMode={() => changeMode("date")}
      />
      <Sidebar
        bookmarks={bookmarks}
        onSidebar0={() => setCurrentFolderId(bookmarks[0]?.id)}
        onSidebar1={() => setCurrentFolderId(bookmarks[1]?.id)}
        onSidebar2={() => setCurrentFolderId(bookmarks[2]?.id)}
      />
      <Listlog path={currentPathArray} onlog={setCurrentFolderId} />
      <div className="list">
        <ul>
          {currentFolderId === bookmarks[2]?.id
            ? sortBookmarks(countLow(data, bookmarks)).map((bookmark) => (
                <li key={bookmark.id}>
                  {deleteMode ? (
                    <input
                      className="check"
                      type="checkbox"
                      checked={checkState.includes(bookmark.id)}
                      onChange={(event) => {
                        changeState(bookmark.id, event.target.checked);
                      }}
                    />
                  ) : null}
                  {dateMode ? (
                    <input
                      className="check"
                      type="checkbox"
                      checked={dateCheckState.includes(bookmark.id)}
                      onChange={(event) => {
                        dateChangeState(bookmark.id, event.target.checked);
                      }}
                    />
                  ) : null}
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => clickCount(bookmark.id)}
                  >
                    <div>{bookmark.title}</div>
                    <div className="bookmark-detail">
                      {data[bookmark.id]?.count || 0}回使用 期限日：
                      {data[bookmark.id]?.date || "未設定"}
                    </div>
                  </a>
                </li>
              ))
            : sortBookmarks(currentFolderChildren).map((bookmark) => (
                <li key={bookmark.id}>
                  {deleteMode ? (
                    <input
                      className="check"
                      type="checkbox"
                      checked={checkState.includes(bookmark.id)}
                      onChange={(event) => {
                        changeState(bookmark.id, event.target.checked);
                      }}
                    />
                  ) : null}
                  {dateMode ? (
                    <input
                      className="check"
                      type="checkbox"
                      checked={dateCheckState.includes(bookmark.id)}
                      onChange={(event) => {
                        dateChangeState(bookmark.id, event.target.checked);
                      }}
                    />
                  ) : null}
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
                        期限日：{data[bookmark.id]?.date || "未設定"}
                      </div>
                    </div>
                  ) : (
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => clickCount(bookmark.id)}
                    >
                      <div>{bookmark.title}</div>
                      <div className="bookmark-detail">
                        {data[bookmark.id]?.count || 0}回使用 期限日：
                        {data[bookmark.id]?.date || "未設定"}
                      </div>
                    </a>
                  )}
                </li>
              ))}
        </ul>
      </div>
      {renderActionBar()}
      {renderModal()}
    </>
  );
}

export default App;
