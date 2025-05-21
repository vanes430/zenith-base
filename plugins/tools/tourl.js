export default {
  cmd: ["tourl"],
  name: "tourl",
  cetegory: "tools",
  description: "Convert media to url",
  execute: async (m, { client, Func }) => {
    const quoted = m.isQuoted ? m.quoted : m;
    if (!quoted.isMedia) return m.reply("Reply to media messages only");

    if (!quoted.msg?.fileLength || Number(quoted.msg.fileLength) > 350000000) {
      return m.reply("File terlalu besar, maksimal 350MB");
    }

    try {
      let media = await quoted.download();
      let { data } = await Func.upload.arcdn(media);

      await client.reply(m.chat, `*Source URL :* ${data.url}`, m);
    } catch (err) {
      console.error(err);
      m.reply("Terjadi kesalahan saat upload media.");
    }
  },
};
