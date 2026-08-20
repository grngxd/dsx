import { ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, Client, Message as DiscordMessage, MentionableSelectMenuBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, type MessageCreateOptions, type MessageEditOptions } from "discord.js";
import { runComponent } from "hooks/signal";
import { render } from "renderer";
import { ButtonProps, DropdownProps, getButtonHandler, getDropdownHandler } from "../components";
import { VNode } from "../types";
import { components, decodeResume, encodeResume } from "./resumability";

export const renderText = (nodes: Array<VNode | string | number>): string => {
    return nodes.map(node =>
        typeof node === "string" || typeof node === "number"
            ? String(node)
            : node && typeof node === "object" && "children" in node
                ? renderText(node.children)
                : ""
    ).join("");
};

export const renderButtons = (
    vnode: VNode<ButtonProps>,
    component: number,
    hooks: unknown[],
): ButtonBuilder[] => {
    const buttons: ButtonBuilder[] = [];

    const walk = (node: VNode) => {
        if (node.type === "Button") {
            const props = node.props as ButtonProps;
            const id = String((props as any).id ?? "");

            const btn =  new ButtonBuilder()
                .setLabel(renderText(node.children))
                .setStyle(props.style ?? ButtonStyle.Primary)
            
            if (props.disabled !== undefined) btn.setDisabled(props.disabled);

            if (props.emoji) btn.setEmoji(props.emoji);

            if (props.style === ButtonStyle.Link) {
                if (!props.url) {
                    throw new Error(
                        `<Button style={Link}> requires a url`
                    );
                }

                btn.setURL(props.url);
            } else {
                btn.setCustomId(
                    encodeResume(component, id, hooks)
                );
            }

            buttons.push(
                // new ButtonBuilder()
                //     .setCustomId(
                //         encodeResume(component, id, hooks)
                //     )
                //     .setLabel(renderText(node.children))    
                //     .setStyle(props.style ?? ButtonStyle.Primary)
                btn
            );
        }

        if (Array.isArray(node.children)) {
            node.children.forEach(child => {
                if (typeof child === "object" && child !== null) {
                    walk(child as VNode);
                }
            });
        }
    };

    walk(vnode);
    return buttons;
};

export const renderDropdowns = (
    root: VNode,
    component: number,
    hooks: unknown[],
): (
    | StringSelectMenuBuilder
    | UserSelectMenuBuilder
    | RoleSelectMenuBuilder
    | ChannelSelectMenuBuilder
    | MentionableSelectMenuBuilder
)[] => {
    const menus: (
        | StringSelectMenuBuilder
        | UserSelectMenuBuilder
        | RoleSelectMenuBuilder
        | ChannelSelectMenuBuilder
        | MentionableSelectMenuBuilder
    )[] = [];

    const walk = (node: VNode) => {
        if (node.type === "Dropdown") {
            const props = node.props as DropdownProps;
            const id = String((props as any).id ?? "");

            const customId = encodeResume(
                component,
                id,
                hooks,
            );

            const minValues = props.minValues ?? 1;
            const maxValues = props.maxValues ?? 1;

            if (props.type === "string") {
                const menu = new StringSelectMenuBuilder()
                    .setCustomId(customId)
                    .setPlaceholder(
                        props.placeholder ?? "Select an option"
                    )
                    .setDisabled(props.disabled ?? false)
                    .setMinValues(minValues)
                    .setMaxValues(maxValues);

                const selected = props.value === undefined
                    ? []
                    : Array.isArray(props.value)
                        ? props.value
                        : [props.value];

                for (const option of props.options) {
                    const item = new StringSelectMenuOptionBuilder()
                        .setLabel(option.label)
                        .setValue(option.value);

                    if (option.description !== undefined) {
                        item.setDescription(option.description);
                    }

                    if (option.emoji !== undefined) {
                        item.setEmoji(option.emoji);
                    }

                    if (
                        option.default === true ||
                        selected.includes(option.value)
                    ) {
                        item.setDefault(true);
                    }

                    menu.addOptions(item);
                }

                menus.push(menu);
            }

            if (props.type === "user") {
                const menu = new UserSelectMenuBuilder()
                    .setCustomId(customId)
                    .setPlaceholder(
                        props.placeholder ?? "Select users"
                    )
                    .setDisabled(props.disabled ?? false)
                    .setMinValues(minValues)
                    .setMaxValues(maxValues);

                if (props.defaultUsers?.length) {
                    menu.addDefaultUsers(
                        ...props.defaultUsers
                    );
                }

                menus.push(menu);
            }

            if (props.type === "role") {
                const menu = new RoleSelectMenuBuilder()
                    .setCustomId(customId)
                    .setPlaceholder(
                        props.placeholder ?? "Select roles"
                    )
                    .setDisabled(props.disabled ?? false)
                    .setMinValues(minValues)
                    .setMaxValues(maxValues);

                if (props.defaultRoles?.length) {
                    menu.addDefaultRoles(
                        ...props.defaultRoles
                    );
                }

                menus.push(menu);
            }

            if (props.type === "channel") {
                const menu = new ChannelSelectMenuBuilder()
                    .setCustomId(customId)
                    .setPlaceholder(
                        props.placeholder ?? "Select channels"
                    )
                    .setDisabled(props.disabled ?? false)
                    .setMinValues(minValues)
                    .setMaxValues(maxValues);

                if (props.channelTypes?.length) {
                    menu.addChannelTypes(
                        ...props.channelTypes
                    );
                }

                if (props.defaultChannels?.length) {
                    menu.addDefaultChannels(
                        ...props.defaultChannels
                    );
                }

                menus.push(menu);
            }

            if (props.type === "mentionable") {
                const menu = new MentionableSelectMenuBuilder()
                    .setCustomId(customId)
                    .setPlaceholder(
                        props.placeholder ??
                        "Select users or roles"
                    )
                    .setDisabled(props.disabled ?? false)
                    .setMinValues(minValues)
                    .setMaxValues(maxValues);

                if (props.defaultUsers?.length) {
                    menu.addDefaultUsers(
                        ...props.defaultUsers
                    );
                }

                if (props.defaultRoles?.length) {
                    menu.addDefaultRoles(
                        ...props.defaultRoles
                    );
                }

                menus.push(menu);
            }
        }

        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                if (
                    typeof child === "object" &&
                    child !== null
                ) {
                    walk(child as VNode);
                }
            }
        }
    };

    walk(root);

    return menus;
};

