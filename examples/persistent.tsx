import { Client } from "discord.js";
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

const App = component(() => {
    const count = useSignal(7);

    return (
        <Message>
            <Actions>
                <Button onClick={() => count.value++}>
                    {count.value}+
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
        App,
        bot,
        mounted => message.reply(mounted)
    );
});

bot.login(process.env.TOKEN).catch(console.error);