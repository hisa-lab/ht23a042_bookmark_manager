const patty = {
    name: 'Patty Rabbit',
    email: 'patty@maple.town',
    address:{town: 'Maple Town'}, 
    // addressの部分が1段階、townからが2段階目
};

const rolley = {...patty, name: 'Rolley Cocker'};
rolley.email = 'rolley@palm.town';
rolley.address.town = 'Palm Town';

console.log(patty);
// {
// name: 'Patty Rabbit',
// email: 'patty@maple.town',
// address: { town: 'Palm Town' }
// }
