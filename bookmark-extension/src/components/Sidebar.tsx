interface SidebarProps {
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
  lowlistLength: number;
  onSidebar0: () => void;
  onSidebar1: () => void;
  onSidebar2: () => void;
  onSidebar3: () => void;
}

export function Sidebar({
  bookmarks,
  lowlistLength,
  onSidebar0,
  onSidebar1,
  onSidebar2,
  onSidebar3,
}: SidebarProps) {
  return (
    <div className="sidebar">
      {bookmarks[0] ? (
        <button onClick={onSidebar0}>{bookmarks[0]?.title}</button>
      ) : null}
      {bookmarks[1] ? (
        <button onClick={onSidebar1}>{bookmarks[1]?.title}</button>
      ) : null}
      {bookmarks[2] ? (
        <button onClick={onSidebar2}>{bookmarks[2]?.title}</button>
      ) : null}
      <button onClick={onSidebar3} className="badge-button">
        使用回数が少ないもの
        {lowlistLength > 0 && <span className="badge">{lowlistLength}</span>}
      </button>
    </div>
  );
}
