import { ButtonStyle, Client } from "discord.js";
import {
    Actions,
    Button,
    Container,
    Dropdown,
    File,
    Media,
    MediaGallery,
    Message,
    Section,
    Separator,
    TextDisplay,
    Thumbnail,
} from "../components";
import { useSignal } from "../hooks";
import { component, dsx, mount } from "../renderer";

const bot = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});

dsx(bot);

const get = (options = "") =>
    `https://cataas.com/cat${options}`;

const Cat = component(() => {
    const cat = useSignal(get());
    const filter = useSignal("none");
    const index = useSignal(1);

    const refresh = (
        nextFilter = filter.value
    ) => {
        filter.value = nextFilter;

        cat.value = get(
            nextFilter === "none"
                ? ""
                : `?filter=${nextFilter}`
        );

        index.value++;
    };

    return (
        <Message v2>
            <Container accentColor={0xff7ab8}>
                <TextDisplay>
                    # cat{"\n"}
                    dsx (v2) says hello.{"\n"}
                    -# imgui reference :sob:
                </TextDisplay>

                <Separator />

                <MediaGallery>
                    <Media
                        url={cat.value}
                        description={`cat #${index.value}`}
                    />
                </MediaGallery>

                <Separator />

                <Section>
                    <TextDisplay>
                        cat #{index.value}{"\n"}
                        filter: {filter.value}
                    </TextDisplay>

                    <Thumbnail
                        url={cat.value}
                        description="current cat"
                    />
                </Section>

                <Separator />

                <Actions>
                    <Button
                        style={ButtonStyle.Primary}
                        onClick={() => {
                            refresh();
                        }}
                    >
                        new cat
                    </Button>
                </Actions>

                <Actions>
                    <Dropdown
                        value={filter.value}
                        placeholder="Filter"
                        options={[
                            {
                                label: "None",
                                value: "none",
                                description: "Random cat",
                            },
                            {
                                label: "Mono",
                                value: "mono",
                                description:
                                    "Black and white cat",
                            },
                            {
                                label: "Blur",
                                value: "blur",
                                description: "Blurred cat",
                            },
                            {
                                label: "Negate",
                                value: "negate",
                                description: "Negative cat",
                            },
                        ]}
                        onChange={value => {
                            refresh(value);
                        }}
                    />
                </Actions>

                <Separator />

                <Actions>
                    <Button
                        style={ButtonStyle.Primary}
                        onClick={() => {
                            cat.value =
                                "https://cataas.com/cat/says/dsx";
                        }}
                    >
                        a
                    </Button>

                    <Button
                        style={ButtonStyle.Secondary}
                        onClick={() => {
                            cat.value =
                                "https://cataas.com/cat/says/hello";
                        }}
                    >
                        b
                    </Button>
                </Actions>

                <Separator />

                <TextDisplay>
                    ## random file lmao
                </TextDisplay>

                <File url="attachment://cat.txt" />
            </Container>
        </Message>
    );
});

bot.on("clientReady", async b => {
    console.log(b.user.tag);
});

bot.on("messageCreate", async message => {
    if (message.content !== "v2") return;

    await mount(
        Cat,
        bot,
        mounted =>
            message.reply({
                ...mounted,
                files: [
                    {
                        attachment: Buffer.from(
                            "DSX V2 Cat Demo\n\n" +
                            "CATAAS: https://cataas.com/\n"
                        ),
                        name: "cat.txt",
                    },
                ],
            })
    );
});

bot.login(process.env.TOKEN).catch(console.error);