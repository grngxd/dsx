import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, Client, ContainerBuilder, Message as DiscordMessage, EmbedBuilder, FileBuilder, InteractionResponse, MediaGalleryBuilder, MediaGalleryItemBuilder, MentionableSelectMenuBuilder, MessageFlags, RoleSelectMenuBuilder, SectionBuilder, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder, ThumbnailBuilder, UserSelectMenuBuilder, type MessageCreateOptions } from "discord.js";
import { ButtonProps, Description, DropdownProps, Embed, Message, MessageProps, Title, type ContainerProps, type FileProps, type MediaProps, type SeparatorProps, type ThumbnailProps } from "../components";
import { runComponent } from "../hooks/signal";
import { VNode } from "../types";
import { renderEmbed } from "./renderers";
import { encodeResume, getComponentId } from "./resumability";
import { renderButtons, renderDropdowns, renderText, toEditOptions, wireInteractions } from "./utils";

const wiredBots = new WeakSet<Client>();

type DSXOptions = { renderErrors: boolean; }
let config: DSXOptions = { renderErrors: true };

export function dsx(bot: Client, options?: Partial<DSXOptions>) {
    if (options) config = { ...config, ...options };

    if (!wiredBots.has(bot)) {
        wireInteractions(bot);
        wiredBots.add(bot);
    }
}

export const render = (
    rendered: VNode,
    component: number,
    hooks: unknown[],
): MessageCreateOptions => {
    try {
        if (rendered.type !== "Message") {
            throw new Error("Root element must be <Message>");
        }

        if ((rendered.props as any).v2) {
            return renderV2(rendered, component, hooks);
        }

        return renderLegacy(rendered, component, hooks);
    } catch (error: any) {
        if (!config.renderErrors) throw error;
        return render(
            <ErrorComponent error={error} />,
            component,
            hooks,
        );
    }
};

export const renderLegacy = (
    rendered: VNode,
    component: number,
    hooks: unknown[],
): MessageCreateOptions => {
    let content = "";
    const embeds: EmbedBuilder[] = [];

    for (const child of rendered.children) {
        if (child === null || child === undefined) continue;

        if (typeof child === "string" || typeof child === "number") {
            content += String(child);
        } else if (child.type === "Embed") {
            embeds.push(renderEmbed(child));
        } else if (child.type === "Description") {
            content += renderText(child.children);
        }
    }

    content = content.trim();

    const buttons = renderButtons(
        rendered,
        component,
        hooks,
    );

    const dropdowns = renderDropdowns(
        rendered,
        component,
        hooks,
    );

    const components: any[] = [];

    if (buttons.length > 0) {
        // components.push(
        //     new ActionRowBuilder<ButtonBuilder>()
        //         .addComponents(...buttons)
        // );
        for (let i = 0; i < buttons.length; i += 5) {
            components.push(
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(...buttons.slice(i, i + 5))
            );
        }
    }

    if (dropdowns.length > 0) {
        for (const menu of dropdowns) {
            components.push(
                new ActionRowBuilder<
                    | StringSelectMenuBuilder
                    | ChannelSelectMenuBuilder
                    | RoleSelectMenuBuilder
                    | UserSelectMenuBuilder
                    | MentionableSelectMenuBuilder
                >()
                    .addComponents(menu)
            );
        }
    }

    const res: MessageCreateOptions = {};

    if (content) res.content = content;
    if (embeds.length > 0) res.embeds = embeds;
    if (components.length > 0) res.components = components;

    try {
        validateLegacy(rendered);
    } catch (error: any) {
        if (!config.renderErrors) throw error;
        return render(
            <ErrorComponent error={error} />,
            component,
            hooks,
        );
    }

    return res;
};

