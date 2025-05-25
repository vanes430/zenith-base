export default {
  cmd: ["hidetag", "ht"],
  name: "hidetag",
  category: "group",
  description: "Tag all member mentions with @Everyone",
  isGroup: true,
  isAdmin: true,
  execute: async (m, { client }) => {
    try {
      const groupMeta = await client.groupMetadata(m.chat);
      const mentions = groupMeta.participants.map((a) => a.id);

      // Tulis @Everyone sebagai teks yang di-tag semua anggota
      const teks = "@Everyone";

      await client.sendMessage(m.chat, {
        text: teks,
        mentions: mentions,
      });
    } catch (err) {
      console.error("Error hidetag:", err);
      await m.reply("Terjadi kesalahan saat menjalankan perintah hidetag.");
    }
  },
};