const runtimes = new Map<string, {
    component: () => VNode;
    componentId: number;
    hooks: any[];
    message: DiscordMessage<boolean>;
    rerender: () => Promise<void>;
}>();

export const wireInteractions = (bot: Client) => {
    bot.on("interactionCreate", async interaction => {
        if (
            !interaction.isButton() &&
            !interaction.isAnySelectMenu()
        ) {
            return;
        }

        const messageId = interaction.message.id;
        const resume = decodeResume(interaction.customId);

        if (!resume) {
            await interaction.deferUpdate();
            return;
        }

        const [componentId, id, values] = resume;

        let runtime = runtimes.get(messageId);

        if (!runtime) {
            const component = components.get(componentId);

            if (!component) {
                await interaction.deferUpdate();
                return;
            }

            const restored = runComponent(
                component,
                undefined,
                values,
            );

            runtime = {
                component,
                componentId,
                hooks: restored.hooks,
                message: interaction.message,
                rerender: async () => {},
            };

            const subscribed = new Set<any>();

            const bind = () => {
                for (const state of runtime!.hooks) {
                    if (subscribed.has(state)) continue;

                    subscribed.add(state);
                    state.subscribers.add(runtime!.rerender);
                }
            };

            runtime.rerender = async () => {
                const next = runComponent(
                    runtime!.component,
                    runtime!.hooks,
                );

                runtime!.hooks = next.hooks;

                const updatedMsg = render(
                    next.result,
                    runtime!.componentId,
                    runtime!.hooks.map(
                        state => state.value
                    ),
                );

                await runtime!.message.edit(
                    toEditOptions(updatedMsg),
                );

                for (const effect of next.effects) {
                    await effect();
                }

                bind();
            };

            for (const effect of restored.effects) {
                await effect();
            }

            bind();

            runtimes.set(messageId, runtime);
        }

        if (interaction.isButton()) {
            const handler = getButtonHandler(
                id,
                "onClick",
            );

            if (handler) {
                await handler(interaction.message);
            }
        } if (interaction.isAnySelectMenu()) {
            const handler = getDropdownHandler(
                id,
                "onChange",
            );

            if (handler) {
                await handler(interaction.values);
            }
        }

        await interaction.deferUpdate();
    });
};

export const toEditOptions = (
    create: MessageCreateOptions
): MessageEditOptions => {
    return { ...create } as MessageEditOptions;
};