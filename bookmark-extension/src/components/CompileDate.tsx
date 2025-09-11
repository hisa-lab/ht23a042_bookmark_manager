import { useEffect, useState } from "react";

interface CompileDateProps {
  selectedId: string[];
  onSave: (id: string[], date: string) => void;
  onClose: () => void;
}

export function CompileDate({ selectedId, onSave, onClose }: CompileDateProps) {
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
        <h1>期限設定</h1>
        <ul>
          {titles.map((title, index) => (
            <li key={index}>{title}</li>
          ))}
        </ul>
        <div className="date-field">
          <label htmlFor="expireDate">期限日</label>
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
                `自動削除の期限を設定します。設定した期限日を過ぎると自動削除されます。\n
                （補足）\n
                ［1］例えば9/9を設定した場合、9/9の0時以降に削除対象になります。\n
                ［2］フォルダを選んでいる場合は、中身が未設定でも全て削除されます。`
              );
              if (!confirmation) return;
              if (confirmation) {
                onSave(selectedId, dateData);
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
