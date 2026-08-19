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
                    const o = new StringSelectMenuOptionBuilder()
                        .setLabel(option.label)
                        .setDescription(option.description)
                        .setValue(option.value)
                        .setDefault(option.value === props.value);

                    if (option.emoji) o.setEmoji(option.emoji);
                    options.push(o);
                }
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId(String((props as any).id ?? ""))
                .setPlaceholder(props.placeholder ?? "")
                .addOptions(...options);
                
            menus.push(menu);
        }
        
        if (Array.isArray(node.children)) node.children.forEach(child => { if (typeof child === "object" && child !== null) walk(child as VNode); });
    }

    walk(root);
    return menus;
}

export const wireInteractions = (bot: Client) => {
    bot.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isButton()) {
            const handler = getButtonHandler(interaction.customId, "onClick");
            if (handler) handler();
            await interaction.deferUpdate();
        }

        if (interaction.isStringSelectMenu()) {
            const value = interaction.values[0];
            const handler = getDropdownHandler(interaction.customId, "onChange");
            if (handler) handler(value);
            await interaction.deferUpdate();
        }
    });
}

export const toEditOptions = (create: MessageCreateOptions): MessageEditOptions => {
    // const { content, embeds, components, files, flags, allowedMentions, enforceNonce, forward, nonce } = create;
    return { ...create } as MessageEditOptions;
}