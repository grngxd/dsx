import { ActionRowBuilder, ButtonBuilder, Client, Message as DiscordMessage, EmbedBuilder, type MessageCreateOptions } from "discord.js";
import { runComponent } from "../hooks/signal";
import { VNode } from "../types";
import { extractButtons, extractText, toEditOptions, wireInteractions } from "./utils";
const wiredBots = new WeakSet<Client>();

import { Description, Embed, Message, Title } from "../components";
import { renderEmbed } from "./renderers";

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
    const actions = [buttons].filter(row => row.length >= 1 && row.length <= 5); // Only valid rows

    const res: MessageCreateOptions = {};

    if (content) res.content = content;
    if (embeds.length > 0) res.embeds = embeds;
    if (actions.length > 0) {
        res.components = actions.map(row => new ActionRowBuilder<ButtonBuilder>().addComponents(...row));
    }

    if (embeds.length === 0 && content.length === 0) {
        throw new Error("DISCO: message must have either content or embeds");
    }

    return res;
}

export const mount = async (
    component: () => VNode,
    bot: Client,
    message: (msg: MessageCreateOptions) => Promise<DiscordMessage<false> | DiscordMessage<true>> | DiscordMessage<false> | DiscordMessage<true>
) => {
    if (!wiredBots.has(bot)) {
        wireInteractions(bot);
        wiredBots.add(bot);
    }

    let { result: vnode, hooks, effects } = runComponent(component);

    try {
        validateTree(vnode);
    } catch (error: any) {
        const msg = render(() => <ErrorComponent error={error} />);
        await message(msg);
        throw error;
    }

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

export const validateTree = (node: VNode, parentType?: string) => {
    const name = typeof node.type === "string" ? node.type : node.type?.name ?? "Unknown";

    // <Embed> must be a child of <Message>
    if (name === "Embed" && parentType !== "Message") {
        throw new Error(`<Embed> must be a child of <Message>`);
    }

    // <Description> can only be used once inside <Embed>
    if (name === "Embed") {
        const children = (node.props as any).children;
        if (children) {
            const arr = Array.isArray(children) ? children : [children];
            const descriptions = arr.filter((c: any) => c && c.type === "Description");
            if (descriptions.length > 1) {
                throw new Error(`<Description> can only be used once inside <Embed>`);
            }
        }
    }
    
    // <Actions> can only be used inside <Message>
    if (name === "Actions" && parentType !== "Message") {
        throw new Error(`<Actions> can only be used inside <Message>`);
    }

    const children = (node.props as any).children;
    if (children) {
        const arr = Array.isArray(children) ? children : [children];
        for (const child of arr) {
            if (typeof child === "object" && child !== null) {
                validateTree(child, name);
            }
        }
    }
}

// meta
const ErrorComponent = ({ error }: { error: Error }) => (
    <Message>
        <Embed color={"Red"}>
            <Title>💢 DSX{error.cause ? `: ${error.cause}` : ""}</Title>
            <Description>
                {[
                    `Something went wrong while rendering the component.\n`,
                    `${"```"}\n${error.message}\n${"```"}`,
                    error.stack ? `${"```"}js\n${error.stack.split("\n").slice(4, 6).join("\n")}\n...\n${"```"}` : '',
                    `\n[see the docs](https://github.com/grngxd/dsx) for more info on this error.`
                ]
                .filter(Boolean)
                .join("")}
            </Description>
        </Embed>
    </Message>
);