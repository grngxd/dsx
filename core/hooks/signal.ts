import { hookContext, type Listener, type State } from "./hook";

export function useSignal<T>(initial: T) {
    if (hookContext.currentHooks === null) {
        throw new Error("useSignal must be called during component render");
    }
    const idx = hookContext.hookIndex++;
    if (idx === hookContext.currentHooks.length) {
        hookContext.currentHooks.push({ value: initial, subscribers: new Set() });
    }
    const state = hookContext.currentHooks[idx] as State<T>;
    return {
        get value() { return state.value; },
        set value(v: T) { state.value = v; state.subscribers.forEach(fn => fn()); },
        subscribe(fn: Listener) { state.subscribers.add(fn); },
        unsubscribe(fn: Listener) { state.subscribers.delete(fn); }
    };
}


export function runComponent<T>(component: () => T, hooks?: State<any>[]) {
    const prevHooks = hookContext.currentHooks;
    const prevIndex = hookContext.hookIndex;
    const prevEffects = hookContext.currentEffects;
    hookContext.currentHooks = hooks ? [...hooks] : [];
    hookContext.hookIndex = 0;
    hookContext.currentEffects = [];
    const result = component();
    const usedHooks = hookContext.currentHooks!;
    const usedEffects = hookContext.currentEffects!;
    hookContext.currentHooks = prevHooks;
    hookContext.hookIndex = prevIndex;
    hookContext.currentEffects = prevEffects;
    return { result, hooks: usedHooks, effects: usedEffects };
}
