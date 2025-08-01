import { expect, test } from "bun:test";
import { EmbedBuilder } from "discord.js";
import { Description, Embed, Message, Title } from "./core/elements";
import { render } from "./renderer";

test("should handle basic text", () => {
    const rendered = render(() => <Message>disco is goated</Message>);
    
    const native = {
        content: "disco is goated",
    }

    expect(rendered).toMatchObject(native);
})

test("should handle embeds", () => {

    const rendered = render(() => (
        <Message>
            <Embed
                color="#FF0000"
            >
                <Title>test</Title>
                <Description> what's lookin good cookin?</Description>
            </Embed>
        </Message>
    ));
    
    const native = {
        embeds: [
            new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("test")
                .setDescription(" what's lookin good cookin?")
        ],
    }

    expect(rendered).toMatchObject(native);
});

test("should handle multiple embeds", () => {
    const rendered = render(() => (
        <Message>
            <Embed color="#FF0000">
                <Title>test</Title>
                <Description> what's lookin good cookin?</Description>
            </Embed>
            <Embed color="#00FF00">
                <Title>another embed</Title>
                <Description> more content here</Description>
            </Embed>
        </Message>
    ));

    const native = {
        embeds: [
            new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("test")
                .setDescription(" what's lookin good cookin?"),
            new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("another embed")
                .setDescription(" more content here"),
        ],
    }

    expect(rendered).toMatchObject(native);
});

test("should handle inf-nested components", () => {
    const Child = () => (
        <Description>child</Description>
    );

    const Parent = () => (
        <Embed color="#FF0000">
            <Title>test</Title>
            <Child />
        </Embed>
    );

    const rendered = render(() => (
        <Message>
            <Parent />
        </Message>
    ));

    const native = {
        embeds: [
            new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("test")
                .setDescription("child"),
        ],
    }

    expect(rendered).toMatchObject(native);
});