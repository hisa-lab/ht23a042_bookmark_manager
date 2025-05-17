type Animal = 'cat' | 'dog' | 'rabbit';
type AnimalNote = Record<Animal, string>;
// type AnimalNote = { [key in Animal]: string }

const animalKanji: AnimalNote = {
  cat: '猫',
  dog: '犬',
  rabbit: '兎',
};

console.log(animalKanji);

// Record<K,T> …… K の要素をキーとしプロパティ値の型を T としたオブジェクトの型を作成する
