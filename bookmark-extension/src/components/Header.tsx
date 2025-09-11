interface HeaderProps {
  deleteMode: boolean;
  dateMode: boolean;
  onDeleteMode: () => void;
  onDateMode: () => void;
}

export function Header({
  deleteMode,
  dateMode,
  onDeleteMode,
  onDateMode,
}: HeaderProps) {
  return (
    <div className="header">
      <h1>ブックマークマネージャ</h1>
      <div className="header-buttons">
        <button onClick={onDeleteMode}>
          {deleteMode ? "やめる" : "選択削除"}
        </button>
        <button onClick={onDateMode}>
          {dateMode ? "やめる" : "期限自動削除設定"}
        </button>
      </div>
    </div>
  );
}
