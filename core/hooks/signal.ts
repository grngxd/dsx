// Simple reactive signal implementation with collection for mount
let collecting = false;
let collected: Signal<any>[] = [];

export class Signal<T> {
    private _value: T;
    private subscribers = new Set<() => void>();
    constructor(initial: T) {
        this._value = initial;
    }
    get value(): T {
        return this._value;
    }
    set value(newValue: T) {
        this._value = newValue;
        for (const fn of this.subscribers) fn();
    }
    subscribe(fn: () => void) {
        this.subscribers.add(fn);
    }
    unsubscribe(fn: () => void) {
        this.subscribers.delete(fn);
    }
}

export function useSignal<T>(initial: T): Signal<T> {
    const sig = new Signal(initial);
    if (collecting) collected.push(sig);
    return sig;
}

export function beginCollect() {
    collecting = true;
    collected = [];
}

export function endCollect(): Signal<any>[] {
    collecting = false;
    return collected;
}
