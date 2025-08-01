import type { MessageCreateOptions, MessageEditOptions } from "discord.js";
import type { VNode } from "../types";

export const extractText = (nodes: Array<VNode | string | number>): string => {
    return nodes.map(node =>
        typeof node === "string" || typeof node === "number"
            ? String(node)
            : node && typeof node === "object" && "children" in node
                ? extractText(node.children)
                : ""
    ).join("");
}

export const toEditOptions = (create: MessageCreateOptions): MessageEditOptions => {
    const { content, embeds, components, files } = create;
    return { content, embeds, components, files };
}