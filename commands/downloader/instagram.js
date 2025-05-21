export default {
  cmd: ["instagram", "ig", "igdl"],
  name: "instagram",
  category: "downloader",
  description: "Download video/reels dari Instagram",
  usages: [["ig <url>", "Download video Instagram/reels"]],
  execute: async (m, { client, API }) => {
    if (!m.text) {
      throw {
        message: "⚠️ Silakan masukkan URL Instagram yang ingin diunduh.",
        example: true,
      };
    }

    const igRegex =
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/?([a-zA-Z0-9\.\_\-]+)?\/([p|reel|tv])+([\/\w\.-]*)/i;
    if (!igRegex.test(m.text)) {
      throw "❌ URL tidak valid! Pastikan URL berasal dari Instagram (Post/Reel/TV).";
    }

    try {
      const processMsg = await m.reply(
        "⏳ Sedang memproses video Instagram...",
      );

      const response = await API.call("/download/instagram", {
        url: m.text,
      });

      if (!response || response.status !== 200 || !response.result) {
        throw "❌ Gagal mendapatkan data video Instagram.";
      }

      for (const videoUrl of response.result) {
        await m.reply(videoUrl, {
          caption: `📥 *Instagram Downloader*\n\n⚡ Powered by ${client.user.name}`,
          gifPlayback: false,
        });
      }

      if (processMsg.deletable) {
        await processMsg.delete();
      }
    } catch (error) {
      console.error("Instagram Download Error:", error);
      await m.reply(
        `❌ Terjadi kesalahan: ${error.message || "Tidak dapat mengunduh video Instagram."}\n\nPastikan video/reel tidak private dan dapat diakses.`,
      );
    }
  },
};
