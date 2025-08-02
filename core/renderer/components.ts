import type { Component, ComponentProps, VNode } from "../types";

let cid = 0; const generate = () => cid++;

function normalizeChildren(children: any): Array<VNode | string> {
    if (children == null) return [];
    const arr = Array.isArray(children)
        ? children.filter(child => child !== null && child !== undefined)
        : [children];
    return arr.map(child => typeof child === "number" ? String(child) : child);
}

export const Message: Component = (props: ComponentProps): VNode => {
    return { type: "Message", props, children: normalizeChildren(props.children) };
}

export const Embed: Component = (props: ComponentProps): VNode => {
    return { type: "Embed", props, children: normalizeChildren(props.children) };
}

export const Title: Component = (props: ComponentProps): VNode => {
    return { type: "Title", props, children: normalizeChildren(props.children) };
}

export const Description: Component = (props: ComponentProps): VNode => {
    return { type: "Description", props, children: normalizeChildren(props.children) };
}

export const Actions: Component = (props: ComponentProps): VNode => {
    return { type: "Actions", props, children: normalizeChildren(props.children) };
}

const btnHandlers = new Map<number, Map<string, Function>>();

export const Button: Component = (props: ComponentProps): VNode => {
    const id = generate();
    for (const [key, value] of Object.entries(props)) {
        if (key.startsWith("on") && typeof value === "function") {
            if (!btnHandlers.has(id)) btnHandlers.set(id, new Map());
            btnHandlers.get(id)!.set(key, value);
        }
    }
    
    return {
        type: "Button",
        props: { ...props, id },
        children: normalizeChildren(props.children)
    };
};

export const getButtonHandler = (id: number, event: string): Function | undefined => {
    return btnHandlers.get(id)?.get(event);
}