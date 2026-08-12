import { ButtonStyle, Client } from "discord.js";
import { Actions, Button, Container, Description, Embed, Message, Separator, TextDisplay, Title } from "../components";
import { useSignal } from "../hooks";
import { mount } from "../renderer";

const bot = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});

bot.on("clientReady", async (b) => {
    console.log(b.user.tag);
})

bot.on("messageCreate", async (message) => {
    if (message.content === "v2") {
        const Component = () => {
            const count = useSignal(0);
            return (
                <Message v2>                   
                    <Container>
                        <TextDisplay>
                            v2
                        </TextDisplay>

                        <Separator />

                        <TextDisplay>
                            test
                        </TextDisplay>
                    </Container>
                </Message>
            )
        }

        await mount(
            Component,
            bot,
            mounted => message.reply(mounted)
        )
    }
});

bot.login(process.env.TOKEN).catch(console.error);