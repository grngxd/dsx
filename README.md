<div align="center">
  <img src="./assets/header.png" width="100%" alt="dsx header image" />
</div>

---

> ` create interactive messages using react-like components and fine-grained reactivity `

---

> [!CAUTION]  
> ### dsx is still in early development and experimental. expect breaking changes and evolving apis.

```tsx
import { Message, Embed, Title, Description, Actions, Button } from 'dsxjs/components';
import { mount } from 'dsxjs/renderer';
import { useSignal, useEffect } from 'dsxjs/hooks';

import { ButtonStyle, Client } from 'discord.js';
import { bot } from './bot';

bot.on("messageCreate", async (message) => {
    if (message.content === "counter") {
        const Component = () => {
            const count = useSignal(0);
            return (
                <Message>
                    <Actions>
                        <Button onClick={() => count.value++}>+</Button>
                        <Button style={ButtonStyle.Secondary} onClick={() => count.value = 0}>{count.value}</Button>
                        <Button onClick={() => count.value--}>-</Button>
                    </Actions>
                </Message>
            )
        }

        await mount(
            Component,
            bot,
            mounted => message.reply(mounted)
        )
    }
});
```

### key features
- **reactive**: fine-grained reactivity with `useSignal` and `useEffect` hooks
- **lightweight**: no dependencies, just a few kilobytes
- **simple**: easy to use and understand api
- **flexible**: plug-and-play into any existing discord.js bot
- **compatible**: works with both Bun and Node.js
- **type-safe**: built with typescript for better dx
- **extensible**: easily extendable with custom components and hooks
- **modern**: uses modern javascript features & tooling
- **open-source**: fully open-source under the MIT license

### why dsx?
`dsx` makes building interactive discord messages a breeze, combining the declarative UI approach of JSX with a reactive state model inspired by solid.js & react. It allows you to build complex UIs with minimal code, while still being lightweight and performant. instead of manually managing message content, components, and interactions, you write ui components that update *themselves* automatically.

### getting started

```bash
bun i dsxjs
# or:
npm install dsxjs
pnpm install dsxjs
yarn add dsxjs
```

or if you want a bot *and* dsx included (coming soon):

```bash
bun create dsxjs
# or:
npm create dsxjs
pnpm create dsxjs
yarn create dsxjs
```

### roadmap & contribution
contributions, bug reports, and feature requests are welcome! See the [roadmap](./docs/ROADMAP.md) and [contributing guide](./docs/CONTRIBUTING.md) for details.

### community
find us on:
- [github discussions](https://github.com/grngxd/dsx/discussions)
- [twitter/x](https://twitter.com/grngxd)
- discord server (coming soon)

### license
`dsx` is licensed under the [MIT](./LICENSE) license.

> tldr: you're free to use and modify `dsx`, but please keep the license intact and give credit where it's due.