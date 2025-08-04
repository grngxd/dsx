import { DescriptionProps, EmbedProps, FieldsProps, TitleProps } from "components";
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
            const title = child as VNode<TitleProps>;
            embed.setTitle(extractText(title.children));
        }

        if (child.type === "Description") {
            const description = child as VNode<DescriptionProps>;
            embed.setDescription(extractText(description.children));
        }

        if (child.type === "Fields") {
            const fieldsNode = child as VNode<FieldsProps>;
            for (const field of fieldsNode.children) {
                if (field.type !== "Field") continue;
                const name = field.children.find((c: any) => c.type === "Title");
                const value = field.children.find((c: any) => c.type === "Description");

                if (!name) throw new Error("Field must have a <Title> child");
                if (!value) throw new Error("Field must have a <Description> child");

                embed.addFields({
                    name: name ? extractText(name.children) : "",
                    value: value ? extractText(value.children) : "",
                    inline: field.props.inline ?? false,
                });
            }
        }
    }
    return embed;
}