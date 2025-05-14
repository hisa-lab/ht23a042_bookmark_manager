const foo = {
    name: 'Foo Object',
    dump() {
        console.log (this);
    },
};

foo.dump();  // {name: 'Foo Object', dump: [Function: dump]}
