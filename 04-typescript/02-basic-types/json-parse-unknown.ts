const str2 = `{"id": 2, "username": "diana"}`;
const user2: unknown = JSON.parse(str2);

console.log(user2.id, user2.address.zipCode);
// error TS2339: Property 'id' does not exist on type 'unknown'.
// error TS2339: Property 'address' does not exist on type 'unknown'.
