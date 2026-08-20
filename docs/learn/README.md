<div align="center">
  <img src="../../assets/header.png" width="100%" alt="dsx header image" />
</div>

# LEARN DSX

welcome to the **dsx learning guide!**

this section goes beyond the quick start and explains how to build larger, more interactive Discord interfaces with dsx.

you already know the basics of JSX and component-based UI, so this guide focuses on the parts that are **specific to dsx**.

# WHERE TO START

the recommended path is:

1. **[your first component](./your-first-component.md)**
   learn how dsx components work and how they fit into a discord.js bot.

2. **[interactions](./interactions.md)**
   learn how buttons, dropdowns, and other Discord interactions connect to your components.

3. **[reactive state](./state.md)**
   learn how `useSignal()` turns your Discord messages into reactive interfaces.

4. **[computed values](./computed.md)**
   learn how to derive values from reactive state with `useComputed()`.

5. **[effects](./effects.md)**
   learn how to run side effects with `useEffect()`.

6. **[components](./components.md)**
   learn how to build reusable dsx components.

7. **[dropdowns](./dropdowns.md)**
   learn how to use string, user, role, channel, and mentionable select menus.

8. **[modals](./modals.md)**
   learn how to build Discord modals with `Modal` and `TextInput`.

9. **[resumability](./resumability.md)**
   learn how dsx restores interactive messages and their state after a bot restart.

10. **[Components V2](./v2.md)**
    learn how to build interfaces using Discord's Components V2 API.

# WHAT YOU'LL LEARN

by the end of this guide, you should understand how to:

* build and compose dsx components
* mount dsx components into existing discord.js bots
* handle Discord interactions directly
* manage reactive state with signals
* create derived values with `useComputed()`
* run side effects with `useEffect()`
* build reusable components with props
* create and control Discord select menus
* build and submit modals
* use resumability to keep interactive messages working across restarts
* build Discord Components V2 interfaces

# GOING DEEPER

once you've finished the learning guide, use the **[API Reference](../reference/README.md)** when you need the exact props, types, or configuration options for a particular dsx API.

you can also explore the [**examples**](../../examples) directory for complete dsx applications.