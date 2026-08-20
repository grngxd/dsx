<div align="center">
  <img src="../assets/header.png" width="100%" alt="dsx header image" />
</div>
# INTERACTIONS

dsx handles Discord component interactions for you while still exposing the **normal discord.js interaction objects** to your handlers.

this means you can use dsx's declarative component API without giving up the discord.js APIs you already know.

# BUTTONS

buttons use the `onClick` prop to handle button interactions.

```tsx id="7x6a2f"
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
```

the `onClick` handler receives a normal `ButtonInteraction`.

you can therefore use any of the normal discord.js interaction methods:

```tsx id="g4q7ub"
<Button
    onClick={async interaction => {
        await interaction.reply({
            content: "hello!",
        });
    }}
>
    Reply
</Button>
```

you can also use the interaction to modify the original message:

```tsx id="j2o4kp"
<Button
    onClick={async interaction => {
        await interaction.update({
            content: "updated!",
        });
    }}
>
    Update
</Button>
```

dsx will automatically handle the interaction response when the handler does not respond to it itself.

# LINK BUTTONS

link buttons do not create an interaction because Discord opens their URL directly.

use `ButtonStyle.Link` together with `url`:

```tsx id="y2v5ta"
<Button
    style={ButtonStyle.Link}
    url="https://github.com/grngxd/dsx"
>
    GitHub
</Button>
```

link buttons cannot use `onClick`.

# DROPDOWNS

all of dsx's select menus use the same `Dropdown` component.

the `type` prop determines which Discord select menu is created.

```tsx id="8p1w6e"
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

the `onChange` handler receives the corresponding discord.js select-menu interaction.

supported types are:

```text id="r43c7z"
string
user
role
channel
mentionable
```

for example, a user dropdown receives a `UserSelectMenuInteraction`:

```tsx id="b7kj9s"
<Dropdown
    type="user"
    onChange={interaction => {
        console.log(interaction.values);
    }}
/>
```

# STRING DROPDOWNS

string dropdowns use an array of options:

```tsx id="3cx4xa"
<Dropdown
    type="string"
    options={[
        {
            label: "Apple",
            value: "apple",
        },
        {
            label: "Banana",
            value: "banana",
        },
    ]}
    onChange={interaction => {
        console.log(interaction.values);
    }}
/>
```

by default, Discord allows one option to be selected.

use `minValues` and `maxValues` to allow multiple selections:

```tsx id="d6x3f5"
<Dropdown
    type="string"
    minValues={1}
    maxValues={2}
    options={[
        {
            label: "Red",
            value: "red",
        },
        {
            label: "Blue",
            value: "blue",
        },
        {
            label: "Green",
            value: "green",
        },
    ]}
    onChange={interaction => {
        console.log(interaction.values);
    }}
/>
```

`interaction.values` contains the selected option values.

# CONTROLLED DROPDOWNS

string dropdowns can use the `value` prop to control which options are selected.

```tsx id="y9tt61"
const color = useSignal("red");

<Dropdown
    type="string"
    value={color.value}
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
        color.value = interaction.values[0];
    }}
/>
```

`value` can be a single string or an array of strings.

this makes it useful for reactive dropdowns where the selected value is part of your component state.

# SELECT MENU OPTIONS

string dropdown options support:

```tsx id="4s9qct"
<Dropdown
    type="string"
    options={[
        {
            label: "Red",
            value: "red",
            description: "A red option",
            emoji: "🔴",
            default: true,
        },
    ]}
/>
```

* `label` controls the visible option name
* `value` is the value returned by Discord
* `description` adds a description below the label
* `emoji` adds an emoji
* `default` selects the option by default

# DEFERRED RESPONSES

Discord requires an interaction to be acknowledged.

you can use the normal discord.js response methods when you need to handle an interaction yourself:

```tsx id="6v4f8k"
<Button
    onClick={async interaction => {
        await interaction.deferReply({
            ephemeral: true,
        });

        await interaction.editReply({
            content: "done!",
        });
    }}
>
    Run
</Button>
```

dsx will not try to respond again when your handler has already replied or deferred the interaction.

# INTERACTIONS AND REACTIVITY

interaction handlers can update signals just like any other function.

```tsx id="9y4z8c"
const Counter = component(() => {
    const count = useSignal(0);

    return (
        <Message>
            <Actions>
                <Button
                    onClick={() => count.value++}
                >
                    {count.value}
                </Button>
            </Actions>
        </Message>
    );
});
```

the handler changes the signal, the signal triggers a rerender, and dsx updates the message.

```text id="qk2z9c"
interaction
    ↓
handler
    ↓
signal changes
    ↓
component rerenders
    ↓
Discord message updates
```

you do not need to manually call `message.edit()` for reactive state updates.

# INTERACTIONS AFTER A RESTART

because resumable components store the information needed to restore their interaction handlers, buttons and dropdowns can continue working after the bot process restarts.

for example:

```text id="8qk3ts"
message exists in Discord
        ↓
bot restarts
        ↓
user clicks button
        ↓
dsx restores component
        ↓
handler runs normally
```

see the [resumability guide](./resumability.md) for how this works in more detail.

# WHAT'S NEXT?

you've now seen how dsx connects Discord interactions to your components.

next, learn about **[reactive state](./state.md)** and how changing signals automatically updates your Discord messages.
