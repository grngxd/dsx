<div align="center">
  <img src="../../assets/header.png" width="100%" alt="dsx header image" />
</div>

# COMPONENTS AND PROPS

dsx components can accept **props** just like normal JSX components.

props are useful when you want to build a component once and reuse it with different values.

# BASIC PROPS

for example, you can create a reusable profile component:

```tsx id="q0j3mx"
type ProfileProps = {
    name: string;
    bio: string;
};

const Profile = ({
    name,
    bio,
}: ProfileProps) => (
    <Embed color="Blurple">
        <Title>{name}</Title>
        <Description>{bio}</Description>
    </Embed>
);
```

you can then reuse it with different props:

```tsx id="0c8g4c"
<Message>
    <Profile
        name="grng"
        bio="building dsx"
    />
</Message>
```

# COMPONENT PROPS

props can contain any values your component needs.

```tsx id="r85r3l"
type CounterProps = {
    initial: number;
    step: number;
};

const Counter = ({
    initial,
    step,
}: CounterProps) => {
    const count = useSignal(initial);

    return (
        <Message>
            <Actions>
                <Button
                    onClick={() => {
                        count.value += step;
                    }}
                >
                    {count.value}
                </Button>
            </Actions>
        </Message>
    );
};
```

now the same component can be configured differently:

```tsx id="5j7m4t"
<Message>
    <Counter initial={0} step={1} />
    <Counter initial={10} step={5} />
</Message>
```

each component instance gets its own state.

# CHILDREN

components can also receive `children` through props.

```tsx id="45p9ko"
type CardProps = {
    title: string;
    children?: any;
};

const Card = ({
    title,
    children,
}: CardProps) => (
    <Embed color="Blurple">
        <Title>{title}</Title>
        <Description>
            {children}
        </Description>
    </Embed>
);
```

use it like:

```tsx id="49o0mi"
<Message>
    <Card title="hello">
        content inside the card
    </Card>
</Message>
```

`children` contains whatever JSX was placed inside the component.

# PROPS AND REACTIVE STATE

props and signals can be used together.

```tsx id="f16bh0"
type CounterProps = {
    step: number;
};

const Counter = ({
    step,
}: CounterProps) => {
    const count = useSignal(0);

    return (
        <Message>
            <Actions>
                <Button
                    onClick={() => {
                        count.value += step;
                    }}
                >
                    {count.value}
                </Button>
            </Actions>
        </Message>
    );
};
```

the prop `step` configures the component, while `count` contains state that changes during its lifetime.

# PROPS ARE INPUTS, NOT STATE

props describe how a component should be configured.

for example:

```tsx id="p3y3hc"
<Counter step={5} />
```

`step` is an input to the component.

the component can read it:

```tsx id="ykp6j7"
const Counter = ({ step }: CounterProps) => {
    // use step here
};
```

but reactive state that changes during interaction should generally live in a signal:

```tsx id="8k6g6j"
const count = useSignal(0);
```

this keeps configuration and mutable state separate.

# COMPOSING PROPS

props become especially useful when combining several components.

```tsx id="pzzqf0"
type UserCardProps = {
    name: string;
    color: number;
};

const UserCard = ({
    name,
    color,
}: UserCardProps) => (
    <Embed color={color}>
        <Title>{name}</Title>
    </Embed>
);

const App = () => (
    <Message>
        <UserCard
            name="grng"
            color={0xff00ff}
        />
    </Message>
);
```

this lets you build small components and compose them into larger interfaces without duplicating their implementation.

# RESUMABLE COMPONENTS WITH PROPS

components wrapped with `component()` can still receive props:

```tsx id="2oc5dy"
type CounterProps = {
    step: number;
};

const Counter = component(({
    step,
}: CounterProps) => {
    const count = useSignal(0);

    return (
        <Message>
            <Actions>
                <Button
                    onClick={() => {
                        count.value += step;
                    }}
                >
                    {count.value}
                </Button>
            </Actions>
        </Message>
    );
});
```

you can then use it normally:

```tsx id="eg5drq"
<Counter step={1} />
<Counter step={5} />
```

the props configure each component instance while its reactive state remains local to that instance.

# WHEN TO USE PROPS

use props when a component needs **input from its parent**.

use signals when the value needs to **change as the component runs**.

for example:

```text id="5x8wlr"
props
    ↓
configure component

signals
    ↓
store changing state

computed
    ↓
derive values

effects
    ↓
perform side effects
```

combining these gives you reusable components without duplicating state or behaviour.

# WHAT'S NEXT?

you've now seen how to build reusable dsx components with props.

next, learn about **[dropdowns](./dropdowns.md)** and the different Discord select menus available through dsx.
