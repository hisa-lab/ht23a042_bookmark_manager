import { useEffect, useState } from "react";

interface CompileDateProps {
  selectedId: string[];
  onSave: (id: string[], date: string) => void;
  offCheck: () => void;
  onClose: () => void;
}

export function CompileDate({
  selectedId,
  onSave,
  offCheck,
  onClose,
}: CompileDateProps) {
  const [dateData, setData] = useState<string>("");
  const [titles, setTitles] = useState<string[]>([]);

  function getBookmarkTitle(id: string): Promise<string> {
    return new Promise((resolve) => {
      chrome.bookmarks.get(id, (results) => {
        resolve(results[0].title);
      });
    });
  }

  useEffect(() => {
    if (selectedId.length === 0) return;
    const promises = selectedId.map((id) => getBookmarkTitle(id));
    Promise.all(promises).then((titles) => {
      setTitles(titles);
    });
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
            onClick={() => {
              if (!selectedId || selectedId.length === 0) {
                alert("ブックマークが1つも選択されていません。");
                return;
              }
              if (!dateData) {
                alert("日付を選択してください");
                return;
              }
              const confirmation = window.confirm(
                "自動削除の削除日を設定します。削除日以降に自動削除されます。\n" +
                  "(補足)\n" +
                  "フォルダに設定した場合、中身もフォルダの削除日に合わせて削除されます。\n" +
                  "中身に削除日は反映されません。\n" +
                  "（中身の削除日がフォルダの削除日より早い場合は、中身の削除日通りに削除されます。）"
              );
              if (!confirmation) return;
              if (confirmation) {
                onSave(selectedId, dateData);
                offCheck();
                onClose();
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
