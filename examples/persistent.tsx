import { ButtonStyle, Client } from "discord.js";
import {
    Actions,
    Button,
    Embed,
    Message,
    Title,
} from "../components";
import { useSignal } from "../hooks";
import { mount } from "../renderer";

const bot = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});

bot.on("clientReady", async b => {
    console.log(b.user.tag);
});

bot.on("messageCreate", async message => {
    if (message.content !== "counter") return;

    const Component = () => {
        const count = useSignal(0);

        return (
            <Message>
                <Embed color="Blurple">
                    <Title>
                        Counter
                    </Title>

                    {count.value}
                </Embed>

                <Actions>
                    <Button
                        id="counter:increment"
                        style={ButtonStyle.Primary}
                        onClick={() => {
                            count.value++;
                        }}
                    >
                        +
                    </Button>
                    
                    {/* shouldnt survive restarts */}
                    <Button
                        style={ButtonStyle.Secondary}
                        onClick={() => {
                            count.value--;
                        }}
                    >
                        -
                    </Button>
                </Actions>
            </Message>
        );
    };

    await mount(
        Component,
        bot,
        mounted => message.reply(mounted)
    );
});

bot.login(process.env.TOKEN).catch(console.error);