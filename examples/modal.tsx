import { Client } from "discord.js";
import { useSignal } from "hooks";
import { Actions, Button, Description, Embed, Field, Fields, Message, Modal, TextInput, Title } from "../components";
import { component, dsx, mount, showModal } from "../renderer";

const bot = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});

dsx(bot);

const App = component(() => {
    const name = useSignal("grng");
    const bio = useSignal("dsx is awesome!");

    const Profile = component(() => (
        <Modal
            title="Edit profile"
            onSubmit={async (i, values) => {
                name.value = values.name || name.value;
                bio.value = values.bio || bio.value;

                await i.deferUpdate();
            }}
        >
            <TextInput
                id="name"
                label="Name"
                description="Your display name"
                placeholder={name.value}
                maxLength={32}
                required
            />

            <TextInput
                id="bio"
                label="Bio"
                style="paragraph"
                placeholder={bio.value}
                maxLength={200}
            />
        </Modal>
    ));
    
    return (
        <Message>
            <Embed color="Blurple">
                <Title>profile</Title>
                <Fields>
                    <Field>
                        <Title>name</Title>
                        <Description>{name.value}</Description>
                    </Field>

                    <Field>
                        <Title>bio</Title>
                        <Description>{bio.value}</Description>
                    </Field>
                </Fields>
            </Embed>
            <Actions>
                <Button
                    onClick={async i => {
                        // NOT discord.js showModal!!!
                        await showModal(i, <Profile />)
                    }}
                >
                    Edit profile
                </Button>
            </Actions>
        </Message>
    );
});

bot.once("ready", async b => {
    console.log(b.user.tag);
});

bot.on("messageCreate", async message => {
    if (message.content !== "modal") return;

    await mount(
        App,
        bot,
        mounted => message.reply(mounted)
    );
});

bot.login(process.env.TOKEN).catch(console.error);