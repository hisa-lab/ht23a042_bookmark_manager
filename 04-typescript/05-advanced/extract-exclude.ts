type Permission = 'r' | 'w' | 'x';

type RW1 = Extract<Permission, 'r' | 'w'>;
type RW2 = Exclude<Permission, 'x'>;

// Extract<T, U> …… T から U の要素だけを抽出する
// Exclude<T, U> …… T から U の要素を省く
