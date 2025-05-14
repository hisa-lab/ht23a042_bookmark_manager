const arr = [4, 8, 2, 6];

console.log(
    arr.sort((n, m) => n < m ? -1 : 1), // [2, 4, 6, 8]
    arr, // [2, 4, 6, 8]
);
