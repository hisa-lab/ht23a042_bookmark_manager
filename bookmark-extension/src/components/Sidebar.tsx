interface SidebarProps {
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
  onSidebar0: () => void;
  onSidebar1: () => void;
  onSidebar2: () => void;
}

export function Sidebar({
  bookmarks,
  onSidebar0,
  onSidebar1,
  onSidebar2,
}: SidebarProps) {
  return (
    <div className="sidebar">
      <button onClick={onSidebar0}>{bookmarks[0]?.title}</button>
      <button onClick={onSidebar1}>{bookmarks[1]?.title}</button>
      <button onClick={onSidebar2}>使用回数が少ないもの</button>
    </div>
  );
}
