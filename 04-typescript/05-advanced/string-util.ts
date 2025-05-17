type Company = 'Apple' | 'IBM' | 'GitHub';

type C1 = Lowercase<Company>;
type C2 = Uppercase<Company>;
type C3 = Uncapitalize<Company>;
type C4 = Capitalize<C3>;

// Uppercase<T> …… T の各要素の文字列をすべて大文字にする
// Lowercase<T> …… T の各要素の文字列をすべて小文字にする
// Capitalize<T> …… T の各要素の文字列の頭を大文字にする
// Uncapitalize<T> …… T の各要素の文字列の頭を小文字にする
