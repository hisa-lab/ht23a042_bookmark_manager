// カリー化前
{
    const multiply = (n, m) => n * m;
    console.log(multiply(2, 4)); // 8
}

// カリー化
{
    function withMultiple(n){
        return (m) => n * m;
    }
    console.log(withMultiple(2)(4));  //　8
}

// アロー関数式でカリー化
{
    const withMultiple = (n) => (m) => n * m;
    console.log(withMultiple(2)(4));  // 8
}