export const renderV2 = (
    rendered: VNode,
    component: number,
    hooks: unknown[]
): MessageCreateOptions => {
    const components: any[] = [];

    for (const child of rendered.children) {
        if (child === null || child === undefined) continue;

        if (child.type === "TextDisplay") {
            components.push(
                new TextDisplayBuilder()
                    .setContent(renderText(child.children))
            );

        } else if (child.type === "Separator") {
            const props = child.props as SeparatorProps;

            const separator = new SeparatorBuilder()
                .setDivider(props.divider ?? true);

            if (props.spacing !== undefined) {
                separator.setSpacing(props.spacing);
            }

            components.push(separator);

        } else if (child.type === "MediaGallery") {
            const gallery = new MediaGalleryBuilder();

            for (const media of child.children) {
                if (media === null || media === undefined) continue;

                const props = media.props as MediaProps;

                const item = new MediaGalleryItemBuilder()
                    .setURL(props.url);

                if (props.description !== undefined) {
                    item.setDescription(props.description);
                }

                if (props.spoiler !== undefined) {
                    item.setSpoiler(props.spoiler);
                }

                gallery.addItems(item);
            }

            components.push(gallery);

        } else if (child.type === "File") {
            const props = child.props as FileProps;

            const file = new FileBuilder()
                .setURL(props.url);

            if (props.spoiler !== undefined) {
                file.setSpoiler(props.spoiler);
            }

            components.push(file);

        } else if (child.type === "Section") {
            const section = new SectionBuilder();

            for (const nested of child.children) {
                if (nested === null || nested === undefined) continue;

                if (nested.type === "TextDisplay") {
                    section.addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(renderText(nested.children))
                    );

                } else if (nested.type === "Thumbnail") {
                    const props = nested.props as ThumbnailProps;

                    const thumbnail = new ThumbnailBuilder()
                        .setURL(props.url);

                    if (props.description !== undefined) {
                        thumbnail.setDescription(props.description);
                    }

                    if (props.spoiler !== undefined) {
                        thumbnail.setSpoiler(props.spoiler);
                    }

                    section.setThumbnailAccessory(thumbnail);
                } else if (nested.type === "Button") {
                    const props = nested.props as ButtonProps;

                    const button = new ButtonBuilder()
                        .setLabel(renderText(nested.children))
                        .setStyle(props.style ?? ButtonStyle.Primary);

                    if (props.disabled !== undefined) {
                        button.setDisabled(props.disabled);
                    }

                    if (props.emoji) {
                        button.setEmoji(props.emoji);
                    }

                    if (props.style === ButtonStyle.Link) {
                        if (!props.url) {
                            throw new Error(
                                `<Button style={Link}> requires a url`
                            );
                        }

                        button.setURL(props.url);
                    } else {
                        button.setCustomId(
                            encodeResume(
                                component,
                                String((props as any).id ?? ""),
                                hooks,
                            )
                        );
                    }

                    section.setButtonAccessory(button);
                }
            }

            components.push(section);

        } else if (child.type === "Container") {
            const props = child.props as ContainerProps;

            const container = new ContainerBuilder();

            if (props.accentColor !== undefined) {
                container.setAccentColor(props.accentColor);
            }

            if (props.spoiler !== undefined) {
                container.setSpoiler(props.spoiler);
            }

            for (const nested of child.children) {
                if (nested === null || nested === undefined) continue;

                if (nested.type === "TextDisplay") {
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(renderText(nested.children))
                    );

                } else if (nested.type === "Separator") {
                    const props = nested.props as SeparatorProps;

                    const separator = new SeparatorBuilder()
                        .setDivider(props.divider ?? true);

                    if (props.spacing !== undefined) {
                        separator.setSpacing(props.spacing);
                    }

                    container.addSeparatorComponents(separator);

                } else if (nested.type === "Section") {
                    const section = new SectionBuilder();

                    for (const sectionChild of nested.children) {
                        if (
                            sectionChild === null ||
                            sectionChild === undefined
                        ) continue;

                        if (sectionChild.type === "TextDisplay") {
                            section.addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent(
                                        renderText(sectionChild.children)
                                    )
                            );

                        } else if (sectionChild.type === "Thumbnail") {
                            const props =
                                sectionChild.props as ThumbnailProps;

                            const thumbnail = new ThumbnailBuilder()
                                .setURL(props.url);

                            if (props.description !== undefined) {
                                thumbnail.setDescription(
                                    props.description
                                );
                            }

                            if (props.spoiler !== undefined) {
                                thumbnail.setSpoiler(props.spoiler);
                            }

                            section.setThumbnailAccessory(thumbnail);
                        } else if (sectionChild.type === "Button") {
                            const props = sectionChild.props as ButtonProps;

                            const button = new ButtonBuilder()
                                .setLabel(
                                    renderText(sectionChild.children)
                                )
                                .setStyle(
                                    props.style ?? ButtonStyle.Primary
                                );

                            if (props.disabled !== undefined) {
                                button.setDisabled(props.disabled);
                            }

                            if (props.emoji) {
                                button.setEmoji(props.emoji);
                            }

                            if (props.style === ButtonStyle.Link) {
                                if (!props.url) {
                                    throw new Error(
                                        `<Button style={Link}> requires a url`
                                    );
                                }

                                button.setURL(props.url);
                            } else {
                                button.setCustomId(
                                    encodeResume(
                                        component,
                                        String((props as any).id ?? ""),
                                        hooks,
                                    )
                                );
                            }

                            section.setButtonAccessory(button);
                        }
                    }

                    container.addSectionComponents(section);

                } else if (nested.type === "MediaGallery") {
                    const gallery = new MediaGalleryBuilder();

                    for (const media of nested.children) {
                        if (media === null || media === undefined) continue;

                        const props = media.props as MediaProps;

                        const item = new MediaGalleryItemBuilder()
                            .setURL(props.url);

                        if (props.description !== undefined) {
                            item.setDescription(props.description);
                        }

                        if (props.spoiler !== undefined) {
                            item.setSpoiler(props.spoiler);
                        }

                        gallery.addItems(item);
                    }

                    container.addMediaGalleryComponents(gallery);

                } else if (nested.type === "File") {
                    const props = nested.props as FileProps;

                    const file = new FileBuilder()
                        .setURL(props.url);

                    if (props.spoiler !== undefined) {
                        file.setSpoiler(props.spoiler);
                    }

                    container.addFileComponents(file);

                } else if (nested.type === "Actions") {
                    const buttons = renderButtons(nested, component, hooks);
                    const dropdowns = renderDropdowns(nested, component, hooks);

                    if (buttons.length > 0) {
                        container.addActionRowComponents(
                            new ActionRowBuilder<ButtonBuilder>()
                                .addComponents(...buttons)
                        );
                    }

                    if (dropdowns.length > 0) {
                        for (const menu of dropdowns) {
                            container.addActionRowComponents(
                                new ActionRowBuilder<
                                    | StringSelectMenuBuilder
                                    | ChannelSelectMenuBuilder
                                    | RoleSelectMenuBuilder
                                    | UserSelectMenuBuilder
                                    | MentionableSelectMenuBuilder
                                >()
                                    .addComponents(menu)
                            );
                        }
                    }
                }
            }

            components.push(container);

        } else if (child.type === "Actions") {
            const buttons = renderButtons(child, component, hooks);
            const dropdowns = renderDropdowns(child, component, hooks);

            if (buttons.length > 0) {
                components.push(
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(...buttons)
                );
            }

            if (dropdowns.length > 0) {
                for (const menu of dropdowns) {
                    components.push(
                        new ActionRowBuilder<
                            | StringSelectMenuBuilder
                            | ChannelSelectMenuBuilder
                            | RoleSelectMenuBuilder
                            | UserSelectMenuBuilder
                            | MentionableSelectMenuBuilder
                        >()
                            .addComponents(menu)
                    );
                }
            }
        }
    }

    const res: MessageCreateOptions = {
        flags: MessageFlags.IsComponentsV2,
        components,
    };

    try {
        validateV2(rendered);
    } catch (error: any) {
        if (!config.renderErrors) throw error;
        return render(
            <ErrorComponent error={error} />,
            component,
            hooks,
        );
    }

    return res;
};

