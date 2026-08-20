<div align="center">
  <img src="../../assets/header.png" width="100%" alt="dsx header image" />
</div>

# MODALS

dsx provides a simple way to create **Discord modals** using the `Modal` and `TextInput` components.

modals are separate from normal messages. they are shown in response to an interaction and submit their values back through `onSubmit`.

# CREATING A MODAL

a modal is a component containing one or more `TextInput` components:

```tsx id="9q7m3a"
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
            placeholder="Tell us about yourself"
            maxLength={200}
        />
    </Modal>
));
```

the `title` is shown at the top of the modal.

each `TextInput` must have a unique `id`.

# SHOWING A MODAL

use `showModal()` to show a modal from a Discord interaction.

```tsx id="q1c7xp"
import { showModal } from "dsxjs/renderer";

<Button
    onClick={interaction => {
        showModal(interaction, <Profile />);
    }}
>
    Edit profile
</Button>
```

`showModal()` takes the interaction and the rendered modal component.

the interaction must be one that can show a modal, such as a button interaction.

# SUBMITTING A MODAL

when the user submits a modal, dsx calls the `onSubmit` handler.

```tsx id="4j6m8w"
<Modal
    title="Edit profile"
    onSubmit={values => {
        console.log(values);
    }}
>
    ...
</Modal>
```

the handler receives an object containing the submitted values.

the keys are the `id` values from the corresponding `TextInput` components.

for example:

```tsx id="7x2r9k"
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
    />

    <TextInput
        id="bio"
        label="Bio"
    />
</Modal>
```

submitting the modal might produce:

```ts id="m4xq8v"
{
    name: "grng",
    bio: "building dsx"
}
```

all text input values are returned as strings.

# TEXT INPUTS

`TextInput` supports the common options provided by Discord's modal text inputs.

```tsx id="e3p7ry"
<TextInput
    id="name"
    label="Name"
    description="Your display name"
    placeholder="grng"
    value="grng"
    required
    minLength={1}
    maxLength={32}
/>
```

## `id`

the `id` identifies the input and is used as the key in the submitted values.

```tsx id="h5t1qk"
<TextInput
    id="username"
    label="Username"
/>
```

the submitted value is then available as:

```ts id="s7w2mz"
values.username
```

## `label`

`label` is the text shown next to the input in the modal.

```tsx id="k2v8nx"
<TextInput
    id="name"
    label="Name"
/>
```

## `description`

use `description` to provide additional context for the input.

```tsx id="p4d9sh"
<TextInput
    id="name"
    label="Name"
    description="This is shown below the label"
/>
```

## `placeholder`

use `placeholder` to show example or contextual text before the user enters a value.

```tsx id="y8c3fw"
<TextInput
    id="name"
    label="Name"
    placeholder="grng"
/>
```

## `value`

use `value` to provide an initial value.

```tsx id="q6m1nz"
<TextInput
    id="name"
    label="Name"
    value="grng"
/>
```

## `required`

inputs are optional by default unless `required` is set.

```tsx id="w3p8hd"
<TextInput
    id="bio"
    label="Bio"
    required
/>
```

## `minLength` and `maxLength`

these control the allowed length of the submitted value.

```tsx id="f9k2wr"
<TextInput
    id="bio"
    label="Bio"
    minLength={10}
    maxLength={200}
/>
```

# TEXT INPUT STYLES

text inputs support two styles:

```text id="r8v4xm"
short
paragraph
```

use `short` for small values such as names or usernames:

```tsx id="n2c6qy"
<TextInput
    id="name"
    label="Name"
    style="short"
/>
```

use `paragraph` for longer text:

```tsx id="z5m1vk"
<TextInput
    id="bio"
    label="Bio"
    style="paragraph"
/>
```

`short` is the default style.

# A COMPLETE EXAMPLE

here is a complete example that opens a modal and uses its submitted values:

```tsx id="u7q4jc"
import { Client } from "discord.js";

import {
    Actions,
    Button,
    Message,
    Modal,
    TextInput,
} from "dsxjs/components";

import { showModal } from "dsxjs/renderer";
import { component, dsx, mount } from "dsxjs/renderer";

const Profile = component(() => (
    <Modal
        title="Edit profile"
        onSubmit={values => {
            console.log("name:", values.name);
            console.log("bio:", values.bio);
        }}
    >
        <TextInput
            id="name"
            label="Name"
            description="Your display name"
            placeholder="grng"
            maxLength={32}
        />

        <TextInput
            id="bio"
            label="Bio"
            style="paragraph"
            placeholder="Tell us about yourself"
            maxLength={200}
        />
    </Modal>
));

const App = component(() => (
    <Message>
        <Actions>
            <Button
                onClick={interaction => {
                    showModal(interaction, <Profile />);
                }}
            >
                Edit profile
            </Button>
        </Actions>
    </Message>
));
```

the modal can then be mounted like any other dsx component.

# MODALS AND REACTIVITY

modal submissions can update reactive state just like button and dropdown interactions.

```tsx id="c6p2mv"
const App = component(() => {
    const name = useSignal("grng");

    const Profile = component(() => (
        <Modal
            title="Edit profile"
            onSubmit={values => {
                if (values.name) {
                    name.value = values.name;
                }
            }}
        >
            <TextInput
                id="name"
                label="Name"
                value={name.value}
            />
        </Modal>
    ));

    return (
        <Message>
            <Description>
                hello, {name.value}
            </Description>

            <Actions>
                <Button
                    onClick={interaction => {
                        showModal(interaction, <Profile />);
                    }}
                >
                    Edit name
                </Button>
            </Actions>
        </Message>
    );
});
```

the modal submits its values, the handler updates the signal, and dsx rerenders the message.

# IMPORTANT

a modal is **not** mounted into a Discord message.

`mount()` is used for message components, while `showModal()` is used to respond to an interaction with a modal.

```text id="n4x7qc"
Message component
    ↓
mount()
    ↓
Discord message

Interaction
    ↓
showModal()
    ↓
Modal
    ↓
onSubmit
```

# WHAT'S NEXT?

you now know how to build and submit Discord modals with dsx.

next, learn about **[resumability](./resumability.md)** and how interactive components continue working after a bot restart.
