const original = {a: 1, b: 2, c: 3};

const copy = Object.assign({}, original);
console.log(copy);  // {a: 1, b: 2, c: 3}
console.log(copy === original);  // false → 値が同じでもアドレスを共有しない別オブジェクト

const assigned = Object.assign(original, {c: 10, d: 50},{d: 100});
console.log(assigned);  // {a: 1, b: 2, c: 10, d: 100}
console.log(original);  // {a: 1, b: 2, c: 10, d: 100}