export const mount = async (
    component: () => VNode,
    bot: Client,
    /**
     * @example m => message.reply(m)
     */
    message: (
        msg: MessageCreateOptions
    ) => DiscordMessage<boolean>
        | Promise<DiscordMessage<boolean>>
        | InteractionResponse<boolean>
        | Promise<InteractionResponse<boolean>>,
    values?: unknown[],
): Promise<void> => {
    const componentId = getComponentId(component);

    if (componentId === undefined) {
        throw new Error(
            "This component is not resumable. Wrap it with component()."
        );
    }

    let { result: vnode, hooks, effects } = runComponent(
        component,
        undefined,
        values,
    );

    let currentMsg = render(
        vnode,
        componentId,
        hooks.map(state => state.value),
    );
    const sentMsg = await message(currentMsg);

    for (const effect of effects) {
        effect();
    }

    for (const state of hooks) {
        state.subscribers.add(async () => {
            const comp = runComponent(component, hooks);

            vnode = comp.result;
            hooks = comp.hooks;

            const updatedMsg = render(
                vnode,
                componentId,
                hooks.map(state => state.value),
            );

            const sameComponents = JSON.stringify(updatedMsg.components) === JSON.stringify(currentMsg.components);
            const sameContent = (updatedMsg.content ?? "") === (currentMsg.content ?? "");
            const sameEmbeds = JSON.stringify(updatedMsg.embeds) === JSON.stringify(currentMsg.embeds);
            
            if (sameComponents && sameContent && sameEmbeds) return;

            await sentMsg.edit(toEditOptions(updatedMsg));

            currentMsg = updatedMsg;
        });
    }
}

