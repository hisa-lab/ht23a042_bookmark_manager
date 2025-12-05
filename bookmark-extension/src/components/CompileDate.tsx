import { useEffect, useState } from "react";

interface CompileDateProps {
  selectedId: string[];
  onSave: (id: string[], date: string) => void;
  offCheck: () => void;
  onClose: () => void;
}

function collectIdsFromNode(node: chrome.bookmarks.BookmarkTreeNode): string[] {
  const ids: string[] = [node.id];
  if (node.children) {
    for (const child of node.children) {
      ids.push(...collectIdsFromNode(child));
    }
  }
  return ids;
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

export function CompileDate({
  selectedId,
  onSave,
  offCheck,
  onClose,
}: CompileDateProps) {
  const [dateData, setData] = useState<string>("");
  const [titles, setTitles] = useState<string[]>([]);

  // タイトル表示時で最新のid
  const [restIds, setrestIds] = useState<string[]>([]);

  // タイトルまたはURL
  function getDisplayName(id: string): Promise<string> {
    return new Promise((resolve) => {
      chrome.bookmarks.get(id, (results) => {
        if (!results || results.length === 0) {
          resolve("(取得できませんでした)");
          return;
        }
        const node = results[0];
        if (!node) {
          resolve("(取得できませんでした)");
          return;
        }
        if (node.title && node.title.trim() !== "") {
          resolve(node.title);
        } else if (node.url) {
          resolve(node.url);
        } else {
          resolve("(名前のないフォルダ)");
        }
      });
    });
  }

  useEffect(() => {
    const fetchTitles = async () => {
      const restId = await checkidState(selectedId);
      setrestIds(restId);
      if (restId.length === 0) return;
      const promises = restId.map((id) => getDisplayName(id));
      Promise.all(promises).then((titles) => {
        setTitles(titles);
      });
    };
    fetchTitles();
  }, [selectedId]);

  return (
    <div className="overlay">
      <div className="modal">
        <h1>削除日設定</h1>
        <ul>
          {titles.map((title, index) => (
            <li key={index}>{title}</li>
          ))}
        </ul>
        <div className="date-field">
          <label htmlFor="expireDate">削除日</label>
          <input
            id="expireDate"
            type="date"
            value={dateData}
            onChange={(event) => {
              setData(event.target.value);
            }}
          />
        </div>
        <div className="modal-actions">
          <button
            onClick={async () => {
              if (!restIds || restIds.length === 0) {
                alert("ブックマークが1つも選択されていません。");
                return;
              }
              if (!dateData) {
                alert("日付を選択してください");
                return;
              }
              const confirmation = confirm(
                "削除日を設定します。削除日以降に自動削除されます。\n" +
                  "フォルダに設定した場合、中身もフォルダの削除日に合わせて削除されます。\n" +
                  "中身に削除日は反映されません。\n" +
                  "（中身の削除日がフォルダの削除日より早い場合は、中身の削除日で削除されます。）"
              );
              if (!confirmation) return;
              if (confirmation) {
                const finalIds = await checkidState(restIds);
                if (finalIds.length !== restIds.length) {
                  onSave(finalIds, dateData);
                  offCheck();
                  onClose();
                  alert(
                    "一部のブックマークは既に削除されていました。\n" +
                      "残っているもののみに削除日を設定しました。"
                  );
                } else {
                  onSave(finalIds, dateData);
                  offCheck();
                  onClose();
                }
              }
            }}
          >
            保存
          </button>
          <button onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  );
}
