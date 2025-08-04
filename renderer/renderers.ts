import { EmbedProps } from "components";
import { EmbedBuilder } from "discord.js";
import { VNode } from "types";
import { extractText } from "./utils";

export const renderEmbed = (v: VNode<EmbedProps>): EmbedBuilder => {
    const embed = new EmbedBuilder();
    if (v.props.color) embed.setColor(v.props.color);

    for (const child of v.children) {
        if (typeof child === "string" || typeof child === "number") {
            const prev = embed.data.description ?? "";
            embed.setDescription(prev + String(child));
            continue;
        }
        if (child.type === "Title") {
            embed.setTitle(extractText(child.children));
        }
        if (child.type === "Description") {
            embed.setDescription(extractText(child.children));
        }
    }
    return embed;
}