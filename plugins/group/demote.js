export default {
  cmd: ["demote"],
  name: "demote",
  category: "group",
  description: "demote admin to member",
  isGroup: true,
  isAdmin: true,
  isBotAdmin: true,
  execute: async (m, { client }) => {
    let who = m.quoted ? m.quoted.sender : m.mentions ? m.mentions[0] : "";
    if (!who) return m.reply(`*quote / @tag* salah satu !`);
    await client.groupParticipantsUpdate(m.chat, [who], "demote");
    await m.reply(`_*Succes demote admin*_ *@${who.split("@")[0]}*`, {
      mentions: [who],
    });
  },
};
