import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, ContainerBuilder, EmbedBuilder, FileBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, Message as DiscordMessage, MessageFlags, SeparatorBuilder, SectionBuilder, StringSelectMenuBuilder, TextDisplayBuilder, ThumbnailBuilder, type MessageCreateOptions, InteractionResponse } from "discord.js";
import { runComponent } from "../hooks/signal";
import { VNode } from "../types";
import { extractButtons, extractDropdowns, extractText, toEditOptions, wireInteractions } from "./utils";
import {Description, Embed, Message, reset, Title, type ContainerProps, type FileProps, type MediaGalleryProps, type MediaProps, type SectionProps, type SeparatorProps, type TextDisplayProps, type ThumbnailProps, ButtonProps } from "../components";
import { renderEmbed } from "./renderers";

const wiredBots = new WeakSet<Client>();

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

        if ((rendered.props as any).v2) {
            return renderV2(rendered);
        }

        return renderLegacy(rendered);
    } catch (error: any) {
        if (!config.renderErrors) throw error;
        return render(() => <ErrorComponent error={error} />);
    }
};

export const renderLegacy = (
    rendered: VNode
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
            content += extractText(child.children);
        }
    }

    content = content.trim();

    const buttons = extractButtons(rendered);
    const dropdowns = extractDropdowns(rendered);

    const components: any[] = [];

    if (buttons.length > 0) {
        components.push(
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(...buttons)
        );
    }

    if (dropdowns.length > 0) {
        for (const menu of dropdowns) {
            components.push(
                new ActionRowBuilder<StringSelectMenuBuilder>()
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
        return render(() => <ErrorComponent error={error} />);
    }

    return res;
};

export const renderV2 = (
    rendered: VNode
): MessageCreateOptions => {
    const components: any[] = [];

    for (const child of rendered.children) {
        if (child === null || child === undefined) continue;

        if (child.type === "TextDisplay") {
            components.push(
                new TextDisplayBuilder()
                    .setContent(extractText(child.children))
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
                            .setContent(extractText(nested.children))
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
                        .setCustomId(String((props as any).id ?? ""))
                        .setLabel(extractText(nested.children))
                        .setStyle(props.style ?? ButtonStyle.Primary);

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
                            .setContent(extractText(nested.children))
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
                                        extractText(sectionChild.children)
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
                            const props =
                                sectionChild.props as ButtonProps;

                            const button = new ButtonBuilder()
                                .setCustomId(
                                    String((props as any).id ?? "")
                                )
                                .setLabel(
                                    extractText(sectionChild.children)
                                )
                                .setStyle(
                                    props.style ?? ButtonStyle.Primary
                                );

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
                    const buttons = extractButtons(nested);
                    const dropdowns = extractDropdowns(nested);

                    if (buttons.length > 0) {
                        container.addActionRowComponents(
                            new ActionRowBuilder<ButtonBuilder>()
                                .addComponents(...buttons)
                        );
                    }

                    if (dropdowns.length > 0) {
                        for (const menu of dropdowns) {
                            container.addActionRowComponents(
                                new ActionRowBuilder<StringSelectMenuBuilder>()
                                    .addComponents(menu)
                            );
                        }
                    }
                }
            }

            components.push(container);

        } else if (child.type === "Actions") {
            const buttons = extractButtons(child);
            const dropdowns = extractDropdowns(child);

            if (buttons.length > 0) {
                components.push(
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(...buttons)
                );
            }

            if (dropdowns.length > 0) {
                for (const menu of dropdowns) {
                    components.push(
                        new ActionRowBuilder<StringSelectMenuBuilder>()
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
        return render(() => <ErrorComponent error={error} />);
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
    ) => DiscordMessage<boolean> | Promise<DiscordMessage<boolean>> | InteractionResponse<boolean> | Promise<InteractionResponse<boolean>>
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

export const validateLegacy = (node: VNode, parentType?: string) => {
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
                validateLegacy(child, name);
            }
        }
    }
}

export const validateV2 = (node: VNode, parentType?: string) => {
    const name = typeof node.type === "string"
        ? node.type
        : node.type?.name ?? "Unknown";

    if (name === "Message" && !(node.props as any).v2) {
        throw new Error(`<Message> must have the v2 prop for v2 messages`);
    }

    // <Container> can only be a child of <Message>
    if (name === "Container" && parentType !== "Message") {
        throw new Error(`<Container> must be a child of <Message>`);
    }

    // <TextDisplay> can be used inside <Message>, <Container>, or <Section>
    if (
        name === "TextDisplay" &&
        !["Message", "Container", "Section"].includes(parentType ?? "")
    ) {
        throw new Error(
            `<TextDisplay> can only be used inside <Message>, <Container> or <Section>`
        );
    }

    // <Separator> can only be used inside <Message> or <Container>
    if (
        name === "Separator" &&
        !["Message", "Container"].includes(parentType ?? "")
    ) {
        throw new Error(
            `<Separator> can only be used inside <Message> or <Container>`
        );
    }

    // <Section> can only be used inside <Message> or <Container>
    if (
        name === "Section" &&
        !["Message", "Container"].includes(parentType ?? "")
    ) {
        throw new Error(
            `<Section> can only be used inside <Message> or <Container>`
        );
    }

    // <Thumbnail> can only be used inside <Section>
    if (name === "Thumbnail" && parentType !== "Section") {
        throw new Error(
            `<Thumbnail> can only be used inside <Section>`
        );
    }

    // <MediaGallery> can only be used inside <Message> or <Container>
    if (
        name === "MediaGallery" &&
        !["Message", "Container"].includes(parentType ?? "")
    ) {
        throw new Error(
            `<MediaGallery> can only be used inside <Message> or <Container>`
        );
    }

    // <Media> can only be used inside <MediaGallery>
    if (name === "Media" && parentType !== "MediaGallery") {
        throw new Error(
            `<Media> can only be used inside <MediaGallery>`
        );
    }

    // <File> can only be used inside <Message> or <Container>
    if (
        name === "File" &&
        !["Message", "Container"].includes(parentType ?? "")
    ) {
        throw new Error(
            `<File> can only be used inside <Message> or <Container>`
        );
    }

    // <Actions> can be used inside <Message> or <Container>
    if (
        name === "Actions" &&
        !["Message", "Container"].includes(parentType ?? "")
    ) {
        throw new Error(
            `<Actions> can only be used inside <Message> or <Container>`
        );
    }

    // <Button> can be used inside <Actions> or as a Section accessory
    if (
        name === "Button" &&
        !["Actions", "Section"].includes(parentType ?? "")
    ) {
        throw new Error(
            `<Button> can only be used inside <Actions> or <Section>`
        );
    }

    // <Dropdown> can only be used inside <Actions>
    if (name === "Dropdown" && parentType !== "Actions") {
        throw new Error(
            `<Dropdown> can only be used inside <Actions>`
        );
    }

    // <MediaGallery> can only contain <Media>
    if (name === "MediaGallery") {
        const children = (node.props as any).children;

        if (children) {
            const arr = Array.isArray(children)
                ? children
                : [children];

            const invalid = arr.filter(
                (child: any) =>
                    child &&
                    typeof child === "object" &&
                    child.type !== "Media"
            );

            if (invalid.length > 0) {
                throw new Error(
                    `<MediaGallery> can only contain <Media>`
                );
            }
        }
    }

    // <Section> can only contain TextDisplay + 1 accessory
    if (name === "Section") {
        const children = (node.props as any).children;

        if (children) {
            const arr = Array.isArray(children)
                ? children
                : [children];

            const textDisplays = arr.filter(
                (child: any) =>
                    child &&
                    typeof child === "object" &&
                    child.type === "TextDisplay"
            );

            const accessories = arr.filter(
                (child: any) =>
                    child &&
                    typeof child === "object" &&
                    ["Button", "Thumbnail"].includes(child.type)
            );

            const invalid = arr.filter(
                (child: any) =>
                    child &&
                    typeof child === "object" &&
                    !["TextDisplay", "Button", "Thumbnail"].includes(child.type)
            );

            if (textDisplays.length === 0) {
                throw new Error(
                    `<Section> must contain at least one <TextDisplay>`
                );
            }

            if (accessories.length > 1) {
                throw new Error(
                    `<Section> can only have one accessory`
                );
            }

            if (invalid.length > 0) {
                throw new Error(
                    `<${invalid[0].type}> cannot be used inside <Section>`
                );
            }
        }
    }

    // <Container> can only contain valid V2 children
    if (name === "Container") {
        const children = (node.props as any).children;

        if (children) {
            const arr = Array.isArray(children)
                ? children
                : [children];

            const allowed = [
                "TextDisplay",
                "Separator",
                "Section",
                "MediaGallery",
                "File",
                "Actions",
            ];

            const invalid = arr.find(
                (child: any) =>
                    child &&
                    typeof child === "object" &&
                    !allowed.includes(child.type)
            );

            if (invalid) {
                throw new Error(
                    `<${invalid.type}> cannot be used inside <Container>`
                );
            }
        }
    }

    const children = (node.props as any).children;

    if (children) {
        const arr = Array.isArray(children)
            ? children
            : [children];

        for (const child of arr) {
            if (typeof child === "object" && child !== null) {
                validateV2(child, name);
            }
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