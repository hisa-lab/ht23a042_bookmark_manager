import "./App.css";
import folderImg from "./assets/folder.svg";
import infoImg from "./assets/Information.svg";
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

  // 空以外のパスを保存
  const [cachedPathArray, setCachedPathArray] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([]);

  // 使用回数の少ないもの
  const lowFolderId = "low-folder";

  // サイドバー
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // 削除日設定のモード切り替え
  const [modalMode, setmodalMode] = useState<"compile" | null>(null);

  // 個別削除日設定の状態表示
  const [tempDate, settempDate] = useState<Record<string, string>>({});

  // チェックボックスの状態保存
  const [checkState, setcheckState] = useState<string[]>([]);

  // データ保存用
  type bookmarkRecord = {
    count?: number;
    date?: string;
    adddate?: string;
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
        let newPathArray = [...cachedPathArray];
        let exist = findNodeById(nodes, newFolderId);
        while (!exist && newFolderId !== lowFolderId) {
          if (newPathArray.length > 1) {
            const parent = newPathArray[newPathArray.length - 2];
            newFolderId = parent.id;
            newPathArray = newPathArray.slice(0, -1);
            exist = findNodeById(nodes, newFolderId);
          } else {
            break;
          }
        }
        if (exist || newFolderId === lowFolderId) {
          setCurrentFolderId(newFolderId);
        } else {
          setCurrentFolderId(children[0]?.id || null);
        }
      } else {
        setCurrentFolderId(children[0]?.id || null);
      }
    });
  }, [currentFolderId, cachedPathArray, findNodeById]);

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

  // 空以外のパスを保存
  useEffect(() => {
    if (currentPathArray.length > 0) {
      setCachedPathArray(currentPathArray);
    }
  }, [currentPathArray]);

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
    newCounts[id] = newCounts[id] || { count: 0 };
    newCounts[id].count = (newCounts[id].count || 0) + 1;
    saveData(newCounts);
  }

  // ブックマークサイトを開く
  function openBookmark(id: string, bookmark_url: string | undefined) {
    if (!bookmark_url) {
      alert("URLが存在しません。");
      return;
    }
    chrome.tabs.create({ url: bookmark_url }, () => {
      if (chrome.runtime.lastError) {
        alert(
          "このブックマークはこの拡張機能から開くことができません。\n<ブックマークのURL>\n" +
            bookmark_url
        );
        console.log("開けないブックマーク確認", chrome.runtime.lastError);
        return;
      }
      clickCount(id); // 成功時のみカウント
    });
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

  // 日付をローカルに変更
  function nowDate(now: Date) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const nowDate = new Date(year, month, day);
    return nowDate;
  }

  // 使用回数が3回以下かつ削除日が未設定かつ追加してから7日経ったもの(日付単位)を抽出(フォルダは除外)
  function countLow(
    data: Record<string, bookmarkRecord>,
    bookmarks: chrome.bookmarks.BookmarkTreeNode[]
  ): chrome.bookmarks.BookmarkTreeNode[] {
    const lowlist = [];
    const today = nowDate(new Date());
    for (const node of bookmarks) {
      if (node.children) {
        const lowchildren = countLow(data, node.children);
        lowlist.push(...lowchildren);
      } else {
        const count = data[node.id]?.count ?? 0;
        const deleteDate = data[node.id]?.date;
        const addDateRaw = data[node.id]?.adddate;
        if (!addDateRaw) continue;
        const addDate = nowDate(new Date(addDateRaw));
        const diff = today.getTime() - addDate.getTime();
        const diffDays = diff / (1000 * 60 * 60 * 24);
        if (
          count <= 3 &&
          (!deleteDate || isNaN(new Date(deleteDate).getTime())) &&
          diffDays >= 7
        ) {
          lowlist.push(node);
        }
      }
    }
    return lowlist;
  }

  // チェックボックスの状態を保存
  function changeState(id: string, state: boolean): void {
    const idsToToggle = [id];
    setcheckState((prev) => {
      if (state) {
        const merged = [...prev, ...idsToToggle];
        return Array.from(new Set(merged));
      } else {
        return prev.filter((item) => !idsToToggle.includes(item));
      }
    });
  }

  // チェックのid存在確認
  async function checkidState(ids: string[]) {
    const bookmarks = await chrome.bookmarks.getTree();
    const allIds: string[] = [];
    for (const node of bookmarks) {
      allIds.push(...collectIdsFromNode(node));
    }
    const restId = ids.filter((id) => allIds.includes(id));
    return restId;
  }

  // ブックマーク削除
  async function delete_bookmark(id_list: string[]): Promise<void> {
    let restId = await checkidState(id_list);
    setcheckState(restId);
    if (restId.length === 0) {
      return;
    } else {
      const confirmation = confirm(
        "本当に削除しますか?\n(フォルダを選択している場合は中身も全て削除されます。)"
      );
      if (!confirmation) return;
      if (confirmation) {
        restId = await checkidState(restId);
        setcheckState(restId);
        // 二重削除防止
        let filteredIds = [...restId];
        for (const id of restId) {
          if (!filteredIds.includes(id)) continue;
          const nodes = await chrome.bookmarks
            .getSubTree(id)
            .catch((e) => console.error("getSubTree失敗", e));
          if (!nodes || nodes.length === 0) continue;
          const node = nodes[0];
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

  // 削除日設定切り替え
  const renderModal = () => {
    if (modalMode === "compile") {
      return (
        <CompileDate
          selectedId={checkState}
          onSave={(selectedId, date) => {
            date_bookmark(selectedId, date);
          }}
          offCheck={() => setcheckState([])}
          onClose={() => setmodalMode(null)}
        />
      );
    }
    return null;
  };

  // ブックマーク削除日設定
  function date_bookmark(id_list: string[], dateData: string): void {
    const newDate = { ...data };
    for (const id of id_list) {
      newDate[id] = newDate[id] || { date: undefined };
      newDate[id].date = dateData;
    }
    saveData(newDate);
  }

  // ブックマーク削除日設定リセット
  async function delete_date(id_list: string[]): Promise<void> {
    const newDate = { ...data };
    const restId = await checkidState(id_list);
    for (const id of restId) {
      newDate[id] = newDate[id] || { date: undefined };
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
        isOpen={isOpen}
        setIsOpen={() => {
          setIsOpen(!isOpen);
        }}
      />
      <Listlog path={currentPathArray} onlog={setCurrentFolderId} />
      <div className="list">
        <ul>
          {currentFolderId === lowFolderId
            ? sortBookmarks(countLow(data, bookmarks)).map((bookmark) => (
                <li key={bookmark.id}>
                  <div className="bookmark-header">
                    <input
                      id={`check-low-${bookmark.id}`}
                      className="check"
                      type="checkbox"
                      checked={checkState.includes(bookmark.id)}
                      onChange={(event) => {
                        changeState(bookmark.id, event.target.checked);
                      }}
                    />
                    <a
                      role="link"
                      className="bookmark-title"
                      onClick={() => {
                        openBookmark(bookmark.id, bookmark.url);
                      }}
                    >
                      {bookmark.title?.trim() ? bookmark.title : bookmark.url}
                    </a>
                  </div>
                  <div className="bookmark-detail">
                    {data[bookmark.id]?.count || 0}回使用 削除日：
                    <input
                      id={`expireDate-low-${bookmark.id}`}
                      type="date"
                      value={
                        tempDate[bookmark.id] !== undefined
                          ? tempDate[bookmark.id]
                          : data[bookmark.id]?.date || ""
                      }
                      onChange={(event) => {
                        settempDate((prev) => ({
                          ...prev,
                          [bookmark.id]: event.target.value,
                        }));
                      }}
                    />
                    <button
                      className={
                        tempDate[bookmark.id] !== undefined
                          ? "not-saved"
                          : "date-individual-save"
                      }
                      onClick={() => {
                        if (tempDate[bookmark.id] === undefined) return;
                        date_bookmark([bookmark.id], tempDate[bookmark.id]);
                        settempDate((prev) => {
                          const copy = { ...prev };
                          delete copy[bookmark.id];
                          return copy;
                        });
                      }}
                    >
                      保存
                    </button>
                  </div>
                  <button
                    className="delete-individual"
                    onClick={() => {
                      chrome.bookmarks.removeTree(bookmark.id);
                    }}
                  >
                    削除
                  </button>
                </li>
              ))
            : sortBookmarks(currentFolderChildren).map((bookmark) => (
                <li key={bookmark.id}>
                  {bookmark.children ? (
                    <div>
                      <div className="bookmark-header">
                        <input
                          id={`check-${bookmark.id}`}
                          className="check"
                          type="checkbox"
                          checked={checkState.includes(bookmark.id)}
                          onChange={(event) => {
                            changeState(bookmark.id, event.target.checked);
                          }}
                        />
                        <div
                          role="button"
                          className="bookmark-title"
                          onClick={() => {
                            setCurrentFolderId(bookmark.id);
                            clickCount(bookmark.id);
                          }}
                        >
                          <img src={folderImg} alt="" className="icon-folder" />
                          {bookmark.title?.trim()
                            ? bookmark.title
                            : "(名前のないフォルダ)"}
                        </div>
                      </div>
                      <div className="bookmark-detail">
                        削除日：
                        <input
                          id={`expireDate-${bookmark.id}`}
                          type="date"
                          value={
                            tempDate[bookmark.id] !== undefined
                              ? tempDate[bookmark.id]
                              : data[bookmark.id]?.date || ""
                          }
                          onChange={(event) => {
                            settempDate((prev) => ({
                              ...prev,
                              [bookmark.id]: event.target.value,
                            }));
                          }}
                        />
                        <button
                          className={
                            tempDate[bookmark.id] !== undefined
                              ? "not-saved"
                              : "date-individual-save"
                          }
                          onClick={() => {
                            if (tempDate[bookmark.id] === undefined) return;
                            date_bookmark([bookmark.id], tempDate[bookmark.id]);
                            settempDate((prev) => {
                              const copy = { ...prev };
                              delete copy[bookmark.id];
                              return copy;
                            });
                          }}
                        >
                          保存
                        </button>
                        <span className="tooltip">
                          <img src={infoImg} alt="" className="icon-info" />
                          <span className="tooltip-word">
                            中身に削除日は反映されません。
                            <br />
                            フォルダに削除日を設定すると、中身もその日にまとめて削除されます。
                            <br />
                            （中身の削除日がフォルダの削除日より早い場合は、中身の削除日で削除されます。）
                          </span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="bookmark-header">
                        <input
                          id={`check-${bookmark.id}`}
                          className="check"
                          type="checkbox"
                          checked={checkState.includes(bookmark.id)}
                          onChange={(event) => {
                            changeState(bookmark.id, event.target.checked);
                          }}
                        />
                        <a
                          role="link"
                          className="bookmark-title"
                          onClick={() => {
                            openBookmark(bookmark.id, bookmark.url);
                          }}
                        >
                          {bookmark.title?.trim()
                            ? bookmark.title
                            : bookmark.url}
                        </a>
                      </div>
                      <div className="bookmark-detail">
                        {data[bookmark.id]?.count || 0}回使用 削除日：
                        <input
                          id={`expireDate-${bookmark.id}`}
                          type="date"
                          value={
                            tempDate[bookmark.id] !== undefined
                              ? tempDate[bookmark.id]
                              : data[bookmark.id]?.date || ""
                          }
                          onChange={(event) => {
                            settempDate((prev) => ({
                              ...prev,
                              [bookmark.id]: event.target.value,
                            }));
                          }}
                        />
                        <button
                          className={
                            tempDate[bookmark.id] !== undefined
                              ? "not-saved"
                              : "date-individual-save"
                          }
                          onClick={() => {
                            if (tempDate[bookmark.id] === undefined) return;
                            date_bookmark([bookmark.id], tempDate[bookmark.id]);
                            settempDate((prev) => {
                              const copy = { ...prev };
                              delete copy[bookmark.id];
                              return copy;
                            });
                          }}
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    className="delete-individual"
                    onClick={() => {
                      chrome.bookmarks.removeTree(bookmark.id);
                    }}
                  >
                    削除
                  </button>
                </li>
              ))}
        </ul>
      </div>
      {renderModal()}
    </>
  );
}

export default App;
