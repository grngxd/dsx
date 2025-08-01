import { EmbedBuilder, Message, type MessageCreateOptions, type MessageEditOptions } from "discord.js";
import { beginCollect, endCollect, Signal } from "../signals";
import type { VNode } from "../types";
import { extractText, toEditOptions } from "./utils";

const renderEmbed = (v: VNode): EmbedBuilder => {
    const embed = new EmbedBuilder();
    if (v.props.color) embed.setColor(v.props.color);

    for (const child of v.children) {
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

export const render = (component: () => VNode): MessageCreateOptions => {
    const rendered = component();

    if (rendered.type !== "Message") {
        throw new Error("Root element must be <Message>");
    }

    let content = "";
    let embeds: EmbedBuilder[] = [];

    for (const child of rendered.children) {
        if (!child) continue;

        if (typeof child === "string") {
            content += String(child);
        } else if (child.type === "Embed") {
            embeds.push(renderEmbed(child));
        } else if (child.type === "Description") {
            content += extractText(child.children);
        } else {
            content += String(child)
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
    beginCollect();

    const initialMsg = render(component);
    const signals: Signal<any>[] = endCollect();
    const sentMsg = await initial(initialMsg);

    for (const signal of signals) {
        signal.subscribe(async () => {
            await rerender(toEditOptions(render(component)), sentMsg);
        });
    }
}