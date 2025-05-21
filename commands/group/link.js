export default {
  cmd: ["linkgroup", "linkgrup", "linkgc"],
  name: "linkgroup",
  category: "group",
  description: "Get the group invite link",
  isGroup: true,
  isBotAdmin: true,
  execute: async (m, { client }) => {
    try {
      const isBotAdmin = await client
        .groupMetadata(m.chat)
        .then(
          (metadata) =>
            metadata.participants.find(
              (participant) => participant.id === client.user.id,
            ).admin !== null,
        );

      if (!isBotAdmin) {
        await m.reply("I need to be an admin to generate the group link.");
        return;
      }

      const inviteCode = await client.groupInviteCode(m.chat);
      const groupInviteLink = `https://chat.whatsapp.com/${inviteCode}`;

      await m.reply(groupInviteLink);
    } catch (error) {
      console.error("Error fetching group invite link:", error);
      await m.reply("Failed to retrieve the group invite link.");
    }
  },
};
