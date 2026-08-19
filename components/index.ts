import { ButtonStyle, ColorResolvable, Message as DiscordMessage } from "discord.js";
import { Component, VNode } from "../types";
import { normalizeChildren } from "./utils";

export let cid = 0;
const generate = () => `${cid++}`;
export const reset = () => cid = 0;

export type DefaultProps = {
	children?: any;
};

export type MessageProps = DefaultProps & {
	v2?: boolean;
};

export const Message: Component<MessageProps> = (
	props
): VNode<MessageProps> => {
	return {
		type: "Message",
		props,
		children: normalizeChildren(props.children),
	};
};

export type EmbedProps = DefaultProps & { color?: ColorResolvable };
export const Embed: Component<EmbedProps> = (props): VNode<EmbedProps> => {
	return { type: "Embed", props, children: normalizeChildren(props.children) };
};

export type TitleProps = DefaultProps;
export const Title: Component<TitleProps> = (props): VNode<TitleProps> => {
	return { type: "Title", props, children: normalizeChildren(props.children) };
};

export type DescriptionProps = DefaultProps;
export const Description: Component<DescriptionProps> = (
	props
): VNode<DescriptionProps> => {
	return {
		type: "Description",
		props,
		children: normalizeChildren(props.children),
	};
};

export type FieldsProps = DefaultProps
& {
	children?: Array<VNode | string>;
};

export const Fields: Component<FieldsProps> = (
	props
): VNode<FieldsProps> => {
	return {
		type: "Fields",
		props,
		children: normalizeChildren(props.children),
	};
};

export type FieldProps = DefaultProps & {
	inline?: boolean;
};
export const Field: Component<FieldProps> = (props): VNode<FieldProps> => {
	return {
		type: "Field",
		props,
		children: normalizeChildren(props.children),
	};
}

export type ActionsProps = DefaultProps;
export const Actions: Component<ActionsProps> = (
	props
): VNode<ActionsProps> => {
	return {
		type: "Actions",
		props,
		children: normalizeChildren(props.children),
	};
};

export type ButtonProps = DefaultProps & {
	id?: string;
    onClick?: (msg: DiscordMessage<true> | DiscordMessage<false>) => void;
    style?: ButtonStyle;
};

export const Button: Component<ButtonProps> = (props): VNode<ButtonProps> => {
	const id = props.id ?? generate();
	
	for (const [key, value] of Object.entries(props)) {
		if (key.startsWith("on") && typeof value === "function") {
			if (!btnHandlers.has(id)) btnHandlers.set(id, new Map());
			btnHandlers.get(id)!.set(key, value);
		}
	}

	return {
		type: "Button",
		props: { ...props, id } as any,
		children: normalizeChildren(props.children),
	};
};

const btnHandlers = new Map<string, Map<string, Function>>();
export const getButtonHandler = (
	id: string,
	event: string
): Function | undefined => {
	return btnHandlers.get(id)?.get(event);
};

export type DropdownOption = {
    emoji?: string;
    label: string;
    description: string;
    value: string;
    default?: boolean;
};

export type DropdownProps = DefaultProps & {
	id?: string;
	placeholder?: string
	options?: DropdownOption[];
	onChange?: (value: string) => void;
	value?: string;
}

const dropdownHandlers = new Map<string, Map<string, Function>>();
export const Dropdown: Component<DropdownProps> = (
	props
): VNode<DropdownProps> => {
	const id = props.id ?? generate();
	
	for (const [key, value] of Object.entries(props)) {
		if (key.startsWith("on") && typeof value === "function") {
			if (!dropdownHandlers.has(id)) dropdownHandlers.set(id, new Map());
			dropdownHandlers.get(id)!.set(key, value);
		}
	}

	return {
		type: "Dropdown",
		props: { ...props, id } as any,
		children: normalizeChildren(props.children),
	};
};

export const getDropdownHandler = (
	id: string,
	event: string
): Function | undefined => {
	return dropdownHandlers.get(id)?.get(event);
};

// v2 components
export type TextDisplayProps = DefaultProps;

export const TextDisplay: Component<TextDisplayProps> = (
    props
): VNode<TextDisplayProps> => {
    return {
        type: "TextDisplay",
        props,
        children: normalizeChildren(props.children),
    };
};

export type SeparatorProps = DefaultProps & {
    divider?: boolean;
    spacing?: 1 | 2;
};

export const Separator: Component<SeparatorProps> = (
    props
): VNode<SeparatorProps> => {
    return {
        type: "Separator",
        props,
        children: normalizeChildren(props.children),
    };
};

export type ThumbnailProps = {
    url: string;
    description?: string;
    spoiler?: boolean;
};

export const Thumbnail: Component<ThumbnailProps> = (
    props
): VNode<ThumbnailProps> => {
    return {
        type: "Thumbnail",
        props,
        children: [],
    };
};

export type MediaProps = {
    url: string;
    description?: string;
    spoiler?: boolean;
};

export const Media: Component<MediaProps> = (
    props
): VNode<MediaProps> => {
    return {
        type: "Media",
        props,
        children: [],
    };
};

export type MediaGalleryProps = DefaultProps;

export const MediaGallery: Component<MediaGalleryProps> = (
    props
): VNode<MediaGalleryProps> => {
    return {
        type: "MediaGallery",
        props,
        children: normalizeChildren(props.children),
    };
};

export type FileProps = {
    url: string;
    spoiler?: boolean;
};

export const File: Component<FileProps> = (
    props
): VNode<FileProps> => {
    return {
        type: "File",
        props,
        children: [],
    };
};

export type SectionProps = DefaultProps;

export const Section: Component<SectionProps> = (
    props
): VNode<SectionProps> => {
    return {
        type: "Section",
        props,
        children: normalizeChildren(props.children),
    };
};

export type ContainerProps = DefaultProps & {
    accentColor?: number;
    spoiler?: boolean;
};

export const Container: Component<ContainerProps> = (
    props
): VNode<ContainerProps> => {
    return {
        type: "Container",
        props,
        children: normalizeChildren(props.children),
    };
};