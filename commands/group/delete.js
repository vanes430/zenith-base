export default {
  cmd: ["delete", "d"],
  name: "delete",
  category: "group",
  description: "delete message from group",
  isGroup: true,
  execute: async (m, { client }) => {
    const quoted = m.isQuoted ? m.quoted : m;
    if (quoted.fromMe) {
      await client.sendMessage(m.chat, { delete: quoted.key });
    } else {
      if (!m.isBotAdmin) return m.reply("botAdmin");
      if (!m.isAdmin) return m.reply("admin");
      await client.sendMessage(m.chat, { delete: quoted.key });
    }
  },
};
