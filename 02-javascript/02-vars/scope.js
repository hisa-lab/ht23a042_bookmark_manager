var n = 0;

if(true) {
    var n = 50;  // 同じ変数nとして扱われている
    var m = 100;
    console.log(n);
}

console.log(n);
console.log(m);
