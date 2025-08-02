export type Listener = () => void;
export type State<T> = { value: T; subscribers: Set<Listener> }

export const hookContext = {
  currentHooks: null as State<any>[] | null,
  hookIndex: 0,
  currentEffects: null as Array<() => void> | null,
};