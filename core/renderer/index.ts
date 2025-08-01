import { EmbedBuilder, Message, type MessageCreateOptions, type MessageEditOptions } from "discord.js";
import { runComponent } from "../hooks/signal";
import type { VNode } from "../types";
import { extractText, toEditOptions } from "./utils";

const renderEmbed = (v: VNode): EmbedBuilder => {
    const embed = new EmbedBuilder();
    if (v.props.color) embed.setColor(v.props.color);

    for (const child of v.children) {
        if (typeof child === "string" || typeof child === "number") {
            const prev = embed.data.description ?? "";
            embed.setDescription(prev + String(child));
            continue;
        }
        if (child.type === "Title") {
            embed.setTitle(extractText(child.children));
        }
        if (child.type === "Description") {
            embed.setDescription(extractText(child.children));
        }
    }
    return embed;
}

export const render = (component: () => VNode): MessageCreateOptions => {
    const rendered = component();

    if (rendered.type !== "Message") {
        throw new Error("Root element must be <Message>");
    }

    let content = "";
    let embeds: EmbedBuilder[] = [];

    for (const child of rendered.children) {
        if (child === null || child === undefined) continue;
        if (typeof child === "string" || typeof child === "number") {
            content += String(child);
        } else if (child.type === "Embed") {
            embeds.push(renderEmbed(child));
        } else if (child.type === "Description") {
            content += extractText(child.children);
        } else {
            content += String(child);
        }
    }

    const result: MessageCreateOptions = {
        content: content.trim(),
        embeds: embeds.length > 0 ? embeds : undefined,
    };

    if (embeds.length === 0 && content.length === 0) {
        throw new Error("DISCO: message must have either content or embeds");
    }
    return result;
}

export const mount = async (
    component: () => VNode,
    initial: (discordMessage: MessageCreateOptions) => Promise<Message<false> | Message<true>> | Message<false> | Message<true>,
    rerender: (discordMessage: MessageEditOptions, sent: Message<false> | Message<true>) => Promise<any> | any
) => {
    let { result: vnode, hooks, effects } = runComponent(component);

    const initialMsg = render(() => vnode);
    const sentMsg = await initial(initialMsg);

    for (const effect of effects) {
        effect();
    }
    for (const state of hooks) {
        state.subscribers.add(async () => {
            const comp = runComponent(component, hooks);
            vnode = comp.result;
            hooks = comp.hooks;
            const updatedMsg = render(() => vnode);
            await rerender(toEditOptions(updatedMsg), sentMsg);
        });
    }

}