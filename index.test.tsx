import { expect, test } from "bun:test";
import { Client, EmbedBuilder } from "discord.js";
import { Description, Embed, Message, Title } from "./core/elements";
import { useSignal } from "./core/hooks/signal";
import { mount, render } from "./core/renderer";

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

test("should be reactive with signal (will pass without TOKEN/CHANNEL in .env)", () => {
    const token = process.env.TOKEN;
    const cid = process.env.CHANNEL;
    if (!token || !cid) {
        console.error("TOKEN OR CHANNEL not set, skipping reactive test");
        return;
    }

    const bot = new Client({
        intents: ["Guilds", "GuildMessages", "MessageContent"],
    })

    bot.on("ready", async () => {
        const channel = await bot.channels.fetch(cid);
        if (!channel || !channel.isTextBased() || !channel.isSendable()) {
            console.error("channel not found or not sendable, skipping reactive test");
            return;
        }

        console.log(`logged in as ${bot.user?.tag}, sending to channel ${channel.id}`);

        const Counter = () => {
            const count = useSignal(0);

            return (
                <Message>
                    Current count: {count.value}
                </Message>
            );
        }

        await mount(
            Counter,
            async (msg) => await channel.send(msg),
            async (msg, sentMsg) => await sentMsg.edit(msg)
        )
    });

    bot.login(token).catch(err => {
        console.error("failed to login:", err);
    });
})