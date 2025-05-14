const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
console.log(
    arr.map((n) => n * 2), // [ 2, 4, 6, 8, 10, 12, 14, 16, 18 ]
    arr.filter((n) => n % 3 === 0), // [ 3, 6, 9 ]
    arr.find((n) => n > 4), // 5
    arr.findIndex((n) => n > 4), // 4
    arr.every((n) => n !== 0), // true
    arr.some((n) => n >= 10), // false
);
