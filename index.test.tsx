import { expect, test } from "bun:test";
import { Client, EmbedBuilder } from "discord.js";
import { Description, Dropdown, Embed, Field, Fields, Message, Title } from "./components";
import { useEffect } from "./hooks/effect";
import { useSignal } from "./hooks/signal";
import { mount, render } from "./renderer";

test("should handle basic text", () => {
  const rendered = render(() => <Message>disco is goated</Message>);

  const native = {
    content: "disco is goated",
  };

  expect(rendered).toMatchObject(native);
});

test("should handle embeds", () => {
  const rendered = render(() => (
    <Message>
      <Embed color="#FF0000">
        <Title>test</Title>
        <Description> what's lookin good cookin?</Description>
      </Embed>
    </Message>
  ));

  const native = {
    embeds: [
      new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("test")
        .setDescription(" what's lookin good cookin?"),
    ],
  };

  expect(rendered).toMatchObject(native);
});

test("should handle multiple embeds", () => {
  const rendered = render(() => (
    <Message>
      <Embed color="#FF0000">
        <Title>test</Title>
        <Description>what's lookin good cookin?</Description>
      </Embed>
      <Embed color="#00FF00">
        <Title>another embed</Title>
        <Description>more content here</Description>
      </Embed>
    </Message>
  ));

  const native = {
    embeds: [
      new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("test")
        .setDescription("what's lookin good cookin?"),
      new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("another embed")
        .setDescription("more content here"),
    ],
  };

  expect(rendered).toMatchObject(native);
});

test("should handle inf-nested components", () => {
  const Child = () => <Description>child</Description>;

  const Parent = () => (
    <Embed color="#FF0000">
      <Title>test</Title>
      <Child />
    </Embed>
  );

  const rendered = render(() => (
    <Message>
      <Parent />
    </Message>
  ));

  const native = {
    embeds: [
      new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("test")
        .setDescription("child"),
    ],
  };

  expect(rendered).toMatchObject(native);
});

test("should be reactive with signal (will pass without TOKEN/CHANNEL in .env)", async () => {
  const token = process.env.TOKEN;
  const cid = process.env.CHANNEL;
  if (!token || !cid) {
    console.error("TOKEN OR CHANNEL not set, skipping reactive test");
    return;
  }

  await new Promise((resolve, reject) => {
    const bot = new Client({
      intents: ["Guilds", "GuildMessages", "MessageContent"],
    });

    bot.on("ready", async () => {
      try {
        const channel = await bot.channels.fetch(cid);
        if (!channel || !channel.isTextBased() || !channel.isSendable()) {
          console.error(
            "channel not found or not sendable, skipping reactive test",
          );
          resolve(void 0);
          return;
        }

        const Counter = () => {
          const count = useSignal(0);
          useEffect(() => {
            const id = setInterval(() => {
            count.value++;
          }, 100);

            return () => clearInterval(id);
          });
          return <Message>Current count: {count.value}</Message>;
        };

        let lastContent = "";
        await mount(
          Counter,
          bot,
          async (msg) => {
            const sent = await channel.send(msg);
            lastContent = sent.content;

            const proxy = new Proxy(sent, {
              get(target, prop, receiver) {
                if (prop === "edit") {
                  return async (newMsg: any) => {
                    const result = await target.edit(newMsg);
                    lastContent = result.content;
                    return result;
                  };
                }
                return Reflect.get(target, prop, receiver);
              }
            });

            return proxy;
          },
        );

        let tries = 0;
        let countValue = 0;
        while (tries < 20) {
          await new Promise((res) => setTimeout(res, 100));
          const match = lastContent.match(/Current count: (\d+)/);
          if (match) {
            countValue = parseInt(match[1] ?? "0", 10);
            if (countValue > 0) break;
          }
          tries++;
        }

        try {
          expect(lastContent).toContain("Current count: ");
          expect(countValue).toBeGreaterThan(0);
          resolve(void 0);
        } catch (err) {
          reject(err);
        }
      } catch (err) {
        reject(err);
      }
    });
    bot.login(token).catch(reject);
  });
});

test("should throw error for invalid embed structure", () => {
  const result = render(() => (
    <Message>
      <Embed>
        <Description>Only one description allowed</Description>
        <Description>Another description</Description>
      </Embed>
    </Message>
  ));
  expect((result.embeds![0] as EmbedBuilder).data.description).toInclude(
    "<Description> can only be used once inside <Embed>"
  );
});

test("fields", () => {
  const result = render(() => (
    <Message>
      <Embed>
        <Title>Fields Test</Title>
        <Description>Testing fields in embed</Description>
        <Fields>
          <Field inline>
            <Title>Field 1</Title>
            <Description>Value 1</Description>
          </Field>

          <Field>
            <Title>Field 2</Title>
            <Description>Value 2</Description>
          </Field>
        </Fields>
      </Embed>
    </Message>
  ))

  const embed = result.embeds![0] as EmbedBuilder;
  expect(embed.data.fields).toHaveLength(2);
  expect(embed.data.fields![0]!.name).toBe("Field 1");
  expect(embed.data.fields![0]!.value).toBe("Value 1");
  expect(embed.data.fields![0]!.inline).toBe(true);

  expect(embed.data.fields![1]!.name).toBe("Field 2");
  expect(embed.data.fields![1]!.value).toBe("Value 2");
  expect(embed.data.fields![1]!.inline).toBe(false);
})

test("dropdown", () => {
  const result = render(() => (
    <Message>
      <Embed>
        <Dropdown
          placeholder="Select an option"
          options={[
            { label: "One", description: "First", value: "one" },
            { label: "Two", description: "Second", value: "two" },
          ]}
        />
      </Embed>
    </Message>
  ));

  // components should exist and contain an action row
  expect(result.components).toBeDefined();
  expect(result.components!.length).toBeGreaterThan(0);

  const actionRow = result.components![0] as any;
  // action row builders expose their child components in .components
  const menu = actionRow.components?.[0];
  expect(menu).toBeDefined();

  // builder .data should contain placeholder and options
  expect(menu.data).toBeDefined();
  expect(menu.data.placeholder).toBe("Select an option");
  expect(menu.data.options).toHaveLength(2);
  expect(menu.data.options[0].label).toBe("One");
  expect(menu.data.options[0].value).toBe("one");
  expect(menu.data.options[1].label).toBe("Two");
  expect(menu.data.options[1].value).toBe("two");

  // ensure a custom id was generated (either custom_id or customId depending on version)
  const customId = menu.data.custom_id ?? menu.data.customId ?? menu.data.customId;
  expect(typeof customId).toBe("string");
});