import { hookContext } from ".";

export function useEffect(fn: () => void) {
    if (hookContext.currentEffects === null) {
        throw new Error("useEffect must be called during component render");
    }
    hookContext.currentEffects.push(fn);
}