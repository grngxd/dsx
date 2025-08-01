import { EmbedBuilder, type MessageCreateOptions } from "discord.js";
import type { VNode } from "./core/types";

function extractText(nodes: Array<VNode | string>): string {
    return nodes.map(node => typeof node === 'string' ? node : extractText(node.children)).join('');
}

export function render(vnode: () => VNode): MessageCreateOptions {
    const rendered = vnode();

    if (rendered.type !== "Message") {
        throw new Error("Root element must be <Message>");
    }

    let content = "";
    let embeds: EmbedBuilder[] = [];


    for (const child of rendered.children) {
        if (!child) continue;
        if (typeof child === "string") {
            content += child;
        } else if (child.type === "Embed") {
            embeds.push(renderEmbed(child));
        } else if (child.type === "Description") {
            content += extractText(child.children);
        }
    }

    const result: MessageCreateOptions = {};
    if (content) result.content = content;
    if (embeds.length > 0) result.embeds = embeds;
    return result;
}

function renderEmbed(vnode: VNode): EmbedBuilder {
    const embed = new EmbedBuilder();
    if (vnode.props.color) embed.setColor(vnode.props.color);

    for (const child of vnode.children) {
        if (typeof child === "string") continue;
        if (child.type === "Title") {
            embed.setTitle(extractText(child.children));
        }
        if (child.type === "Description") {
            embed.setDescription(extractText(child.children));
        }
    }
    return embed;
}