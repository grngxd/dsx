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
    const filters = useSignal<string[]>([]);
    const index = useSignal(1);

    const refresh = (nextFilters = filters.value) => {
        filters.value = nextFilters;

        const query = nextFilters.length
            ? `?filter=${nextFilters.join(",")}`
            : "";

        cat.value = get(query);
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
                        filters: {filters.value.join(", ") || "none"}
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
                        type="string"
                        value={filters.value}
                        minValues={0}
                        maxValues={3}
                        placeholder="Filters"
                        options={[
                            {
                                label: "Mono",
                                value: "mono",
                                description: "Black and white cat",
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
                        onChange={values => {
                            refresh(values);
                        }}
                    />
                </Actions>

                <Separator />

                <Actions>
                    <Button
                        style={ButtonStyle.Link}
                        url={cat.value}
                    >
                        open in browser (cat #{index.value})
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

bot.once("ready", async b => {
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
                            "file lmao"
                        ),
                        name: "cat.txt",
                    },
                ],
            })
    );
});


bot.login(process.env.TOKEN).catch(console.error);