# disco

> ` a library for building reactive messages in Discord.js `

## installation

```bash
bun i https://github.com/grngxd/disco
```

## example

```tsx
bot.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content === "!test") {
        const TestComponent = () => (
            <Message>
                hi
                <Counter color="#ff00ff" />
            </Message>
        );

        const Counter = ({ color }: { color?: string }) => (
            <Embed color={color || "#00ff00"}>
                <Title>Counter</Title>
                <Description>Count: 0</Description>
            </Embed>
        );

        const rendered = render(TestComponent);
        await message.reply(rendered);
    }
});
```
