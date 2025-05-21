export default {
  cmd: ["tiktok", "tt", "tiktoknowm", "tiktokwm"],
  name: "tiktok",
  category: "downloader",
  description: "Download video dari TikTok (dengan atau tanpa watermark)",
  usages: [
    ["tiktok <url>", "Download tanpa watermark"],
    ["tiktokwm <url>", "Download dengan watermark"],
  ],
  limit: true,
  execute: async (m, { client, API, Func }) => {
    if (!m.text) {
      throw {
        message: "⚠️ Silakan masukkan URL TikTok yang ingin diunduh.",
        example: true,
      };
    }

    const url = Func.isUrl(m.text)[0];

    const tiktokRegex = /(?:https?:\/\/)?(?:www\.|vm\.)?tiktok\.com\/[@\w.-]+/i;
    if (!tiktokRegex.test(url)) {
      throw "❌ URL tidak valid! Pastikan URL berasal dari TikTok.";
    }

    try {
      await m.reply("⏳ Sedang memproses, mohon tunggu...");

      const response = await API.call("/download/tiktok", {
        url: url,
      });

      if (!response || !response.result) {
        throw "❌ Gagal mendapatkan data video. Coba lagi nanti.";
      }

      const { video, music, author, title, stats, created_at } =
        response.result;
      const videoUrl = m.command.includes("wm")
        ? video.watermark
        : video.noWatermark;

      const caption = `🎵 *TikTok Downloader*

👤 *Author:* ${author.name} (@${author.unique_id})
📝 *Deskripsi:* ${title.slice(0, 100)}${title.length > 100 ? "..." : ""}
📅 *Dibuat:* ${created_at}

📊 *Statistik:*
👍 ${stats.likeCount} Likes
💬 ${stats.commentCount} Komentar
🔄 ${stats.shareCount} Share
▶️ ${stats.playCount} Play
💾 ${stats.saveCount} Saved

⭐ Download musik dengan command: .tiktokmp3 ${m.text}`.trim();

      await m.reply(videoUrl, {
        caption,
        gifPlayback: false,
      });
    } catch (error) {
      console.error("TikTok Download Error:", error);

      if (error.message?.includes("not found")) {
        await m.reply("❌ Video tidak ditemukan atau sudah dihapus.");
      } else if (error.message?.includes("private")) {
        await m.reply("❌ Video ini private atau tidak dapat diakses.");
      } else {
        await m.reply(
          `❌ Terjadi kesalahan: ${error.message || "Unknown error"}\n\nCoba lagi nanti atau laporkan ke admin jika masalah berlanjut.`,
        );
      }
    }
  },
};
