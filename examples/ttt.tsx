import {
    ApplicationCommandOptionType,
    ButtonStyle,
    Client,
    MessageFlags,
} from "discord.js";

import {
    Actions,
    Button,
    Container,
    Message,
    Separator,
    TextDisplay,
} from "../components";

import { useSignal } from "../hooks";
import {
    component,
    dsx,
    mount,
} from "../renderer";

const bot = new Client({
    intents: ["Guilds"],
});

dsx(bot);

const App = component(() => {
    const playerId = useSignal("");
    const opponentId = useSignal("");

    const board = useSignal<string[]>([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
    ]);

    const turn = useSignal<"X" | "O">("X");
    const winner = useSignal<string | null>(null);

    const wins: [
        number,
        number,
        number,
    ][] = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    const checkWinner = (
        next: string[]
    ) => {
        for (const [a, b, c] of wins) {
            if (
                next[a] &&
                next[a] === next[b] &&
                next[a] === next[c]
            ) {
                return next[a];
            }
        }

        if (next.every(Boolean)) {
            return "draw";
        }

        return null;
    };

    const play = (index: number) => {
        if (
            board.value[index] ||
            winner.value
        ) {
            return;
        }

        const next = [...board.value];

        next[index] = turn.value;
        board.value = next;

        const result = checkWinner(next);

        if (result) {
            winner.value = result;
            return;
        }

        turn.value =
            turn.value === "X"
                ? "O"
                : "X";
    };

    const status = winner.value
        ? winner.value === "draw"
            ? "Draw!"
            : `${winner.value} wins!`
        : `${turn.value}'s turn`;

    return (
        <Message v2>
            <Container
                accentColor={0x5865f2}
            >
                <TextDisplay>
                    # tic-tac-toe{"\n"}
                    {`<@${playerId.value}> vs <@${opponentId.value}>`}
                </TextDisplay>

                <Separator />

                <TextDisplay>
                    **{status}**{"\n"}
                    X - {`<@${playerId.value}>`}{"\n"}
                    O - {`<@${opponentId.value}>`}
                </TextDisplay>

                <Separator />

                <Actions>
                    <Button
                        style={ButtonStyle.Secondary}
                        onClick={() => play(0)}
                    >
                        {board.value[0] || "·"}
                    </Button>

                    <Button
                        style={ButtonStyle.Secondary}
                        onClick={() => play(1)}
                    >
                        {board.value[1] || "·"}
                    </Button>

                    <Button
                        style={ButtonStyle.Secondary}
                        onClick={() => play(2)}
                    >
                        {board.value[2] || "·"}
                    </Button>
                </Actions>

                <Actions>
                    <Button
                        style={ButtonStyle.Secondary}
                        onClick={() => play(3)}
                    >
                        {board.value[3] || "·"}
                    </Button>

                    <Button
                        style={ButtonStyle.Secondary}
                        onClick={() => play(4)}
                    >
                        {board.value[4] || "·"}
                    </Button>

                    <Button
                        style={ButtonStyle.Secondary}
                        onClick={() => play(5)}
                    >
                        {board.value[5] || "·"}
                    </Button>
                </Actions>

                <Actions>
                    <Button
                        style={ButtonStyle.Secondary}
                        onClick={() => play(6)}
                    >
                        {board.value[6] || "·"}
                    </Button>

                    <Button
                        style={ButtonStyle.Secondary}
                        onClick={() => play(7)}
                    >
                        {board.value[7] || "·"}
                    </Button>

                    <Button
                        style={ButtonStyle.Secondary}
                        onClick={() => play(8)}
                    >
                        {board.value[8] || "·"}
                    </Button>
                </Actions>
            </Container>
        </Message>
    );
});

bot.once("clientReady", async b => {
    console.log(b.user.tag);

    await b.application.commands.create({
        name: "ttt",
        description: "tic-tac-toe",
        options: [
            {
                name: "opponent",
                description: "other person",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
        ],
    });
});

bot.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    if (interaction.commandName !== "ttt") {
        return;
    }

    const opponent =
        interaction.options.getUser(
            "opponent",
            true
        );

    await mount(
        App,
        bot,
        async mounted => {
            await interaction.reply({
                ...mounted,
                flags: MessageFlags.IsComponentsV2,
            });

            return await interaction.fetchReply();
        },
        [
            interaction.user.id,
            opponent.id,
            // [
            //     "",
            //     "",
            //     "",
            //     "",
            //     "",
            //     "",
            //     "",
            //     "",
            //     "",
            // ],
            Array(9).fill(""),
            "X",
            null,
        ]
    );
});

bot.login(process.env.TOKEN).catch(console.error);