import type { Component, VNode } from "../types";

export function jsx(type: string | Component, props: Record<string, any>): VNode {
    const raw = props.children;
    const arr = raw == null ? [] : Array.isArray(raw) ? raw : [raw];
    const children = arr.flat().filter((c: any) => c !== undefined && c !== null && c !== false && c !== true);
    props.children = children;

    if (typeof type === "function") {
        return type(props);
    }

    return { type, props, children };
}

export const jsxs = jsx;

export function Fragment(props: any) {
    return props.children;
}