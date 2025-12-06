import { useRef, useEffect } from "react";

interface SidebarProps {
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
  lowlistLength: number;
  onSidebarClick: (id: string) => void;
  isOpen: boolean;
  setIsOpen: () => void;
}

export function Sidebar({
  bookmarks,
  lowlistLength,
  onSidebarClick,
  isOpen,
  setIsOpen,
}: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // サイドバーの幅を記録
  useEffect(() => {
    if (!sidebarRef.current) return;

    const updateWidth = () => {
      const width = isOpen ? sidebarRef.current!.offsetWidth : 0;
      document.body.style.setProperty("--sidebar-width", `${width}px`);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(sidebarRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  return (
    <div ref={sidebarRef} className={`sidebar ${isOpen ? "open" : "closed"}`}>
      {/* トグルボタン */}
      <button className="sidebar-toggle" onClick={() => setIsOpen()}>
        {isOpen ? "<<" : ">>"}
      </button>

      {/* サイドバー内のボタン */}
      <div className="sidebar-size">
        {isOpen &&
          bookmarks.map((node) => (
            <button
              className="sidebar-button"
              key={node.id}
              onClick={() => onSidebarClick(node.id)}
            >
              {node.title}
            </button>
          ))}

        {isOpen && (
          <button
            onClick={() => onSidebarClick("lowlist")}
            className="badge-button"
          >
            使用回数の少ないもの
            {lowlistLength > 0 && (
              <span className="badge">{lowlistLength}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
