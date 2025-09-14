import { ActionRowBuilder, ButtonBuilder, Client, Message as DiscordMessage, EmbedBuilder, PartialMessage, StringSelectMenuBuilder, type MessageCreateOptions } from "discord.js";
import { runComponent } from "../hooks/signal";
import { VNode } from "../types";
import { extractButtons, extractDropdowns, extractText, toEditOptions, wireInteractions } from "./utils";
const wiredBots = new WeakSet<Client>();

import { Description, Embed, Message, reset, Title } from "../components";
import { renderEmbed } from "./renderers";

type DSXOptions = { renderErrors: boolean; }
let config: DSXOptions = { renderErrors: true };

export function dsx(options: Partial<DSXOptions>) {
    config = { ...config, ...options };
}

export const render = (component: () => VNode): MessageCreateOptions => {
    try {
        reset();
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
        const dropdowns = extractDropdowns(rendered);

        let res: MessageCreateOptions = {};

        if (content) res.content = content;
        if (embeds.length > 0) res.embeds = embeds;
        
        const components: any[] = [];

        if (buttons.length > 0) {
            components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons));
        }
        
        if (dropdowns.length > 0) {
            for (const menu of dropdowns) {
                components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu));
            }
        }

        if (components.length > 0) {
            res.components = components;
        }

        try {
            validateTree(rendered);
        } catch (error: any) {
            if (!config.renderErrors) throw error;
            res = render(() => <ErrorComponent error={error} />);
        }
            

        return res;
    } catch (error: any) {
        if (!config.renderErrors) throw error;
        return render(() => <ErrorComponent error={error} />);
    }
}

export const mount = async (
    component: () => VNode,
    bot: Client,
    /**
     * @example m => message.reply(m)
     */
    message: (
        msg: MessageCreateOptions
    ) => DiscordMessage<boolean> | Promise<DiscordMessage<boolean>>
): Promise<void> => {
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

            const sameComponents = JSON.stringify(updatedMsg.components) === JSON.stringify(initialMsg.components);
            const sameContent = (updatedMsg.content ?? "") === (initialMsg.content ?? "");
            const sameEmbeds = JSON.stringify(updatedMsg.embeds) === JSON.stringify(initialMsg.embeds);

            if (sameComponents && sameContent && sameEmbeds) return;
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
                    error.stack
                        ? `${"```"}\n${error.stack.split("\n").slice(1, 6).join("\n")}\n...[0;0m${"```"}`
                        : '',
                    `\n[see the docs](https://github.com/grngxd/dsx) for more info on this error.`
                ]
                .filter(Boolean)
                .join("")}
            </Description>
        </Embed>
    </Message>
);