interface PopupProps {
  onPopup: () => void;
  close: () => void;
}

export function Popup({ onPopup, close }: PopupProps) {
  return (
    <div className="popup">
      <h1>使用回数の少ないものがあります。削除しませんか?</h1>
      <h1>
        ※使用回数の少ないものがある場合、このポップアップは1か月ごとに表示されます
      </h1>
      <button onClick={onPopup}>使用回数の少ないものを見る</button>
      <button onClick={close}>閉じる</button>
    </div>
  );
}
