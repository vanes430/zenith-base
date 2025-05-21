export default {
  cmd: ["promote"],
  name: "promote",
  category: "group",
  description: "Elevate members to admins",
  isGroup: true,
  isAdmin: true,
  isBotAdmin: true,
  execute: async (m, { client }) => {
    let who = m.quoted ? m.quoted.sender : m.mentions ? m.mentions[0] : "";
    if (!who) return m.reply("*Quote or @tag someone!*");

    await client.groupParticipantsUpdate(m.chat, [who], "promote");
    await m.reply(`_*Success in promoting member*_ *@${who.split("@")[0]}*`, {
      mentions: [who],
    });
  },
};
