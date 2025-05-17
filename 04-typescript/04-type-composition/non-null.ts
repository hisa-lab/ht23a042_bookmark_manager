interface Resident {
    familyName: string;
    lastName: string;
    mom?: Resident;
}
  
const getMomName = (resident: Resident): string => resident.mom!.lastName;

const patty = { familyName: "Hope-Rabbit", lastName: "patty" };
console.log(getMomName(patty));

// ! は非Nullアサーション演算子
// これには、Nullとundefinedが入らないと明示するもの
// →Null安全性を壊す→使わない方がいい
