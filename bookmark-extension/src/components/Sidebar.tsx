interface SidebarProps {
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
  lowlistLength: number;
  onSidebar0: () => void;
  onSidebar1: () => void;
  onSidebar2: () => void;
}

export function Sidebar({
  bookmarks,
  lowlistLength,
  onSidebar0,
  onSidebar1,
  onSidebar2,
}: SidebarProps) {
  return (
    <div className="sidebar">
      <button onClick={onSidebar0}>{bookmarks[0]?.title}</button>
      <button onClick={onSidebar1}>{bookmarks[1]?.title}</button>
      <button onClick={onSidebar2} className="badge-button">
        使用回数が少ないもの
        {lowlistLength > 0 && <span className="badge">{lowlistLength}</span>}
      </button>
    </div>
  );
}
