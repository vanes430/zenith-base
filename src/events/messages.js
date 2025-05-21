import config from "../configs/config.js";
import { Serialize } from "../lib/serialize.js";
import { getRandomEmoji } from "../lib/emoji.js";
import { handleMessagesUpsert } from "../handler.js";

export default async (client, store) => {
  client.ev.on("messages.upsert", async ({ messages }) => {
    if (!messages[0].message) return;

    let m = await Serialize(client, messages[0], store);

    if (store.groupMetadata && Object.keys(store.groupMetadata).length === 0) {
      store.groupMetadata = await client.groupFetchAllParticipating();
    }

    /*
    if (
      config.autoRead.story &&
      m.key &&
      !m.key.fromMe &&
      m.key.remoteJid === "status@broadcast"
    ) {
      if (m.type === "protocolMessage" && m.message.protocolMessage.type === 0)
        return;

      await client.readMessages([m.key]);
      let id = m.key.participant;
      let name = client.getName(id);

      if (config.autoRead.storyEmoji) {
        try {
          const randomEmoji = getRandomEmoji();
          await client.sendMessage(
            "status@broadcast",
            { react: { text: randomEmoji, key: m.key } },
            { statusJidList: [m.key.participant] },
          );
        } catch (error) {
          console.error("Error sending emoji reaction:", error);
        }
      }

      console.log(`Auto-read story from ${name}`);
    }

    if (config.autoRead.message && m.key && !m.key.fromMe) {
      await client.readMessages([m.key]);
    }
    */

    await handleMessagesUpsert(client, store, m, messages);
  });
};
