import { ButtonStyle, Client } from "discord.js";
import {
    Actions,
    Button,
    Message,
} from "../components";
import { useSignal } from "../hooks";
import { component, dsx, mount } from "../renderer";

const bot = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});

dsx(bot);

const Counter = component(() => {
    const count = useSignal(0);

    return (
        <Message>
            <Actions>
                <Button
                    onClick={() => {
                        count.value++;
                    }}
                >
                    +
                </Button>

                <Button
                    style={ButtonStyle.Secondary}
                    onClick={() => {
                        count.value = 0;
                    }}
                >
                    {count.value}
                </Button>

                <Button
                    onClick={() => {
                        count.value--;
                    }}
                >
                    -
                </Button>
            </Actions>
        </Message>
    );
});

bot.once("ready", async b => {
    console.log(b.user.tag);
});

bot.on("messageCreate", async message => {
    if (message.content !== "counter") return;

    await mount(
        Counter,
        bot,
        mounted => message.reply(mounted)
    );
});

bot.login(process.env.TOKEN).catch(console.error);