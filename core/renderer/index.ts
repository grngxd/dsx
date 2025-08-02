import { ActionRowBuilder, ButtonBuilder, Client, EmbedBuilder, Message, type MessageCreateOptions } from "discord.js";
import { runComponent } from "../hooks/signal";
import type { VNode } from "../types";
import { extractButtons, extractText, toEditOptions, wireInteractions } from "./utils";
const wiredBots = new WeakSet<Client>();

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
        }
    }

    content = content.trim()

    const buttons = extractButtons(rendered);

    const actions = [buttons] // TODO: add more actions

    const res: MessageCreateOptions = {}

    if (content) res.content = content;
    if (embeds.length > 0) res.embeds = embeds;
    if (actions.length > 0) res.components = actions.map(row => new ActionRowBuilder<ButtonBuilder>().addComponents(...row));

    if (embeds.length === 0 && content.length === 0) {
        throw new Error("DISCO: message must have either content or embeds");
    }
    return res;
}

export const mount = async (
    component: () => VNode,
    bot: Client,
    message: (msg: MessageCreateOptions) => Promise<Message<false> | Message<true>> | Message<false> | Message<true>
) => {
    if (!wiredBots.has(bot)) {
        wireInteractions(bot);
        wiredBots.add(bot);
    }

    let { result: vnode, hooks, effects } = runComponent(component);

    const initialMsg = render(() => vnode);
    const sentMsg = await message(initialMsg);

    for (const effect of effects) {
        effect();
    }
    for (const state of hooks) {
        state.subscribers.add(async () => {
            const comp = runComponent(component, hooks);
            vnode = comp.result;
            hooks = comp.hooks;
            const updatedMsg = render(() => vnode);
            await sentMsg.edit(toEditOptions(updatedMsg));
        });
    }
}