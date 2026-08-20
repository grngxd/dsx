<div align="center">
  <img src="../../assets/header.png" width="100%" alt="dsx header image" />
</div>

# REACTIVE STATE

dsx uses **signals** to make Discord messages reactive.

instead of manually tracking state and calling `message.edit()` whenever something changes, you store the value in a signal and let dsx update the message for you.

# SIGNALS

create a signal with `useSignal()`:

```tsx
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

a signal has a `.value` property containing the current state.

```tsx
const count = useSignal(0);

console.log(count.value); // 0

count.value++;

console.log(count.value); // 1
```

when the value changes, dsx rerenders the component and updates the Discord message.

you do **not** need to call `message.edit()` yourself.

# UPDATING STATE

signals can be changed anywhere you have access to them.

```tsx
const Counter = component(() => {
    const count = useSignal(0);

    const increment = () => {
        count.value++;
    };

    const reset = () => {
        count.value = 0;
    };

    return (
        <Message>
            <Actions>
                <Button onClick={increment}>
                    +
                </Button>

                <Button onClick={reset}>
                    {count.value}
                </Button>
            </Actions>
        </Message>
    );
});
```

dsx only rerenders when the signal's value actually changes.

# MULTIPLE SIGNALS

a component can have as many signals as it needs.

```tsx
const Counter = component(() => {
    const count = useSignal(0);
    const step = useSignal(1);

    return (
        <Message>
            <Actions>
                <Button
                    onClick={() => {
                        count.value += step.value;
                    }}
                >
                    {count.value}
                </Button>

                <Button
                    onClick={() => {
                        step.value++;
                    }}
                >
                    step: {step.value}
                </Button>
            </Actions>
        </Message>
    );
});
```

each signal maintains its own state, while the component automatically reflects the current values.

# SIGNALS AND INTERACTIONS

signals are particularly useful with Discord interactions because an interaction can update state directly.

```tsx
const Counter = component(() => {
    const count = useSignal(0);

    return (
        <Message>
            <Actions>
                <Button
                    onClick={() => {
                        count.value++;
                    }}
                >
                    {count.value}
                </Button>
            </Actions>
        </Message>
    );
});
```

the flow is:

```text
button clicked
    ↓
onClick runs
    ↓
signal changes
    ↓
component rerenders
    ↓
Discord message updates
```

this is the main reactive loop in dsx.

# SIGNALS ARE LOCAL TO THE COMPONENT

signals belong to the component instance where they are created.

```tsx
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

each mounted `Counter` has its own `count`.

for example, mounting the same component twice creates two independent counters:

```text
message A → 0 → 1 → 2

message B → 0 → 1
```

changing the signal in one message does not change the other.

# SIGNALS AND RESUMABILITY

signals also work with dsx's resumability system.

when a resumable component is restored after a bot restart, dsx restores the signal state so the component can continue from where it left off.

for example:

```text
counter: 0
    ↓
click
    ↓
counter: 1
    ↓
click
    ↓
counter: 2
    ↓
bot restarts
    ↓
click
    ↓
counter: 3
```

you don't need to manually save the signal to a database just to keep the interaction working across a restart.

see the [resumability guide](./resumability.md) for more information.

# COMPUTED VALUES

when a value is derived from other reactive state, use `useComputed()` instead of maintaining another signal manually.

```tsx
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

`doubled.value` is calculated from the current value of `count`.

you don't need to update `doubled` yourself.

see [computed values](./computed-values.md) for more detail.

# WHAT'S NEXT?

you've now seen the core reactive model in dsx:

```text
useSignal()
    ↓
change .value
    ↓
component rerenders
    ↓
Discord message updates
```

next, learn about **[computed values](./computed.md)** and how to derive values from your reactive state.
