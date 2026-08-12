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

    let currentMsg = render(() => vnode);
    const sentMsg = await message(currentMsg);

    for (const effect of effects) {
        effect();
    }

    for (const state of hooks) {
        state.subscribers.add(async () => {
            const comp = runComponent(component, hooks);

            vnode = comp.result;
            hooks = comp.hooks;

            const updatedMsg = render(() => vnode);

            const sameComponents = JSON.stringify(updatedMsg.components) === JSON.stringify(currentMsg.components);
            const sameContent = (updatedMsg.content ?? "") === (currentMsg.content ?? "");
            const sameEmbeds = JSON.stringify(updatedMsg.embeds) === JSON.stringify(currentMsg.embeds);
            
            if (sameComponents && sameContent && sameEmbeds) return;

            await sentMsg.edit(toEditOptions(updatedMsg));

            currentMsg = updatedMsg;
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

    // Actions can only be used inside <Actions>
    if (["Button", "Dropdown"].includes(name) && parentType !== "Actions") {
        throw new Error(`<${name}> can only be used inside <Actions>`);
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

const formatStack = (error: Error) => {
    if (!error.stack) return "";

    const lines = error.stack.split("\n").slice(1);

    const filtered = lines.filter((line, i) => {
        if (
            line.includes("at validateTree") &&
            i > 0 &&
            lines[i - 1]?.includes("at validateTree")
        ) {
            return false;
        }

        return true;
    });

    return filtered.slice(0, 5).join("\n");
};

// meta
const ErrorComponent = ({ error }: { error: Error }) => (
    <Message>
        <Embed color={"Red"}>
            <Title>
                💢 DSX{error.cause ? `: ${error.cause}` : ""}
            </Title>

            <Description>
                {[
                    `something went wrong while rendering the component.\n`,
                    `${"```"}\n${error.message}\n${"```"}`,
                    error.stack
                        ? `\n${"```"}\n${formatStack(error)}\n...${"```"}`
                        : "",
                    `\n[see the docs](https://github.com/grngxd/dsx) for more info on this error.`,
                ]
                    .filter(Boolean)
                    .join("")}
            </Description>
        </Embed>
    </Message>
);