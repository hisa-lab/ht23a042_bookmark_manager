interface SidebarProps {
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
  lowlistLength: number;
  onSidebarClick: (id: string) => void;
}

export function Sidebar({
  bookmarks,
  lowlistLength,
  onSidebarClick,
}: SidebarProps) {
  return (
    <div className="sidebar">
      {bookmarks.map((node) => (
        <button key={node.id} onClick={() => onSidebarClick(node.id)}>
          {node.title}
        </button>
      ))}
      <button
        onClick={() => onSidebarClick("lowlist")}
        className="badge-button"
      >
        使用回数が少ないもの
        {lowlistLength > 0 && <span className="badge">{lowlistLength}</span>}
      </button>
    </div>
  );
}
