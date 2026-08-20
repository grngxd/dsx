<div align="center">
  <img src="../../assets/header.png" width="100%" alt="dsx header image" />
</div>

# EFFECTS

`useEffect()` lets you run **side effects after a component renders**.

this is useful for things that aren't part of the Discord UI itself, such as logging, fetching data, sending notifications, or running other asynchronous work.

# BASIC USAGE

pass a function to `useEffect()`:

```tsx id="9z1j5n"
const App = component(() => {
    useEffect(() => {
        console.log("component rendered");
    });

    return (
        <Message>
            Hello!
        </Message>
    );
});
```

the effect runs after the component has been rendered.

# EFFECTS AND STATE

effects can access your signals:

```tsx id="4as7ex"
const Counter = component(() => {
    const count = useSignal(0);

    useEffect(() => {
        console.log(`count: ${count.value}`);
    });

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

when the component rerenders, the effect runs again with the current state.

for example:

```text id="4g13m8"
render
  ↓
count = 0
  ↓
effect runs
  ↓
"count: 0"

click
  ↓
count = 1
  ↓
component rerenders
  ↓
effect runs
  ↓
"count: 1"
```

# ASYNCHRONOUS EFFECTS

effects can also be asynchronous.

```tsx id="9xqy1p"
useEffect(async () => {
    const result = await fetchSomething();

    console.log(result);
});
```

this is useful when you need to perform asynchronous work after rendering.

for example:

```tsx id="v0l4oa"
const App = component(() => {
    const message = useSignal("loading...");

    useEffect(async () => {
        const result = await fetchSomething();

        message.value = result;
    });

    return (
        <Message>
            <Description>
                {message.value}
            </Description>
        </Message>
    );
});
```

when the effect updates a signal, dsx will rerender the component with the new value.

# EFFECTS AND INTERACTIONS

effects can be combined with interaction-driven state just like any other signal:

```tsx id="fx2r7n"
const Counter = component(() => {
    const count = useSignal(0);

    useEffect(() => {
        console.log(`counter changed: ${count.value}`);
    });

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

the button changes the signal, the component rerenders, and the effect runs afterwards.

# WHEN TO USE `useEffect()`

use `useEffect()` when you need to perform a **side effect** rather than calculate a value for the UI.

for example:

```tsx id="1m9m3w"
useEffect(() => {
    console.log("hello");
});
```

or:

```tsx id="bb9n13"
useEffect(async () => {
    await saveSomething();
});
```

for values that are derived from other state, use [`useComputed()`](./computed.md) instead.

# IMPORTANT

effects run after rendering, so avoid using them just to calculate values that could be derived directly from existing state.

for example, this:

```tsx id="2sg9yk"
const doubled = useComputed(
    () => count.value * 2
);
```

is preferable to using an effect to keep another signal synchronized:

```tsx id="f1s0nq"
const doubled = useSignal(0);

useEffect(() => {
    doubled.value = count.value * 2;
});
```

use **computed values for derived state** and **effects for side effects**.

# WHAT'S NEXT?

effects are one of the core hooks provided by dsx.

next, learn how to create **[reusable components and props](./components.md)**.
