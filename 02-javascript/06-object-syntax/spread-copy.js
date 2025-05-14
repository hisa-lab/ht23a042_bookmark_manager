const original = { a: 1, b: 2, c: 3 };

const copy = { ...original };
console.log(copy); // { a: 1, b: 2, c: 3 }
console.log(copy === original); // false

const assigned = { ...original, ...{ c: 10, d: 50 }, d: 100 };
console.log(assigned); // { a: 1, b: 2, c: 10, d: 100 }
console.log(original); // { a: 1, b: 2, c: 3 }
