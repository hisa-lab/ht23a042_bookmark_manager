console.log(typeof 100);

const arr = [1, 2, 3];
console.log(typeof arr);

type NumArr = typeof arr;

const val: NumArr = [4, 5, 6];
const val2: NumArr = ["foo", "bar", "baz"];

// typeof演算子
// type NumArr = typeof arr;の部分
// const arr = [1, 2, 3]; 
// console.log(typeof arr);で
// number型を使用した配列になっているため
// string型をいれたときはエラーになる