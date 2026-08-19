import { Client, ColorResolvable } from "discord.js";
import {
    Actions,
    Dropdown,
    Embed,
    Message,
    Title,
} from "../components";
import { useSignal } from "../hooks";
import { component, dsx, mount } from "../renderer";

const bot = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});
// tell dsx to not show errors in discord (production mode)
dsx(bot, { renderErrors: false });

const Color = component(() => {
    const color = useSignal<ColorResolvable>(
        "LuminousVividPink"
    );

    return (
        <Message>
            <Embed color={color.value}>
                <Title>
                    {
                        color.value === "LuminousVividPink"
                            ? "Pink"
                            : "Blue"
                    }
                </Title>
            </Embed>

            <Actions>
                <Dropdown
                    value={color.value as string}
                    options={[
                        {
                            label: "Pink",
                            value: "LuminousVividPink",
                            description:
                                "This option changes the embed color to pink!",
                            emoji: "🩷",
                        },
                        {
                            label: "Blue",
                            value: "Blurple",
                            description:
                                "This option changes the embed color to blue!",
                        },
                    ]}
                    onChange={value => {
                        color.value =
                            value as ColorResolvable;
                    }}
                    placeholder="Select an option"
                />
            </Actions>
        </Message>
    );
});

bot.on("clientReady", async b => {
    console.log(b.user.tag);
});

bot.on("messageCreate", async message => {
    if (message.content !== "color") return;

    await mount(
        Color,
        bot,
        mounted => message.reply(mounted)
    );
});

bot.login(process.env.TOKEN).catch(console.error);