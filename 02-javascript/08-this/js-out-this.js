class Person {
    constructor(name) {
    this.name = name;
    }
};
function greet(postfix) {
    console.log(`Hi, I'm ${this.name}${postfix}`);
}

const minky = new Person('Momo');
greet.call(minky, '!'); // Hi, I'm Momo!

const boundGreet = greet.bind(minky);
boundGreet('!'); // Hi, I'm Momo!

minky.greet = greet;
minky.greet('!'); // Hi, I'm Momo!