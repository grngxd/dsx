# disco

> ` a library for building reactive messages in Discord.js `

## installation

```bash
bun i https://github.com/grngxd/disco
```

## example

```tsx
const Component = () => {
    const count = useSignal(0);
    return (
        <Message>
            <Embed>
                <Title>Counter</Title>
                <Description>{count.value}</Description>
            </Embed>
            <Actions>
                <Button onClick={() => count.value++}>+</Button>
                <Button onClick={() => count.value--}>-</Button>
                <Button onClick={() => count.value = 0} style={ButtonStyle.Danger}>Reset</Button>
            </Actions>
        </Message>
    )
}

await mount(
    Component,
    bot,
    opts => message.channel.send(opts)
)
```
