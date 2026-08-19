import { decode, encode } from "@msgpack/msgpack";
import { VNode } from "../types";

const PREFIX = "d";

let nextComponentId = 0;

export const components = new Map<number, () => VNode>();
const componentIds = new WeakMap<Function, number>();

export const component = <T extends () => VNode>(fn: T): T => {
    const id = nextComponentId++;

    componentIds.set(fn, id);
    components.set(id, fn);

    return fn;
};

export const getComponentId = (
    fn: () => VNode
) => componentIds.get(fn);

export const encodeResume = (
    component: number,
    id: string,
    hooks: unknown[],
) => {
    const bytes = encode([component, id, hooks]);
    const value = PREFIX + Buffer.from(bytes).toString("base64url");

    if (value.length > 100) {
        throw new Error(
            `resume payload exceeds Discord custom_id limit (${value.length}/100 chars).`,
        );
    }

    return value;
};

export const decodeResume = (value: string) => {
    if (!value.startsWith(PREFIX)) return;

    try {
        const bytes = Buffer.from(
            value.slice(PREFIX.length),
            "base64url",
        );

        const data = decode(bytes);

        if (!Array.isArray(data) || data.length !== 3) return;

        return data as [number, string, unknown[]];
    } catch {
        return;
    }
};