class Person {
    constructor(name){
        this.name = name;
    }

    greet1(){
        function doIt() {
            console.log(`1) Hi, I'm ${this.name}`);
        }
        const boundDoIt = doIt.bind(this);  // 1. 関数にインスタンスのthisを束縛
        boundDoIt();
    }

    greet2(){
        function doIt(){
            console.log(`2) Hi, I'm ${this.name}`);
        }
        doIt.call(this);  // 2. インスタンスのthisを渡して実行
    }

    greet3() {
        const _this = this;  // 3. 変数 _this に値を移し替える
        function doIt() {
            console.log(`3)Hi, I'm ${_this.name}`);
        }
        doIt();
    }
}

const creamy = new Person('Mami');
creamy.greet1();  // 1) Hi, I'm Mami
creamy.greet2();  // 2) Hi, I'm Mami
creamy.greet3();  // 3) Hi, I'm Mami
