export default {
  cmd: ["facebook", "fb", "fbdl", "fbhd", "fbsd"],
  name: "facebook",
  category: "downloader",
  description: "Download video dari Facebook (HD/SD)",
  usages: [
    ["fb <url>", "Download video Facebook"],
    ["fbhd <url>", "Download khusus kualitas HD"],
    ["fbsd <url>", "Download khusus kualitas SD"],
  ],
  execute: async (m, { client, API }) => {
    if (!m.text) {
      throw {
        message: "⚠️ Silakan masukkan URL Facebook yang ingin diunduh.",
        example: true,
      };
    }

    /*
    const fbRegex = /(?:https?:\/\/)?(?:www\.|web\.|m\.)?facebook\.com\/[a-zA-Z0-9.]+\/(?:videos\/|watch\/|reel\/\?v=|reel\/)(\d+)/i;
    if (!fbRegex.test(m.text)) {
      throw "❌ URL tidak valid! Pastikan URL berasal dari video Facebook.";
    }
    */

    try {
      const processMsg = await m.reply("⏳ Sedang memproses video Facebook...");

      const response = await API.call("/download/facebook", {
        url: m.text,
      });

      if (!response || response.status !== 200 || !response.result) {
        throw "❌ Gagal mendapatkan data video Facebook.";
      }

      const { hd, sd } = response.result;

      let videoUrl, quality;
      if (m.command.includes("hd") && hd) {
        videoUrl = hd.link;
        quality = hd.quality;
      } else if (m.command.includes("sd") && sd) {
        videoUrl = sd.link;
        quality = sd.quality;
      } else {
        videoUrl = (hd && hd.link) || (sd && sd.link);
        quality = (hd && hd.quality) || (sd && sd.quality);
      }

      if (!videoUrl) {
        throw "❌ Tidak dapat menemukan link video yang valid.";
      }

      const caption = `📥 *Facebook Downloader*
🎥 Kualitas: ${quality}
${hd && sd ? "\n💡 Tersedia kualitas lain:\n• HD: .fbhd <url>\n• SD: .fbsd <url>" : ""}

⚡ Powered by ${client.user.name}`;

      await m.reply(videoUrl, {
        caption,
      });

      if (processMsg.deletable) {
        await processMsg.delete();
      }
    } catch (error) {
      console.error("Facebook Download Error:", error);

      if (error.message?.includes("private")) {
        await m.reply("❌ Video ini private atau tidak dapat diakses.");
      } else if (error.message?.includes("not found")) {
        await m.reply("❌ Video tidak ditemukan atau sudah dihapus.");
      } else {
        await m.reply(
          `❌ Terjadi kesalahan: ${error.message || "Tidak dapat mengunduh video Facebook."}\n\nPastikan video tidak private dan dapat diakses.`,
        );
      }
    }
  },
};
