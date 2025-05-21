export default {
  cmd: ["kick"],
  name: ["kick"],
  category: "group",
  description: "Kick a member from the group.",
  isGroup: true,
  isAdmin: true,
  isBotAdmin: true,
  execute: async (m, { client, config }) => {
    try {
      let who = m.quoted
        ? m.quoted.sender
        : m.mentions?.[0]
          ? m.mentions[0]
          : m.text
            ? m.text.replace(/\D/g, "") + "@s.whatsapp.net"
            : "";
      if (!who || who == m.sender)
        return m.reply("*Quote / tag* target yang ingin di kick!!");
      if (m.metadata.participants.filter((v) => v.id == who).length == 0)
        return m.reply(`Target tidak berada dalam Grup !`);
      if (
        somematch(
          [client.user.jid, ...config.owner.map((v) => v + "@s.whatsapp.net")],
          who,
        )
      )
        return m.reply("Jangan gitu ama Owner");
      await client.groupParticipantsUpdate(m.chat, [who], "remove");
    } catch (error) {
      console.error(error);
      await client.sendMessage(m.chat, error.toString(), { quoted: m });
    }
  },
};

const somematch = (data, id) => {
  let res = data.find((el) => el === id);
  return res ? true : false;
};
