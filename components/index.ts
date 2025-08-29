import { ColorResolvable, Message as DiscordMessage } from "discord.js";
import { Component, VNode } from "../types";
import { normalizeChildren } from "./utils";

let cid = 0;
const generate = () => cid++;

export type DefaultProps = {
	children?: any;
};

export type MessageProps = DefaultProps;
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
	onClick?: (msg: DiscordMessage<true> | DiscordMessage<false>) => void;
	style?: any;
};
export const Button: Component<ButtonProps> = (props): VNode<ButtonProps> => {
	const id = generate();
	
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

const btnHandlers = new Map<number, Map<string, Function>>();
export const getButtonHandler = (
	id: number,
	event: string
): Function | undefined => {
	return btnHandlers.get(id)?.get(event);
};

export type DropdownProps = DefaultProps & {
	placeholder?: string
	options?: Array<{ label: string; description: string; value: string }>;
	onChange?: (value: string) => void;
}

const dropdownHandlers = new Map<number, Map<string, Function>>();
export const Dropdown: Component<DropdownProps> = (
	props
): VNode<DropdownProps> => {
	const id = generate();
	
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
	id: number,
	event: string
): Function | undefined => {
	return dropdownHandlers.get(id)?.get(event);
};