import { ButtonBuilder, ButtonStyle, Client, type Interaction, type MessageCreateOptions, type MessageEditOptions } from "discord.js";
import { getButtonHandler } from "../components";
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

export const extractButtons = (vnode: VNode): ButtonBuilder[] => {
    const buttons: ButtonBuilder[] = [];
    
    function walk(node: VNode) {
        if (node.type === "Button") {
            const props = node.props as import("../components").ButtonProps;
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(String((props as any).id ?? ""))
                    .setLabel(extractText(node.children))
                    .setStyle(props.style ?? ButtonStyle.Primary)
            );
        }
        if (Array.isArray(node.children)) {
            node.children.forEach(child => {
                if (typeof child === "object" && child !== null) walk(child as VNode);
            });
        }
    }

    walk(vnode);

    return buttons;
}

export const wireInteractions = (bot: Client) => {
    bot.on("interactionCreate", async (interaction: Interaction) => {
        if (!interaction.isButton()) return;

        const id = Number(interaction.customId);
        const handler = getButtonHandler(id, "onClick");
        if (handler) handler();

        await interaction.deferUpdate();
    });
}

export const toEditOptions = (create: MessageCreateOptions): MessageEditOptions => {
    const { content, embeds, components, files } = create;
    return { content, embeds, components, files };
}