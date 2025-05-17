const permissions = {
    r: 0b100,
    w: 0b010,
    x: 0b001,
  } as const;

const species = ['rabbit', 'bear', 'fox', 'dog'] as const;
type Species = typeof species[number]; // 'rabbit' | 'bear'| 'fox' | 'dog'

type ValueOf<T> = T[keyof T];
type PermNum = ValueOf<typeof permissions>;   // 1 | 2 | 4

// リテラル型→具体的な値そのものを型として扱う
// この場合、1,2,4 という値だけ許す型
