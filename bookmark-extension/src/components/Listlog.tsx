interface ListlogProps {
  path: chrome.bookmarks.BookmarkTreeNode[];
  onlog: (id: string) => void;
}

export function Listlog({ path, onlog }: ListlogProps) {
  return (
    <div className="listlog">
      {path.map((folder, index) => (
        <span key={folder.id}>
          <button onClick={() => onlog(folder.id)}>{folder.title}</button>
          {index < path.length - 1 && ">"}
        </span>
      ))}
    </div>
  );
}
