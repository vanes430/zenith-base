import yts from "yt-search";

export default {
  cmd: ["play"],
  name: "play",
  category: "downloader",
  description: "Play a video or search and play from YouTube",
  cooldown: 5000,
  execute: async (m, { client, Func }) => {
    try {
      let text = m.text || (m.quoted ? m.quoted.text : null);

      if (!text) {
        return m.reply(
          `[!] Silakan masukkan URL atau kata kunci pencarian.\n\n` +
            `Contoh:\n` +
            `${m.prefix + m.command} https://youtube.com/watch?v=xxxxx\n` +
            `${m.prefix + m.command} one day`,
        );
      }

      await m.reply("⏳ Sedang memproses...");

      let url;
      if (!Func.isUrl(text)) {
        const search = await yts(text);
        if (!search?.videos?.length) {
          throw new Error(`❌ Tidak dapat menemukan hasil untuk *${text}*`);
        }
        url = search.videos[0].url;
      } else {
        url = text;
      }

      const videoInfo = await yts({ videoId: url.split("v=")[1] });

      if (!videoInfo) {
        throw new Error("❌ Tidak dapat mendapatkan informasi video");
      }

      const duration = videoInfo.duration?.timestamp || "00:00";
      const views = new Intl.NumberFormat("id-ID").format(videoInfo.views);

      let txt = `📽️ *YOUTUBE PLAY*\n\n`;
      txt += `📌 *Judul:* ${videoInfo.title}\n`;
      txt += `🎭 *Channel:* ${videoInfo.author.name}\n`;
      txt += `⏱️ *Durasi:* ${duration}\n`;
      txt += `👁️ *Views:* ${views}\n`;
      txt += `📅 *Upload:* ${videoInfo.ago}\n`;
      txt += `🔗 *URL:* ${url}\n\n`;
      txt += `Pilih format unduhan di bawah ini:`;

      await client.textList(
        m.chat,
        txt,
        videoInfo.thumbnail || videoInfo.image,
        [
          [`${m.prefix}ytmp3 ${url}`, "1", "🎵 Audio MP3"],
          [`${m.prefix}ytmp4 ${url}`, "2", "🎬 Video MP4"],
        ],
      );
    } catch (error) {
      console.error("Play command error:", error);
      return m.reply(
        `❌ Error: ${error.message || "Terjadi kesalahan saat memproses permintaan"}`,
      );
    }
  },
};
