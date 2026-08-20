<div align="center">
  <img src="../../assets/header.png" width="100%" alt="dsx header image" />
</div>

# RESUMABILITY

resumability is one of dsx's core features.

normally, an interactive Discord message depends on the process that created it. if that process restarts, the message still exists in Discord, but the state and handlers that created it may be gone.

dsx is designed so that **interactive components can continue working after a bot restart**.

# WHY RESUMABILITY MATTERS

consider a simple counter:

```text id="q3f6dc"
counter: 0
    ↓
click
    ↓
counter: 1
    ↓
click
    ↓
counter: 2
```

now the bot restarts.

the Discord message is still there, so ideally the next click should continue from `2`:

```text id="w7a2p4"
bot restarts
    ↓
click
    ↓
counter: 3
```

with dsx, this is handled automatically for **resumable components**.

# MAKING A COMPONENT RESUMABLE

wrap the component with `component()`:

```tsx id="v5j2kn"
import { component } from "dsxjs/renderer";

const Counter = component(() => {
    const count = useSignal(0);

    return (
        <Message>
            <Description>
                count: {count.value}
            </Description>

            <Actions>
                <Button onClick={() => count.value++}>
                    +
                </Button>
            </Actions>
        </Message>
    );
});
```

`component()` registers the function with dsx and gives it a stable component identity.

that identity is used when dsx needs to reconstruct the component from a Discord interaction.

# HOW IT WORKS

when dsx renders an interactive component, it stores the information needed to identify the component and restore its state in the interaction data attached to the Discord component.

conceptually, the process looks like this:

```text id="r7g6fz"
component
    ↓
component identity
    +
interaction identity
    +
state
    ↓
Discord component
```

the user can then interact with that component later.

if the original process is still running, dsx continues using the existing runtime.

if the process has restarted, dsx can use the information stored in the Discord component to **reconstruct the component and its state**.

# STATE IS RESTORED

signals inside a resumable component are restored with their current values.

for example:

```tsx id="m8d5k2"
const Counter = component(() => {
    const count = useSignal(0);

    return (
        <Message>
            <Description>
                count: {count.value}
            </Description>

            <Actions>
                <Button onClick={() => count.value++}>
                    +
                </Button>
            </Actions>
        </Message>
    );
});
```

if the counter reaches `5`, then the bot restarts, the next interaction continues from the restored state:

```text id="eq4w2c"
before restart:
count = 5

bot restarts

after interaction:
count = 6
```

you don't need to manually serialize the signal or create a database entry for the component just to restore this state.

# RESUMABILITY IS COMPONENT-SCOPED

resumability applies to the component instance that owns the state.

for example, if you mount the same counter twice:

```text id="o8n4rm"
message A → count: 0
message B → count: 0
```

clicking message A changes only message A:

```text id="8b5v0x"
message A → count: 1
message B → count: 0
```

each mounted message has its own runtime state.

# GENERATED IDS

interactive components need stable identities so dsx can determine which component should handle an interaction.

you normally don't need to manage these ids yourself.

for example:

```tsx id="l4j6yq"
<Actions>
    <Button onClick={...}>
        one
    </Button>

    <Button onClick={...}>
        two
    </Button>
</Actions>
```

dsx generates the required internal ids when the component is rendered.

this is why you usually don't need to provide an `id` for every button or dropdown.

you can provide an explicit `id` when you need a stable identifier within your component:

```tsx id="n4q8hy"
<Button
    id="confirm"
    onClick={...}
>
    Confirm
</Button>
```

# WHAT RESUMABILITY DOES NOT DO

resumability does **not** make everything about your bot persistent.

it does not automatically persist:

* external variables outside the component
* database data
* files or external resources
* arbitrary process memory
* information that was never part of the resumable component's state

for example:

```tsx id="z6n3sk"
let total = 0;

const App = component(() => {
    ...
});
```

`total` is still ordinary JavaScript state. restarting the process resets it.

use a database or another persistence mechanism when data needs to exist independently of the component runtime.

# COMPONENTS THAT ARE NOT RESUMABLE

components that aren't registered with `component()` aren't registered with the resumability system.

for example:

```tsx id="j8k5v2"
const App = () => (
    <Message>
        Hello!
    </Message>
);
```

this is still a valid dsx component, but it doesn't get a resumable component identity.

for interactive components, prefer:

```tsx id="d4p7cx"
const App = component(() => (
    <Message>
        ...
    </Message>
));
```

# RESUMABILITY AND INTERACTIONS

buttons and dropdowns use resumable interaction data so dsx can determine which component and handler should receive the interaction.

for example:

```tsx id="8q2n4m"
const App = component(() => {
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

the interaction flow is roughly:

```text id="m6r1vx"
Discord interaction
    ↓
dsx reads the component information
    ↓
finds / restores the component
    ↓
restores state
    ↓
runs the handler
    ↓
component rerenders
    ↓
Discord message updates
```

# RESUMABILITY AND MODALS

modals work slightly differently from buttons and dropdowns because they are shown as a separate interaction response.

the modal itself can be created from a component:

```tsx id="p7x2hk"
const Profile = component(() => (
    <Modal
        title="Edit profile"
        onSubmit={values => {
            console.log(values);
        }}
    >
        <TextInput
            id="name"
            label="Name"
        />
    </Modal>
));
```

see the [modals guide](./modals.md) for the full modal API.

# KEEPING STATE PERSISTENT OUTSIDE DSX

resumability is useful for **component state**, but some applications need longer-lived data.

for example:

```text id="v3k7hy"
dsx signal state
    ↓
temporary UI state

database
    ↓
persistent application data
```

a Discord profile, configuration, inventory, or other long-lived data should generally live in your own persistence layer.

dsx can then use that data as part of a component:

```tsx id="w4m8qr"
const Profile = component(() => {
    const profile = useSignal(loadProfile());

    return (
        <Message>
            ...
        </Message>
    );
});
```

resumability and external persistence solve **different problems** and can be used together.

# WHAT'S NEXT?

resumability allows dsx components to continue working across process restarts.

next, learn about **[Components V2](./v2.md)** and how dsx maps Discord's Components V2 API into JSX.
