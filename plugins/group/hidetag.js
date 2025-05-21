export default {
  cmd: ["hidetag", "ht"],
  name: "hidetag",
  category: "group",
  description: "Tag all member mentions",
  isGroup: true,
  isAdmin: true,
  execute: async (m, { client }) => {
    const quoted = m.isQuoted ? m.quoted : m;
    let mentions = m.metadata.participants.map((a) => a.id);
    let mod = await client.cMod(
      m.chat,
      quoted,
      /hidetag|tag|ht|h|totag/i.test(quoted.body)
        ? quoted.body.replace(m.prefix + m.command, "")
        : quoted.body,
    );
    await client.sendMessage(m.chat, { forward: mod, mentions });
  },
};
