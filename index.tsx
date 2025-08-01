/** @jsxImportSource ./core/jsx-runtime */
import { Client } from "discord.js";
import { Description, Embed, Message, Title } from "./core/elements";
import { render } from "./renderer";

const bot = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
})

bot.on("ready", (b) => {
    console.log(b.user.tag);
});

bot.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content === "!test") {
        const TestComponent = () => (
            <Message>
                hi
                <Counter color="#ff00ff" />
                <Counter />
            </Message>
        );

        const Counter = ({ color }: { color?: string }) => (
            <Embed color={color || "#00ff00"}>
                <Title>Counter</Title>
                <Description>Count: 0</Description>
            </Embed>
        );

        const rendered = render(TestComponent);
        // const jsonified = Object.fromEntries(
        //     Object.entries(msg).map(([key, value]) => [key, value.toJSON ? value.toJSON() : value])
        // );

        await message.reply(rendered);
    }
});

bot.login(process.env.TOKEN)