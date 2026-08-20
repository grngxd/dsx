<div align="center">
  <img src="../assets/header.png" width="100%" alt="dsx header image" />
</div>

# QUICK START

welcome to the **dsx quick start guide & documentation!**

this page will give you an introduction to `dsx` and almost everything you need to know to get started building **interactive Discord bots with dsx**.

# PREREQUISITES

* modern version of [**bun**](https://bun.sh/) (v1.0.0+) / [**node**](https://nodejs.org/en/) (v20+)
* some familiarity with [**React**](https://react.dev/), [**Qwik**](https://qwik.builder.io/), or [**Solid**](https://www.solidjs.com/) (or similar)
* some familiarity with [**Discord.js**](https://discord.js.org/) (v14+)
* a **Discord bot token**

# COMPONENTS

`dsx` messages are built using **components**. components are the building blocks of your bot's UI, and can be composed together to create complex interfaces.

```tsx
import { Description, Embed, Message, Title } from "dsxjs/components";

const Counter = () => {
    return (
        <Message>
            <Embed color="Blurple">
                <Title>Hello world!</Title>
                <Description>built using dsx!</Description>
            </Embed>
        </Message>
    );
};
```

components are just functions that return dsx elements. because dsx uses jsx, components can be composed together to build larger interfaces.

for example, you can extract the embed into its own component:

```tsx
const Header = () => {
    return (
        <Embed color="Blurple">
            <Title>Hello world!</Title>
            <Description>built using dsx!</Description>
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

components can be nested just like regular jsx components.

for components that need to handle **resumable interactions**, wrap the component with `component()`:

```tsx
import { component } from "dsxjs/renderer";

const App = component(() => {
    return (
        <Message>
            <Embed color="Blurple">
                <Title>Hello world!</Title>
            </Embed>
        </Message>
    );
});
```

`component()` registers the component with dsx's **resumability system** and gives it a stable component identity. this allows dsx to restore the component and its state when the user interacts with it again, even after a **bot restart**.

# MOUNTING

a component describes your message, but it does not send one.

use `mount()` to **render a component and send the resulting message**:

```tsx
import { mount } from "dsxjs/renderer";

await mount(
    App,
    bot,
    mounted => channel.send(mounted)
);
```

the third argument receives the rendered **discord.js message options**, so you can use the normal discord.js methods you already use to send messages.

for example:

```tsx
await mount(
    App,
    bot,
    mounted => message.reply(mounted)
);
```

because of this, dsx can be added to an existing discord.js bot without replacing your existing message handling.

dsx is an **addon** to discord.js, not a replacement.

# INTERACTIONS

dsx components can handle **Discord interactions directly** through props such as `onClick` and `onChange`.

```tsx
import { Actions, Button, Message } from "dsxjs/components";

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
```

interaction handlers receive the **normal discord.js interaction object**.

# REACTIVE STATE

dsx uses signals to make Discord messages reactive, just like Qwik.

```tsx
import { Actions, Button, Message } from "dsxjs/components";

import { useSignal } from "dsxjs/hooks";

const Counter = component(() => {
    const count = useSignal(0);

    return (
        <Message>
            <Actions>
                <Button onClick={() => count.value++}>
                    {count.value}
                </Button>
            </Actions>
        </Message>
    );
});
```

when `count.value` changes, dsx automatically **rerenders the component** and updates the Discord message.

you do not need to manually call `message.edit()`.

you can use multiple signals in the same component:

```tsx
const Counter = component(() => {
    const count = useSignal(0);
    const step = useSignal(1);

    return (
        <Message>
            <Actions>
                <Button onClick={() => count.value += step.value}>
                    {count.value}
                </Button>
            </Actions>
        </Message>
    );
});
```

## COMPUTED VALUES

use `useComputed()` when you need a value **derived from reactive state**.

```tsx
import { useComputed, useSignal } from "dsxjs/hooks";

const Counter = component(() => {
    const count = useSignal(0);
    const doubled = useComputed(() => count.value * 2);

    return (
        <Message>
            <Actions>
                <Button onClick={() => count.value++}>
                    {count.value} ({doubled.value})
                </Button>
            </Actions>
        </Message>
    );
});
```

computed values are derived from the current state and do not need to be updated manually.

## EFFECTS

use `useEffect()` for **side effects** that should run after a component is rendered.

```tsx
import { useEffect, useSignal } from "dsxjs/hooks";

const App = component(() => {
    const count = useSignal(0);

    useEffect(() => {
        console.log(`count: ${count.value}`);
    });

    return (
        <Message>
            ...
        </Message>
    );
});
```

effects can also be asynchronous:

```tsx
useEffect(async () => {
    await doSomething();
});
```

# DROPDOWNS

dsx provides a single `Dropdown` component for **Discord's select menus**.

the `type` prop determines which Discord select menu is rendered.

```tsx
<Actions>
    <Dropdown
        type="string"
        options={[
            {
                label: "Red",
                value: "red",
            },
            {
                label: "Blue",
                value: "blue",
            },
        ]}
        onChange={interaction => {
            console.log(interaction.values);
        }}
    />
</Actions>
```

other supported types are:

```text
string
user
role
channel
mentionable
```

all dropdown types receive the **normal discord.js select-menu interaction** in `onChange`.

string dropdowns can also use `value` to control the selected options:

```tsx
const color = useSignal("red");

<Dropdown
    type="string"
    value={color.value}
    options={[
        { label: "Red", value: "red" },
        { label: "Blue", value: "blue" },
    ]}
    onChange={interaction => {
        color.value = interaction.values[0];
    }}
/>
```

`minValues` and `maxValues` control how many options Discord allows the user to select.

# MODALS

dsx supports Discord modals with `Modal` and `TextInput`.

```tsx
const Profile = component(() => (
    <Modal
        title="Edit profile"
        onSubmit={values => {
            console.log(values.name);
            console.log(values.bio);
        }}
    >
        <TextInput
            id="name"
            label="Name"
            placeholder="grng"
            maxLength={32}
        />

        <TextInput
            id="bio"
            label="Bio"
            style="paragraph"
            maxLength={200}
        />
    </Modal>
));
```

show the modal from an interaction with `showModal()`:

```tsx
import { showModal } from "dsxjs/renderer";

<Button
    onClick={interaction => {
        showModal(interaction, <Profile />);
    }}
>
    Edit profile
</Button>
```

the values passed to `onSubmit` are keyed by the `id` of each `TextInput`.

# RESUMABILITY

one of dsx's core features is **resumability**.

Discord messages continue to exist even when your bot process restarts. dsx uses the information stored internally in interactions to restore the component and its state when the user interacts with it again.

for example:

```text
counter: 0
    ↓
click
    ↓
counter: 1
    ↓
bot restarts
    ↓
click
    ↓
counter: 2
```

resumability is enabled automatically for components registered with `component()`.

# COMPONENTS V2

dsx supports both **legacy Discord messages** and **Components V2**.

enable it by adding the `v2` prop to `Message`:

```tsx
<Message v2>
    <Container>
        <TextDisplay>
            Hello from Components V2!
        </TextDisplay>

        <Separator />

        <Actions>
            <Button onClick={...}>
                Click me
            </Button>
        </Actions>
    </Container>
</Message>
```

Components V2 provides additional Discord-native UI primitives such as:

```text
Container
Section
TextDisplay
Separator
MediaGallery
Media
Thumbnail
File
```

see the [**Components V2 guide**](./learn/components-v2.md) for the supported hierarchy and examples.

# ERRORS

dsx validates component trees before sending or editing messages.

for example, this is invalid:

```tsx
<Message>
    <Button>Click me</Button>
</Message>
```

because buttons must be inside an `Actions` component.

the correct version is:

```tsx
<Message>
    <Actions>
        <Button>Click me</Button>
    </Actions>
</Message>
```

by default, dsx renders runtime errors directly into Discord so they are easier to diagnose during development.

you can easily disable this behavior:

```tsx
dsx(bot, {
    renderErrors: false,
});
```

when disabled, errors are thrown normally instead.

see the [**validation and errors reference**](./reference/validation.md) for the complete list of validation rules.

# WHAT'S NEXT?

you now know the core dsx concepts:

* **components**
* **mounting**
* **interactions**
* **reactive state**
* **computed values**
* **effects**
* **dropdowns**
* **modals**
* **resumability**
* **components v2**

continue with the [**guide**](./learn/README.md) to learn dsx's concepts in more depth.

for the complete list of components, hooks, renderer APIs, and configuration options, see the [**API Reference**](./reference/README.md).

for complete examples, see the [**examples**](../examples) directory.
