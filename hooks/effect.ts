import { hookContext } from ".";

export function useEffect(fn: () => Promise<void> | void) {
    if (hookContext.currentEffects === null) {
        throw new Error("useEffect must be called during component render");
    }
    hookContext.currentEffects.push(fn);
}