const users = [
    {
        name: 'Patty Rabbit',
        address: {
            town: 'Maple Town',
        },
    },
    {
        name: 'Rolley Coker',
        address: {},
    },
    null,
];

for (const u of users) {
    const user = u ?? {name: '(Somebody)'};
    const town = user?.address?.town ?? '(Somewhere)';
    console.log(`${user.name} lives in ${town}`);
}

// Null合体演算子（??のやつ）
// null や　undefinedのときだけ右を返す
// ORは0や''の時もfalsy扱いで右が返る

// オプショナルチェイニング（?.のやつ）
// オブジェクトの中にあるプロパティが存在するか分からない時に使う
// 存在しなければエラーではなく、undefinedを返す
// 例: obj?.propならpropがあれば、propにアクセス
// なければ、undefinedを返す
