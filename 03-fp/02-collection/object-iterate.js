const user = {
    id: 3,
    name: 'Boddy Kumanov',
    username: 'bobby',
    email: 'bobby@maple.town',
};

console.log(Object.keys(user));
// [ 'id', 'name', 'username', 'email' ]

console.log(Object.values(user));
// [ 3, 'Bobby Bear', 'bobby', 'bobby@maple.town' ]

console.log(Object.entries(user));
// [
// [ 'id', 3 ],
// [ 'name', 'Bobby Kumanov' ],
// [ 'username', 'bobby' ],
// [ 'email', 'bobby@maple.town' ]
// ]

// キーと値のペアを反復処理の中で扱う
Object.keys(user).map((k) => { console.log(k, user[k]); });
Object.entries(user).map(([k, v]) => { console.log(k, v) });
