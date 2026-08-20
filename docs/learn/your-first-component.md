<div align="center">
  <img src="../../assets/header.png" width="100%" alt="dsx header image" />
</div>

# YOUR FIRST COMPONENT

in dsx, a component describes a Discord message and its behaviour.

if you're coming from React, Qwik, Solid, or another JSX framework, the component itself should look familiar. what's different is **what dsx does with it**: instead of rendering into a browser, dsx turns the component into a Discord message.

# CREATING A COMPONENT

a basic dsx component is just a function that returns a Discord UI:

```tsx
const App = () => {
    return (
        <Message>
            <Embed color="Blurple">
                <Title>Hello world!</Title>
                <Description>
                    built using dsx!
                </Description>
            </Embed>
        </Message>
    );
};
```

you can compose components together just like normal JSX:

```tsx
const Header = () => {
    return (
        <Embed color="Blurple">
            <Title>Hello world!</Title>
            <Description>
                built using dsx!
            </Description>
        </Embed>
    );
};

const App = () => {
    return (
        <Message>
            <Header />
        </Message>
    );
};
```

a component does **not** send anything to Discord by itself. it only describes what should be rendered.

# RESUMABLE COMPONENTS

if a component will contain **interactive or reactive state**, wrap it with `component()`:

```tsx
import { component } from "dsxjs/renderer";

const Counter = component(() => {
    return (
        <Message>
            <Actions>
                <Button>
                    Click me
                </Button>
            </Actions>
        </Message>
    );
});
```

`component()` registers the component with dsx's **resumability system** and gives it a stable component identity.

this allows dsx to reconstruct the component when an interaction happens later, including after the bot process has restarted.

you can use normal components *and* resumable components inside other resumable components:

```tsx
const Header = component(() => (
    <Embed color="Blurple">
        <Title>Counter</Title>
    </Embed>
));

const Footer = () => (
    <Embed color="Blurple">
        <Title>Counter</Title>
    </Embed>
);

const Counter = component(() => (
    <Message>
        <Header />
        <Footer />

        <Actions>
            <Button>
                Click me
            </Button>
        </Actions>
    </Message>
));
```

you only need `component()` for components that need to participate in dsx's resumability system.

# MOUNTING A COMPONENT

once you have a component, use `mount()` to render it into a Discord message.

```tsx
import { mount } from "dsxjs/renderer";

await mount(
    Counter,
    bot,
    mounted => message.reply(mounted)
);
```

the third argument is a callback that receives the rendered Discord message options.

this means you can mount dsx components using normal `discord.js` methods:

```tsx
await mount(
    Counter,
    bot,
    mounted => channel.send(mounted)
);
```

or:

```tsx
await mount(
    Counter,
    bot,
    mounted => message.reply(mounted)
);
```

dsx therefore works **alongside** your existing discord.js bot rather than replacing it.

# INTERACTIVE COMPONENTS

components become interactive by passing handlers to Discord components.

for example:

```tsx
const Counter = component(() => {
    return (
        <Message>
            <Actions>
                <Button
                    onClick={interaction => {
                        interaction.reply({
                            content: "hello!",
                            ephemeral: true,
                        });
                    }}
                >
                    Click me
                </Button>
            </Actions>
        </Message>
    );
});
```

the `onClick` handler receives the normal `discord.js` `ButtonInteraction`.

dsx handles the interaction wiring for you, but the interaction itself is still a normal discord.js interaction.

this means you can use normal discord.js APIs inside your handlers:

```tsx
<Button
    onClick={interaction => {
        interaction.reply({
            content: "hello!",
            ephemeral: true,
        });
    }}
>
    Click me
</Button>
```

the same idea applies to dropdowns and the other interactive components supported by dsx.

# A COMPLETE COMPONENT

putting the pieces together:

```tsx
import { Client } from "discord.js";

import {
    Actions,
    Button,
    Message,
} from "dsxjs/components";

import {
    component,
    dsx,
    mount,
} from "dsxjs/renderer";

const bot = new Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "MessageContent",
    ],
});

dsx(bot);

const App = component(() => {
    return (
        <Message>
            <Actions>
                <Button
                    onClick={interaction => {
                        interaction.reply({
                            content: "hello!",
                            ephemeral: true,
                        });
                    }}
                >
                    Click me
                </Button>
            </Actions>
        </Message>
    );
});

bot.on("messageCreate", async message => {
    if (message.content !== "hello") return;

    await mount(
        App,
        bot,
        mounted => message.reply(mounted)
    );
});

bot.login(process.env.TOKEN);
```

send `hello` in Discord and dsx will mount the component into the resulting message.

when the button is clicked, the handler receives the Discord interaction.

# WHAT'S NEXT?

you've now seen the basic dsx component lifecycle:

```text
component
    ↓
JSX
    ↓
mount()
    ↓
Discord message
    ↓
interaction
```

next, learn how **[interactions](./interactions.md)** work in more detail, including buttons, dropdowns, and how dsx connects them to your components.
