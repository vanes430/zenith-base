import ffmpeg from "fluent-ffmpeg";
ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");
import config from "../../src/configs/config.js";
export default {
  cmd: ["s", "sticker", "stiker"],
  name: "sticker",
  cetegory: "convert",
  description: "Convert image/video to sticker",
  execute: async (m, { client }) => {
    const quoted = m.isQuoted ? m.quoted : m;

    if (/image|video|webp/i.test(quoted.mime)) {
      m.reply("wait");

      const buffer = await quoted.download();
      if (quoted?.msg?.seconds > 10) return m.reply(`Max video 9 seconds`);

      let exif = {
        packName: "Create By",
        packPublish: config.pairingNumber,
      };

      if (m.text) {
        let [packname, author] = m.text.split("|");
        exif.packName = packname ? packname : "";
        exif.packPublish = author ? author : "";
      }

      m.reply(buffer, { asSticker: true, ...exif });
    } else if (m.mentions[0]) {
      m.reply("wait");
      let url = await client.profilePictureUrl(m.mentions[0], "image");
      let buffer = await fetch(url).then((res) => res.buffer());
      m.reply(buffer, { asSticker: true, ...exif });
    } else if (
      /(https?:\/\/.*\.(?:png|jpg|jpeg|webp|mov|mp4|webm|gif))/i.test(m.text)
    ) {
      m.reply("wait");
      let url = m.text.match(
        /(https?:\/\/.*\.(?:png|jpg|jpeg|webp|mov|mp4|webm|gif))/i,
      )[0];
      let buffer = await fetch(url).then((res) => res.buffer());
      m.reply(buffer, { asSticker: true, ...exif });
    } else {
      m.reply(`Method Not Support`);
    }
  },
};
