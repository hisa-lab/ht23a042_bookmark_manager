interface Todo {
    title: string;
    description: string;
    isDone: boolean;
}
  
type PickedTodo = Pick<Todo, "title" | "isDone">;
type OmittedTodo = Omit<Todo, "description">;

// Pick<T, K> →TからKが指定するキーのプロパティだけ抽出する
// Omit<T, K> →TからKが指定するキーのプロパティを省く