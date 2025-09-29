interface HeaderProps {
  onDelete_Bookmark: () => void;
  onSetmodalMode: () => void;
  onDelete_date: () => void;
}

export function Header({
  onDelete_Bookmark,
  onSetmodalMode,
  onDelete_date,
}: HeaderProps) {
  return (
    <div className="header">
      <h1>ブックマークマネージャ</h1>
      <div className="header-buttons">
        <button onClick={onDelete_Bookmark}>削除</button>
        <button onClick={onSetmodalMode}>削除日を設定する</button>
        <button onClick={onDelete_date}>削除日削除</button>
      </div>
    </div>
  );
}
