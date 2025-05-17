const f1 = (a: number, b: string) => { console.log(a, b); };
const f2 = () => ({ x: 'hello', y: true });

type P1 = Parameters<typeof f1>;
type P2 = Parameters<typeof f2>;
type R1 = ReturnType<typeof f1>;
type R2 = ReturnType<typeof f2>;

// Parameters<T> …… T の引数の型を抽出し、タプル型で返す
// ReturnType<T> …… T の戻り値の型を返す