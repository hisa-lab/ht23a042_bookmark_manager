const arr = [1, 2, 3, 4, 5];
console.log(
    arr.reduce((n, m) => n + m), // 15
    arr.sort((n, m) => n > m ? -1 : 1), // [ 5, 4, 3, 2, 1 ]
);
