import { expect, test } from "bun:test";
import { Client, EmbedBuilder } from "discord.js";
import { Description, Embed, Message, Title } from "./components";
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
        <Description> what's lookin good cookin?</Description>
      </Embed>
      <Embed color="#00FF00">
        <Title>another embed</Title>
        <Description> more content here</Description>
      </Embed>
    </Message>
  ));

  const native = {
    embeds: [
      new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("test")
        .setDescription(" what's lookin good cookin?"),
      new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("another embed")
        .setDescription(" more content here"),
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
            return sent;
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
