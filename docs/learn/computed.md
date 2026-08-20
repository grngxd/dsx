<div align="center">
  <img src="../../assets/header.png" width="100%" alt="dsx header image" />
</div>

# COMPUTED VALUES

`useComputed()` is used for values that are **derived from reactive state**.

instead of keeping a second signal in sync manually, you can derive its value from existing signals.

# BASIC USAGE

for example, if you want the doubled value of a counter:

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

when `count.value` changes, `doubled.value` automatically reflects the new result.

you don't need to do this:

```tsx
const doubled = useSignal(0);

count.value++;
doubled.value = count.value * 2;
```

instead, keep the derived value as a computed signal:

```tsx
const doubled = useComputed(() => count.value * 2);
```

# DERIVING FROM MULTIPLE SIGNALS

a computed value can depend on multiple signals:

```tsx
const App = component(() => {
    const price = useSignal(10);
    const quantity = useSignal(2);

    const total = useComputed(
        () => price.value * quantity.value
    );

    return (
        <Message>
            <Description>
                total: {total.value}
            </Description>
        </Message>
    );
});
```

changing either `price` or `quantity` changes `total`.

# COMPUTED VALUES ARE READ-ONLY

computed values are derived from other state, so they should not be assigned to directly.

```tsx
const doubled = useComputed(() => count.value * 2);
```

read the value with:

```tsx
doubled.value
```

but don't try to do:

```tsx
doubled.value = 10;
```

the source signal should be changed instead:

```tsx
count.value = 5;
```

and `doubled.value` will then become `10`.

# COMPUTED VALUES IN UI

computed values are useful for keeping UI derived from state without duplicating that state.

```tsx
const Counter = component(() => {
    const count = useSignal(0);

    const status = useComputed(() => {
        if (count.value === 0) {
            return "empty";
        }

        if (count.value < 5) {
            return "small";
        }

        return "large";
    });

    return (
        <Message>
            <Description>
                count: {count.value}
                {"\n"}
                status: {status.value}
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

the UI always uses the current value of `status` without needing another signal to store it.

# WHEN TO USE `useComputed()`

use `useComputed()` when a value can be **completely derived from other state**.

good examples include:

```tsx
const doubled = useComputed(
    () => count.value * 2
);

const total = useComputed(
    () => price.value * quantity.value
);

const label = useComputed(
    () => `${firstName.value} ${lastName.value}`
);
```

don't use it when you need a value that should exist independently of other state. in that case, use `useSignal()`.

# WHAT'S NEXT?

`useComputed()` is useful for derived values, while `useEffect()` is used when you need to perform a side effect after rendering.

continue with **[effects](./effects.md)**.
