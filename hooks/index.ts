import { useEffect } from "./effect";
import { useComputed, useSignal } from "./signal";

export type Listener = () => void;
export type State<T> = { value: T; subscribers: Set<Listener> }

export const hookContext = {
  currentHooks: null as State<any>[] | null,
  hookIndex: 0,
  currentEffects: null as Array<() => Promise<void> | void> | null,
};

export { useComputed, useEffect, useSignal };

