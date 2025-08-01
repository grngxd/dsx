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
        const App = () => (
            <Message>
                hi
                <Embed color="#00ff00">
                    <Title>Counter</Title>
                    <Description>Count: 0</Description>
                </Embed>
            </Message>
        );

        const rendered = render(App());
        // const jsonified = Object.fromEntries(
        //     Object.entries(msg).map(([key, value]) => [key, value.toJSON ? value.toJSON() : value])
        // );

        await message.reply(rendered);
    }
});

bot.login(process.env.TOKEN)