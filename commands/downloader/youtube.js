export default {
  cmd: ["ytmp3", "ytmp4"],
  name: ["ytmp3", "ytmp4"],
  cetegory: "downloader",
  description: "Download video/audio dari YouTube",
  execute: async (m, { client, API, Func }) => {
    if (!m.text)
      return m.reply(
        Func.example(
          m.prefix,
          m.command,
          "https://youtube.com/watch?v=KXQehM6GzYI",
        ),
      );
    const url = m.text;
    if (!Func.isUrl(url)) {
      return m.reply("[!] Silakan masukkan URL video/audio YouTube.");
    }

    await m.react("🕒");

    try {
      const isAudio = m.command === "ytmp3";
      const type = isAudio ? "audio" : "video";
      const quality = isAudio ? "128kbps" : "720"; // Sesuaikan kualitas jika diperlukan

      const result = await API.call("/download/youtube", {
        url,
        type,
        quality,
      });

      if (!result || !result.result) {
        return m.reply(
          "Gagal mendapatkan data dari URL YouTube. Silakan coba lagi.",
        );
      }

      const { title, url: downloadUrl } = result.result;
      const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, ""); // Hapus karakter ilegal dari nama file
      const extension = isAudio ? "mp3" : "mp4";
      const filename = `${sanitizedTitle}.${extension}`;

      if (!downloadUrl) {
        return m.reply("Gagal mendapatkan URL download. Silakan coba lagi.");
      }

      await m.reply(`Mengunduh ${isAudio ? "audio" : "video"}: ${title}`);
      await client.sendMedia(m.chat, downloadUrl, m, {
        mimetype: isAudio ? "audio/mpeg" : "video/mp4",
        fileName: filename,
      });
    } catch (error) {
      console.error("Error downloading YouTube content:", error);
      m.reply(
        "Terjadi kesalahan saat mencoba mengunduh konten. Silakan coba lagi.",
      );
    }
  },
};
