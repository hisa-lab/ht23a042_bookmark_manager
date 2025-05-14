var str1 = "{ \"id\": 1, \"username\": \"patty\" }";
var user1 = JSON.parse(str1);
console.log(user1.id, user1.address.zipCode);
