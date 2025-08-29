import { ButtonBuilder, ButtonStyle, Client, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, type Interaction, type MessageCreateOptions, type MessageEditOptions } from "discord.js";
import { ButtonProps, DropdownProps, getButtonHandler, getDropdownHandler } from "../components";
import { VNode } from "../types";

export const extractText = (nodes: Array<VNode | string | number>): string => {
    return nodes.map(node =>
        typeof node === "string" || typeof node === "number"
            ? String(node)
            : node && typeof node === "object" && "children" in node
                ? extractText(node.children)
                : ""
    ).join("");
}

export const extractButtons = (vnode: VNode<ButtonProps>): ButtonBuilder[] => {
    const buttons: ButtonBuilder[] = [];
    
    const walk = (node: VNode) => {
        if (node.type === "Button") {
            const props = node.props as ButtonProps;
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

export const extractDropdowns = (root: VNode): StringSelectMenuBuilder[] => {
    const menus: StringSelectMenuBuilder[] = [];
    const walk = (node: VNode) => {
        if (node.type === "Dropdown") {
            const props = node.props as DropdownProps;
            const options: StringSelectMenuOptionBuilder[] = [];
            if (props.options) {
                for (const option of props.options) {
                    options.push(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(option.label)
                            .setDescription(option.description)
                            .setValue(option.value)
                    );
                }
            }
            const menu = new StringSelectMenuBuilder()
                .setCustomId(String((props as any).id ?? ""))
                .setPlaceholder(props.placeholder ?? "")
                .addOptions(...options);
            menus.push(menu);
        }
        if (Array.isArray(node.children)) {
            node.children.forEach(child => {
                if (typeof child === "object" && child !== null) walk(child as VNode);
            });
        }
    }
    walk(root);
    return menus;
}

export const wireInteractions = (bot: Client) => {
    bot.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isButton()) {
            const id = Number(interaction.customId);
            const handler = getButtonHandler(id, "onClick");
            if (handler) handler();
            await interaction.deferUpdate();
        }

        if (interaction.isStringSelectMenu()) {
            const id = Number(interaction.customId);
            const handler = getDropdownHandler(id, "onChange");
            if (handler) handler(interaction.values[0]);
            await interaction.deferUpdate();
        }
    });
}

export const toEditOptions = (create: MessageCreateOptions): MessageEditOptions => {
    const { content, embeds, components, files } = create;
    return { content, embeds, components, files };
}