export const validateLegacy = (
    node: VNode,
    parentType?: string
) => {
    const name =
        typeof node.type === "string"
            ? node.type
            : node.type?.name ?? "Unknown";

    const children = Array.isArray(node.children)
        ? node.children
        : [];

    if (name === "Message") {
        if (parentType) {
            throw new Error(`<Message> cannot be nested inside <${parentType}>`);
        }

        if ((node.props as MessageProps).v2) {
            throw new Error(
                `<Message v2> must be rendered as a v2 message`
            );
        }

        let rows = 0;

        for (const child of children) {
            if (
                typeof child === "string" ||
                typeof child === "number"
            ) {
                continue;
            }

            if (!child || typeof child !== "object") {
                throw new Error(
                    `Invalid child inside <Message>`
                );
            }

            const childName =
                typeof child.type === "string"
                    ? child.type
                    : child.type?.name ?? "Unknown";

            if (childName === "Actions") {
                let buttons = 0;
                let dropdowns = 0;

                for (const action of child.children) {
                    if (
                        !action ||
                        typeof action !== "object"
                    ) {
                        throw new Error(
                            `Only <Button> and <Dropdown> can be used inside <Actions>`
                        );
                    }

                    const actionName =
                        typeof action.type === "string"
                            ? action.type
                            : action.type?.name ?? "Unknown";

                    if (actionName === "Button") {
                        buttons++;
                    } else if (actionName === "Dropdown") {
                        dropdowns++;
                    } else {
                        throw new Error(
                            `<${actionName}> cannot be used inside <Actions>`
                        );
                    }
                }

                if (buttons > 25) {
                    throw new Error(
                        `<Actions> can contain at most 25 buttons`
                    );
                }

                if (buttons > 0) {
                    rows += Math.ceil(buttons / 5);
                }

                rows += dropdowns;
                continue;
            }

            if (
                childName !== "Embed" &&
                childName !== "Description"
            ) {
                throw new Error(
                    `<${childName}> cannot be used directly inside <Message>`
                );
            }
        }

        if (rows > 5) {
            throw new Error(
                `A message can contain at most 5 component rows`
            );
        }
    }

    if (name === "Embed") {
        if (parentType !== "Message") {
            throw new Error(
                `<Embed> must be a child of <Message>`
            );
        }

        let titles = 0;
        let descriptions = 0;
        let fields = 0;

        for (const child of children) {
            if (
                typeof child === "string" ||
                typeof child === "number"
            ) {
                continue;
            }

            if (!child || typeof child !== "object") {
                throw new Error(
                    `Invalid child inside <Embed>`
                );
            }

            const childName =
                typeof child.type === "string"
                    ? child.type
                    : child.type?.name ?? "Unknown";

            if (childName === "Title") {
                titles++;
            } else if (childName === "Description") {
                descriptions++;
            } else if (childName === "Fields") {
                fields += child.children.filter(
                    (field: any) =>
                        field &&
                        typeof field === "object" &&
                        field.type === "Field"
                ).length;
            } else {
                throw new Error(
                    `<${childName}> cannot be used inside <Embed>`
                );
            }
        }

        if (titles > 1) {
            throw new Error(
                `<Embed> can only contain one <Title>`
            );
        }

        if (descriptions > 1) {
            throw new Error(
                `<Embed> can only contain one <Description>`
            );
        }

        if (fields > 25) {
            throw new Error(
                `<Embed> can contain at most 25 <Field> components`
            );
        }
    }

    if (name === "Description") {
        if (
            parentType !== "Message" &&
            parentType !== "Embed" &&
            parentType !== "Field"
        ) {
            throw new Error(
                `<Description> can only be used inside <Message>, <Embed>, or <Field>`
            );
        }
    }

    if (name === "Title") {
        if (
            parentType !== "Embed" &&
            parentType !== "Field"
        ) {
            throw new Error(
                `<Title> can only be used inside <Embed> or <Field>`
            );
        }
    }

    if (name === "Fields") {
        if (parentType !== "Embed") {
            throw new Error(
                `<Fields> must be a child of <Embed>`
            );
        }

        if (
            children.length > 25
        ) {
            throw new Error(
                `<Fields> can contain at most 25 <Field> components`
            );
        }

        for (const child of children) {
            if (
                !child ||
                typeof child !== "object" ||
                child.type !== "Field"
            ) {
                throw new Error(
                    `<Fields> can only contain <Field>`
                );
            }
        }
    }

    if (name === "Field") {
        if (parentType !== "Fields") {
            throw new Error(
                `<Field> must be a child of <Fields>`
            );
        }

        let titles = 0;
        let descriptions = 0;

        for (const child of children) {
            if (
                typeof child === "string" ||
                typeof child === "number"
            ) {
                continue;
            }

            if (!child || typeof child !== "object") {
                continue;
            }

            if (child.type === "Title") {
                titles++;
            } else if (child.type === "Description") {
                descriptions++;
            } else {
                throw new Error(
                    `<${child.type}> cannot be used inside <Field>`
                );
            }
        }

        if (titles !== 1) {
            throw new Error(
                `<Field> must contain exactly one <Title>`
            );
        }

        if (descriptions !== 1) {
            throw new Error(
                `<Field> must contain exactly one <Description>`
            );
        }
    }

    if (name === "Actions") {
        if (parentType !== "Message") {
            throw new Error(
                `<Actions> must be a child of <Message>`
            );
        }

        if (children.length === 0) {
            throw new Error(
                `<Actions> cannot be empty`
            );
        }

        for (const child of children) {
            if (!child || typeof child !== "object") {
                throw new Error(
                    `<Actions> can only contain <Button> and <Dropdown>`
                );
            }

            if (
                child.type !== "Button" &&
                child.type !== "Dropdown"
            ) {
                throw new Error(
                    `<${child.type}> cannot be used inside <Actions>`
                );
            }
        }
    }

    if (name === "Button") {
        if (parentType !== "Actions") {
            throw new Error(
                `<Button> must be a child of <Actions>`
            );
        }

        const props = node.props as ButtonProps;

        if (props.style === ButtonStyle.Link) {
            if (!props.url) {
                throw new Error(
                    `<Button style={Link}> requires a url`
                );
            }
        } else if ("url" in props && props.url) {
            throw new Error(
                `Only link buttons can have a url`
            );
        }
    }

    if (name === "Dropdown") {
        if (parentType !== "Actions") {
            throw new Error(
                `<Dropdown> must be a child of <Actions>`
            );
        }

        const props = node.props as DropdownProps;

        const min = props.minValues ?? 1;
        const max = props.maxValues ?? 1;

        if (min < 0 || min > 25) {
            throw new Error(
                `<Dropdown> minValues must be between 0 and 25`
            );
        }

        if (max < 1 || max > 25) {
            throw new Error(
                `<Dropdown> maxValues must be between 1 and 25`
            );
        }

        if (min > max) {
            throw new Error(
                `<Dropdown> minValues cannot be greater than maxValues`
            );
        }

        if (props.type === "string") {
            if (
                props.options.length === 0 ||
                props.options.length > 25
            ) {
                throw new Error(
                    `<Dropdown type="string"> must contain between 1 and 25 options`
                );
            }

            const values = new Set<string>();

            for (const option of props.options) {
                if (values.has(option.value)) {
                    throw new Error(
                        `<Dropdown> option values must be unique`
                    );
                }

                values.add(option.value);
            }

            if (max > props.options.length) {
                throw new Error(
                    `<Dropdown> maxValues cannot exceed the number of options`
                );
            }

            const selected = props.value === undefined
                ? []
                : Array.isArray(props.value)
                    ? props.value
                    : [props.value];

            for (const value of selected) {
                if (!values.has(value)) {
                    throw new Error(
                        `<Dropdown> value "${value}" does not exist in its options`
                    );
                }
            }
        }
    }

    for (const child of children) {
        if (
            typeof child === "object" &&
            child !== null
        ) {
            validateLegacy(child, name);
        }
    }
};


