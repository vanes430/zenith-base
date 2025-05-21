export default {
  cmd: ["toimg", "toimage"],
  name: "toimage",
  category: "convert",
  description: "Convert sticker to image",
  execute: async (m) => {
    const quoted = m.isQuoted ? m.quoted : m;

    let { webp2mp4File } = await import("../../src/lib/sticker.js");
    if (!/webp/i.test(quoted.mime))
      return m.reply(`Reply Sticker with command ${m.prefix + m.command}`);
    if (quoted.isAnimated) {
      let media = await webp2mp4File(await quoted.download());
      await m.reply(media);
    }
    let media = await quoted.download();
    await m.reply(media, { mimetype: "image/png" });
  },
};
