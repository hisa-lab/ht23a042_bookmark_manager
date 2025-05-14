function greeter(target) {
    const sayHello = () => {
        console.log(`Hi, ${target}!`);
    };

    return sayHello;
}

// 書き直し1
const greet = greeter('Step Jun');
greet();  // Hi, Step Jun!

function greeter1(target) {
   return () => {
    console.log(`Hi, ${target}!`);
   };
}

const greet1 = greeter1('Step Jun');
greet1();  // Hi, Step Jun!

// 書き直し2
const greeter2 = (target) => () => { console.log(`Hi, ${target}`);};

const greet2 = greeter2('Step Jun');
greet2();
