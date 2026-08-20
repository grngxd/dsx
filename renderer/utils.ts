import { ButtonBuilder, ButtonStyle, Client, Message as DiscordMessage, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, type MessageCreateOptions, type MessageEditOptions } from "discord.js";
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
): StringSelectMenuBuilder[] => {
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

                    if (option.emoji) {
                        o.setEmoji(option.emoji);
                    }

                    options.push(o);
                }
            }

            const id = String((props as any).id ?? "");

            const menu = new StringSelectMenuBuilder()
                .setCustomId(
                    encodeResume(component, id, hooks)
                )
                .setPlaceholder(props.placeholder ?? "")
                .addOptions(...options);

            menus.push(menu);
        }

        if (Array.isArray(node.children)) {
            node.children.forEach(child => {
                if (typeof child === "object" && child !== null) {
                    walk(child as VNode);
                }
            });
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
            !interaction.isStringSelectMenu()
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
        } else {
            const handler = getDropdownHandler(
                id,
                "onChange",
            );

            if (handler) {
                await handler(interaction.values[0]);
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