export const validateV2 = (
    node: VNode,
    parentType?: string
) => {
    const name =
        typeof node.type === "string"
            ? node.type
            : node.type?.name ?? "Unknown";

    const children = Array.isArray(node.children)
        ? node.children
        : [];

    if (name === "Message") {
        if (parentType) {
            throw new Error(
                `<Message> cannot be nested`
            );
        }

        if (!(node.props as MessageProps).v2) {
            throw new Error(
                `<Message> must have the v2 prop for v2 messages`
            );
        }

        for (const child of children) {
            if (
                typeof child === "string" ||
                typeof child === "number"
            ) {
                throw new Error(
                    `Raw text cannot be used directly inside <Message v2>`
                );
            }

            if (!child || typeof child !== "object") {
                throw new Error(
                    `Invalid child inside <Message v2>`
                );
            }

            if (
                ![
                    "TextDisplay",
                    "Separator",
                    "MediaGallery",
                    "File",
                    "Section",
                    "Container",
                    "Actions",
                ].includes(child.type)
            ) {
                throw new Error(
                    `<${child.type}> cannot be used directly inside <Message v2>`
                );
            }
        }
    }

    if (name === "Container") {
        if (parentType !== "Message") {
            throw new Error(
                `<Container> must be a child of <Message>`
            );
        }

        for (const child of children) {
            if (
                !child ||
                typeof child !== "object" ||
                ![
                    "TextDisplay",
                    "Separator",
                    "Section",
                    "MediaGallery",
                    "File",
                    "Actions",
                ].includes(child.type)
            ) {
                throw new Error(
                    `<${
                        child?.type ?? "Unknown"
                    }> cannot be used inside <Container>`
                );
            }
        }
    }

    if (name === "TextDisplay") {
        if (
            ![
                "Message",
                "Container",
                "Section",
            ].includes(parentType ?? "")
        ) {
            throw new Error(
                `<TextDisplay> can only be used inside <Message>, <Container>, or <Section>`
            );
        }
    }

    if (name === "Separator") {
        if (
            ![
                "Message",
                "Container",
            ].includes(parentType ?? "")
        ) {
            throw new Error(
                `<Separator> can only be used inside <Message> or <Container>`
            );
        }
    }

    if (name === "Section") {
        if (
            ![
                "Message",
                "Container",
            ].includes(parentType ?? "")
        ) {
            throw new Error(
                `<Section> can only be used inside <Message> or <Container>`
            );
        }

        let textDisplays = 0;
        let accessories = 0;

        for (const child of children) {
            if (!child || typeof child !== "object") {
                throw new Error(
                    `<Section> can only contain <TextDisplay>, <Button>, or <Thumbnail>`
                );
            }

            if (child.type === "TextDisplay") {
                textDisplays++;
            } else if (
                child.type === "Button" ||
                child.type === "Thumbnail"
            ) {
                accessories++;
            } else {
                throw new Error(
                    `<${child.type}> cannot be used inside <Section>`
                );
            }
        }

        if (textDisplays < 1 || textDisplays > 3) {
            throw new Error(
                `<Section> must contain between 1 and 3 <TextDisplay> components`
            );
        }

        if (accessories !== 1) {
            throw new Error(
                `<Section> must contain exactly one Button or Thumbnail`
            );
        }
    }

    if (name === "Thumbnail") {
        if (parentType !== "Section") {
            throw new Error(
                `<Thumbnail> must be a child of <Section>`
            );
        }
    }

    if (name === "MediaGallery") {
        if (
            parentType !== "Message" &&
            parentType !== "Container"
        ) {
            throw new Error(
                `<MediaGallery> can only be used inside <Message> or <Container>`
            );
        }

        if (
            children.length === 0 ||
            children.length > 10
        ) {
            throw new Error(
                `<MediaGallery> must contain between 1 and 10 <Media> components`
            );
        }

        for (const child of children) {
            if (
                !child ||
                typeof child !== "object" ||
                child.type !== "Media"
            ) {
                throw new Error(
                    `<MediaGallery> can only contain <Media>`
                );
            }
        }
    }

    if (name === "Media") {
        if (parentType !== "MediaGallery") {
            throw new Error(
                `<Media> must be a child of <MediaGallery>`
            );
        }
    }

    if (name === "File") {
        if (
            parentType !== "Message" &&
            parentType !== "Container"
        ) {
            throw new Error(
                `<File> can only be used inside <Message> or <Container>`
            );
        }
    }

    if (name === "Actions") {
        if (
            parentType !== "Message" &&
            parentType !== "Container"
        ) {
            throw new Error(
                `<Actions> can only be used inside <Message> or <Container>`
            );
        }

        if (children.length === 0) {
            throw new Error(
                `<Actions> cannot be empty`
            );
        }

        let buttons = 0;
        let dropdowns = 0;

        for (const child of children) {
            if (!child || typeof child !== "object") {
                throw new Error(
                    `<Actions> can only contain <Button> and <Dropdown>`
                );
            }

            if (child.type === "Button") {
                buttons++;
            } else if (child.type === "Dropdown") {
                dropdowns++;
            } else {
                throw new Error(
                    `<${child.type}> cannot be used inside <Actions>`
                );
            }
        }

        if (buttons > 5) {
            throw new Error(
                `<Actions> can contain at most 5 buttons`
            );
        }

        if (dropdowns > 0 && buttons > 0) {
            throw new Error(
                `<Actions> cannot contain both <Button> and <Dropdown>`
            );
        }

        if (dropdowns > 1) {
            throw new Error(
                `<Actions> can contain only one <Dropdown>`
            );
        }
    }

    if (name === "Button") {
        if (
            parentType !== "Actions" &&
            parentType !== "Section"
        ) {
            throw new Error(
                `<Button> can only be used inside <Actions> or <Section>`
            );
        }

        const props = node.props as ButtonProps;

        if (props.style === ButtonStyle.Link) {
            if (!props.url) {
                throw new Error(
                    `<Button style={Link}> requires a url`
                );
            }
        } else if ("url" in props && props.url) {
            throw new Error(
                `Only link buttons can have a url`
            );
        }
    }

    if (name === "Dropdown") {
        if (parentType !== "Actions") {
            throw new Error(
                `<Dropdown> must be a child of <Actions>`
            );
        }

        const props = node.props as DropdownProps;
        const min = props.minValues ?? 1;
        const max = props.maxValues ?? 1;

        if (min < 0 || min > 25) {
            throw new Error(
                `<Dropdown> minValues must be between 0 and 25`
            );
        }

        if (max < 1 || max > 25) {
            throw new Error(
                `<Dropdown> maxValues must be between 1 and 25`
            );
        }

        if (min > max) {
            throw new Error(
                `<Dropdown> minValues cannot be greater than maxValues`
            );
        }

        if (props.type === "string") {
            if (
                props.options.length === 0 ||
                props.options.length > 25
            ) {
                throw new Error(
                    `<Dropdown type="string"> must contain between 1 and 25 options`
                );
            }

            const values = new Set<string>();

            for (const option of props.options) {
                if (values.has(option.value)) {
                    throw new Error(
                        `<Dropdown> option values must be unique`
                    );
                }

                values.add(option.value);
            }

            if (max > props.options.length) {
                throw new Error(
                    `<Dropdown> maxValues cannot exceed the number of options`
                );
            }

            const selected = props.value === undefined
                ? []
                : Array.isArray(props.value)
                    ? props.value
                    : [props.value];

            for (const value of selected) {
                if (!values.has(value)) {
                    throw new Error(
                        `<Dropdown> value "${value}" does not exist in its options`
                    );
                }
            }
        }
    }

    for (const child of children) {
        if (
            typeof child === "object" &&
            child !== null
        ) {
            validateV2(child, name);
        }
    }
};

const formatStack = (error: Error) => {
    if (!error.stack) return "";

    const lines = error.stack.split("\n").slice(1);
    const filtered = lines.filter((line, i) => {
        if (
            (line.includes("at validateLegacy") || line.includes("at validateV2")) &&
            i > 0 &&
            (lines[i - 1]?.includes("at validateLegacy") || lines[i - 1]?.includes("at validateV2"))
        ) return false;

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

export { component } from "./resumability";
export { showModal } from "./utils";

