import { ColorResolvable, Message as DiscordMessage } from "discord.js";
import { Component, VNode } from "../types";

let cid = 0;
const generate = () => cid++;

function normalizeChildren(children: any): Array<VNode | string> {
	if (children == null) return [];
	const arr = Array.isArray(children)
		? children.filter((child) => child !== null && child !== undefined)
		: [children];
	return arr.map((child) =>
		typeof child === "number" ? String(child) : child
	);
}

export type MessageProps = DefaultProps;

export type DefaultProps = {
	children?: any;
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
export type EmbedProps = DefaultProps & {
	color?: ColorResolvable;
};

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

const btnHandlers = new Map<number, Map<string, Function>>();

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

export const getButtonHandler = (
	id: number,
	event: string
): Function | undefined => {
	return btnHandlers.get(id)?.get(event);
};
