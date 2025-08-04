import { VNode } from "types";

export const normalizeChildren = (children: any): Array<VNode | string> => {
    if (children == null) return [];
    const arr = Array.isArray(children)
        ? children.filter((child) => child !== null && child !== undefined)
        : [children];
    return arr.map((child) =>
        typeof child === "number" ? String(child) : child
    );
}