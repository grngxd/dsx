import { hookContext, type Listener, type State } from ".";
import { reset } from "../components";

type Signal<T> = {
    value: T;
    subscribe(fn: Listener): void;
    unsubscribe(fn: Listener): void;
};

export function useSignal<T>(initial: T): Signal<T> {
    if (hookContext.currentHooks === null) {
        throw new Error(
            "useSignal must be called during component render"
        );
    }

    const idx = hookContext.hookIndex++;

    if (idx === hookContext.currentHooks.length) {
        hookContext.currentHooks.push({
            value: initial,
            subscribers: new Set(),
        });
    }

    const state = hookContext.currentHooks[idx] as State<T>;

    return {
        get value() {
            return state.value;
        },

        set value(v: T) {
            if (Object.is(state.value, v)) return;

            state.value = v;

            state.subscribers.forEach(
                async fn => await fn()
            );
        },

        subscribe(fn: Listener) {
            state.subscribers.add(fn);
        },

        unsubscribe(fn: Listener) {
            state.subscribers.delete(fn);
        },
    };
}

export function useComputed<T>(compute: () => T): Readonly<Signal<T>> {
    if (hookContext.currentHooks === null) {
        throw new Error(
            "useComputed must be called during component render"
        );
    }

    hookContext.hookIndex++;

    return {
        get value() {
            return compute();
        },

        set value(_) {
            throw new Error(
                "Cannot assign to a computed signal"
            );
        },

        subscribe() {},
        unsubscribe() {},
    };
}

export function runComponent<T>(
    component: () => T,
    hooks?: State<any>[],
    values?: unknown[],
) {
    const prevHooks = hookContext.currentHooks;
    const prevIndex = hookContext.hookIndex;
    const prevEffects = hookContext.currentEffects;

    hookContext.currentHooks = values
        ? values.map(value => ({
            value,
            subscribers: new Set(),
        }))
        : hooks
            ? [...hooks]
            : [];

    reset();

    hookContext.hookIndex = 0;
    hookContext.currentEffects = [];

    const result = component();

    const usedHooks = hookContext.currentHooks!;
    const usedEffects = hookContext.currentEffects!;

    hookContext.currentHooks = prevHooks;
    hookContext.hookIndex = prevIndex;
    hookContext.currentEffects = prevEffects;

    return {
        result,
        hooks: usedHooks,
        effects: usedEffects,
    };
}