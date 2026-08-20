<div align="center">
  <img src="../../assets/header.png" width="100%" alt="dsx header image" />
</div>
# DROPDOWNS

dsx provides a single `Dropdown` component for **Discord's select menus**.

the `type` prop determines which Discord select menu is rendered, so you can use the same dsx component for strings, users, roles, channels, and mentionables.

# STRING DROPDOWNS

a string dropdown lets users choose from a list of options.

```tsx id="5r1c8m"
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

each option needs a `label` and a `value`.

you can also add a description, emoji, or mark an option as selected by default:

```tsx id="8n4v2s"
<Dropdown
    type="string"
    options={[
        {
            label: "Red",
            value: "red",
            description: "a red option",
            emoji: "🔴",
            default: true,
        },
        {
            label: "Blue",
            value: "blue",
            description: "a blue option",
            emoji: "🔵",
        },
    ]}
/>
```

# SELECT VALUES

the `onChange` callback receives the normal `StringSelectMenuInteraction` from discord.js.

the selected values are available through `interaction.values`:

```tsx id="x8k3qp"
onChange={interaction => {
    console.log(interaction.values);
}}
```

for a normal single-select dropdown, this will contain one value.

# MULTI-SELECT

use `minValues` and `maxValues` to allow users to select multiple options.

```tsx id="j3w9fa"
<Dropdown
    type="string"
    minValues={1}
    maxValues={3}
    options={[
        { label: "Red", value: "red" },
        { label: "Blue", value: "blue" },
        { label: "Green", value: "green" },
    ]}
    onChange={interaction => {
        console.log(interaction.values);
    }}
/>
```

`interaction.values` always contains the values selected in the current interaction.

# CONTROLLED STRING DROPDOWNS

string dropdowns can use `value` to control the selected options.

for a single-select dropdown, use a string:

```tsx id="0x9v3m"
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

for a multi-select dropdown, use an array:

```tsx id="4g2k7c"
const colors = useSignal(["red"]);

<Dropdown
    type="string"
    minValues={1}
    maxValues={3}
    value={colors.value}
    options={[
        { label: "Red", value: "red" },
        { label: "Blue", value: "blue" },
        { label: "Green", value: "green" },
    ]}
    onChange={interaction => {
        colors.value = interaction.values;
    }}
/>
```

the `value` prop controls which options are marked as selected when dsx renders the dropdown.

# USER DROPDOWNS

use `type="user"` when you want users to select Discord users.

```tsx id="c7b1qm"
<Actions>
    <Dropdown
        type="user"
        placeholder="Select users"
        onChange={interaction => {
            console.log(interaction.values);
        }}
    />
</Actions>
```

you can specify default users with `defaultUsers`:

```tsx id="n9k4vp"
<Dropdown
    type="user"
    defaultUsers={["123456789012345678"]}
    onChange={interaction => {
        console.log(interaction.values);
    }}
/>
```

the handler receives a normal `UserSelectMenuInteraction`.

# ROLE DROPDOWNS

use `type="role"` to let users select Discord roles.

```tsx id="q5z8rm"
<Dropdown
    type="role"
    placeholder="Select roles"
    onChange={interaction => {
        console.log(interaction.values);
    }}
/>
```

default roles can be specified with `defaultRoles`:

```tsx id="v3p1xd"
<Dropdown
    type="role"
    defaultRoles={["123456789012345678"]}
    onChange={interaction => {
        console.log(interaction.values);
    }}
/>
```

the handler receives a normal `RoleSelectMenuInteraction`.

# CHANNEL DROPDOWNS

use `type="channel"` to let users select channels.

```tsx id="6f8m2r"
<Dropdown
    type="channel"
    placeholder="Select channels"
    onChange={interaction => {
        console.log(interaction.values);
    }}
/>
```

you can restrict which channel types can be selected with `channelTypes`:

```tsx id="y1c5qp"
import { ChannelType } from "discord.js";

<Dropdown
    type="channel"
    channelTypes={[
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
    ]}
    onChange={interaction => {
        console.log(interaction.values);
    }}
/>
```

default channels can be specified with `defaultChannels`:

```tsx id="x0n6wv"
<Dropdown
    type="channel"
    defaultChannels={["123456789012345678"]}
/>
```

the handler receives a normal `ChannelSelectMenuInteraction`.

# MENTIONABLE DROPDOWNS

use `type="mentionable"` when users should be able to select either users or roles.

```tsx id="r4c9mb"
<Dropdown
    type="mentionable"
    placeholder="Select a user or role"
    onChange={interaction => {
        console.log(interaction.values);
    }}
/>
```

you can provide default users and roles separately:

```tsx id="2y7k5f"
<Dropdown
    type="mentionable"
    defaultUsers={["123456789012345678"]}
    defaultRoles={["987654321098765432"]}
    onChange={interaction => {
        console.log(interaction.values);
    }}
/>
```

the handler receives a normal `MentionableSelectMenuInteraction`.

# COMMON PROPS

all dropdown types support these common props:

```text id="mq7d3p"
id
placeholder
disabled
minValues
maxValues
onChange
```

`id` identifies the dropdown inside the component.

`placeholder` controls the text shown when nothing is selected.

`disabled` prevents the dropdown from being used.

`minValues` controls the minimum number of selections.

`maxValues` controls the maximum number of selections.

`onChange` handles the Discord select-menu interaction.

# USING DROPDOWNS WITH STATE

dropdowns work naturally with signals.

```tsx id="7b9q2w"
const selected = useSignal("red");

const App = component(() => (
    <Message>
        <Description>
            selected: {selected.value}
        </Description>

        <Actions>
            <Dropdown
                type="string"
                value={selected.value}
                options={[
                    { label: "Red", value: "red" },
                    { label: "Blue", value: "blue" },
                ]}
                onChange={interaction => {
                    selected.value = interaction.values[0];
                }}
            />
        </Actions>
    </Message>
));
```

changing the selection changes the signal, which causes dsx to rerender the message.

# DROPDOWN LIMITS

Discord imposes limits on select menus, and dsx validates the values you provide.

for string dropdowns, you can have between **1 and 25 options**.

`maxValues` cannot be greater than the number of available options.

`minValues` cannot be greater than `maxValues`.

# WHAT'S NEXT?

you now know how to use all of dsx's dropdown types and how to connect them to reactive state.

next, learn how to build **[modals](./modals.md)** with `Modal` and `TextInput`.
