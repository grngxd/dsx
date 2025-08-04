import { ActionRowBuilder, ButtonBuilder, Client, Message as DiscordMessage, EmbedBuilder, type MessageCreateOptions } from "discord.js";
import { runComponent } from "../hooks/signal";
import type { VNode } from "../types";
import { extractButtons, extractText, toEditOptions, wireInteractions } from "./utils";
const wiredBots = new WeakSet<Client>();

import { Description, Embed, Message, Title, type EmbedProps } from "../components";
const renderEmbed = (v: VNode<EmbedProps>): EmbedBuilder => {
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
            const prev = embed.data.description ?? "";
            const text = extractText(child.children);
            embed.setDescription(prev + (prev ? "\n" : "") + text);
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
        const ErrorComponent = ({ error }: { error: Error }) => (
            <Message>
                <Embed color={"Red"}>
                    <Title>💢 DSX</Title>
                    <Description>
                        {[
                            `Something went wrong while rendering the component.\n\n`,
                            `\`\`\`\n${error.message}\n\`\`\``,
                            error.stack ? `\`\`\`\n${error.stack.split("\n").slice(4, 6).join("\n")}\n...\n\`\`\`` : '',
                            `\n[See the docs](https://github.com/grngxd/dsx) for more info on this error.`
                        ]
                        .filter(Boolean)
                        .join("")}
                    </Description>
                </Embed>
            </Message>
        );

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

export const validateTree = (node: VNode, stack: string[] = []) => {
    const name = typeof node.type === "string" ? node.type : node.type?.name ?? "Unknown";
    stack.push(name);

    if (name === "Embed" && !stack.includes("Message")) {
        throw new Error(
        `<Embed> must be a child of <Message>.\nComponent stack:\n  ${stack.reverse().map(c => `<${c}>`).join("\n  ")}`
        );
    }

    const children = (node.props as any).children;
    if (children) {
        const arr = Array.isArray(children) ? children : [children];

        for (const child of arr) {
            if (typeof child === "object" && child !== null) {
                validateTree(child, [...stack]);
            }
        }
    }
}