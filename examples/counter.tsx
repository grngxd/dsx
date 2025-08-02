import { useSignal } from "core/hooks/signal";
import { mount } from "core/renderer";
import { ButtonStyle, Client } from "discord.js";
import { Actions, Button, Description, Embed, Message, Title } from "../core/renderer/components";

const bot = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});

bot.on("ready", async (b) => {
    console.log(b.user.tag);
})

bot.on("messageCreate", async (message) => {
    if (message.content === "counter") {
        const Component = () => {
            const count = useSignal(0);
            return (
                <Message>
                    <Embed color={"LuminousVividPink"}>
                        <Title>Counter</Title>
                        <Description>Count: {count.value}</Description>
                    </Embed>
                    <Actions>
                        <Button onClick={() => count.value++}>+</Button>
                        <Button onClick={() => count.value--}>-</Button>
                        <Button onClick={() => count.value = 0} style={ButtonStyle.Danger}>Reset</Button>
                    </Actions>
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