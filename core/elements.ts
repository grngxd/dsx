import type { VNode } from "./types";

function normalizeChildren(children: any): Array<VNode | string> {
    if (children == null) return [];
    const arr = Array.isArray(children)
        ? children.filter(child => child !== null && child !== undefined)
        : [children];
    return arr.map(child => typeof child === "number" ? String(child) : child);
}

export function Message(props: Record<string, any>): VNode {
    return { type: "Message", props, children: normalizeChildren(props.children) };
}
export function Embed(props: Record<string, any>): VNode {
    return { type: "Embed", props, children: normalizeChildren(props.children) };
}
export function Title(props: Record<string, any>): VNode {
    return { type: "Title", props, children: normalizeChildren(props.children) };
}
export function Description(props: Record<string, any>): VNode {
    return { type: "Description", props, children: normalizeChildren(props.children) };
}