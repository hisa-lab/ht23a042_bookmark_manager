{
    interface User {
      username: string;
      address: { zipcode: string; town: string };
    }
  
    const str = `{ "username": "patty", "town": "Maple Town" }`;
    const data: unknown = JSON.parse(str);
    const user = data as User;
  
    console.log(user.address.town);
}

// 型アサーション
// →型を自分で断定
// コンパイラの解釈を変えることができる
// const s = (123 as unknown) as string;
// 上記の場合まずnumber型のものをunknownとして解釈させ
// string型に解釈させなおしている
// この時点でのコンパイルはとおり、string型として解釈される
// しかし、実際中身はnumber型のままなので
// string型として扱おうとするとエラーになる