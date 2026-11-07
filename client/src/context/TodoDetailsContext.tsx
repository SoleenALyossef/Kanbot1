import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { TodoDetailsDialog } from '../features/todos/TodoDetailsDialog';
import type { Todo } from '../types/api';

interface TodoDetailsValue {
  openTodo: (todo: Todo) => void;
}
const TodoDetailsContext = createContext<TodoDetailsValue | null>(null);

/** Lets any screen open the todo details modal (06). */
export function TodoDetailsProvider({ children }: { children: ReactNode }) {
  const [todo, setTodo] = useState<Todo | null>(null);
  const value = useMemo<TodoDetailsValue>(() => ({ openTodo: setTodo }), []);
  return (
    <TodoDetailsContext.Provider value={value}>
      {children}
      {todo ? <TodoDetailsDialog key={todo.id} todo={todo} onClose={() => setTodo(null)} /> : null}
    </TodoDetailsContext.Provider>
  );
}

export function useTodoDetails(): TodoDetailsValue {
  const ctx = useContext(TodoDetailsContext);
  if (!ctx) throw new Error('useTodoDetails must be used inside TodoDetailsProvider');
  return ctx;
}
