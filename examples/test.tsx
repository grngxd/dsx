import { Client } from "discord.js";
import { Description, Embed, Message, Title } from "../components";
import { mount } from "../renderer";

const bot = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});

bot.on("ready", async (b) => {
    console.log(b.user.tag);
})

bot.on("messageCreate", async (message) => {
    if (message.content === "ping") {
        const Component = () => {
            return (
                <Message>
                    <Embed color={"LuminousVividPink"}>
                        <Title>pong</Title>
                        <Description>hi</Description>
                        <Description>pong</Description>
                    </Embed>
                </Message>
            )
        }

        await mount(
            Component,
            bot,
            m => message.channel.send(m)
        )
    }
});

bot.login(process.env.TOKEN).catch(console.error);