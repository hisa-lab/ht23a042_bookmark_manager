interface T { foo: number }
interface U { bar: string }
interface V {
  foo?: number;
  baz: boolean;
}

type TnU = T & U;
type TnV = T & V;
type VnTorU = V & (T | U);

// ?は省略可能

// &の場合は型の共通点がないものはnever型になる
//type Some = number & string;
//type ←型エイリアス Some型を定義
//let id: Some; Some型のidを作成
// id = 100;　
// &で型の共通点がなかったため、never型になる
// 何ものも代入できない