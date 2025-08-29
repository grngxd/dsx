import { Client, ColorResolvable } from "discord.js";
import { Actions, Dropdown, Embed, Message, Title } from "../components";
import { dsx, mount } from "../renderer";
import { useSignal } from "hooks";

const bot = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});

// tell dsx to not show errors in discord (production mode)
dsx({ renderErrors: false })

bot.on("ready", async (b) => {
    console.log(b.user.tag);
})

bot.on("messageCreate", async (message) => {
    if (message.content === "color") {
        const Component = () => {
            const color = useSignal<ColorResolvable>("LuminousVividPink");
            return (
                <Message>
                    <Embed color={color.value}>
                        <Title>{color.value === "LuminousVividPink" ? "Pink" : "Blue"}</Title>
                    </Embed>

                    <Actions>
                        <Dropdown
                            options={
                                [
                                    { 
                                        label: "Pink",
                                        value: "LuminousVividPink",
                                        description: "This option changes the embed color to pink!"
                                    },
                                    {
                                        label: "Blue",
                                        value: "Blurple",
                                        description: "This option changes the embed color to blue!"
                                    }
                                ]
                            }

                            onChange={(value) => {
                                color.value = value as ColorResolvable;
                            }}

                            placeholder="Select an option"
                        />
                    </Actions>
                </Message>
            )
        }

        await mount(
            Component,
            bot,
            async (m) => message.reply(m)
        )
    }
});

bot.login(process.env.TOKEN).catch(console.error);