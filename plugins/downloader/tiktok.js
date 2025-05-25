import Tiktok from "@tobyg74/tiktok-api-dl";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { exec } from "child_process";

const downloadWithWget = (url, filepath) =>
  new Promise((resolve, reject) => {
    exec(`wget -q -O "${filepath}" "${url}"`, (error) =>
      error ? reject(error) : resolve()
    );
  });

export default {
  cmd: ["tiktok", "tt"],
  name: "tiktok",
  category: "downloader",
  description:
    "Download video atau audio dari TikTok. Ketik .tiktok <url>, lalu pilih Video atau Audio.",
  usages: [
    ["tiktok <url>", "Tampilkan info video dengan pilihan download Video atau Audio"],
    ["tiktok --video <url>", "Download video TikTok"],
    ["tiktok --audio <url>", "Download audio musik TikTok"],
  ],
  limit: true,
  execute: async (m, { client: sock, Func }) => {
    if (!m.text)
      throw {
        message: "⚠️ Silakan masukkan URL TikTok yang ingin diunduh.",
        example: true,
      };

    const [firstArg, ...restArgs] = m.text.trim().split(/\s+/);
    const flag = firstArg.startsWith("--") ? firstArg.toLowerCase() : null;
    const url = flag ? restArgs.join(" ") : m.text.trim();

    const validUrl = Func.isUrl(url)?.[0];
    if (!validUrl) throw "❌ Mohon sertakan URL TikTok yang valid.";
    if (!/tiktok\.com/i.test(validUrl)) throw "❌ URL bukan dari TikTok.";

    // Parallel: react dan cek/membuat folder temp (jika perlu)
    const tempDir = "./temp";
    await Promise.all([
      sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } }),
      fs.mkdir(tempDir, { recursive: true }),
    ]);

    try {
      const { status, result, message } = await Tiktok.Downloader(validUrl, {
        version: "v2",
        showOriginalResponse: false,
      });

      if (status !== "success" || !result) throw message || "❌ Gagal mendapatkan data dari TikTok.";

      const {
        author,
        desc,
        statistics,
        video,
        music,
      } = result;

      const videoUrl = Array.isArray(video?.playAddr) ? video.playAddr[0] : null;
      const musicUrl = Array.isArray(music?.playUrl) ? music.playUrl[0] : null;

      if (flag === "--video") {
        if (!videoUrl) throw "❌ Video tidak tersedia.";
        return await sock.sendMessage(
          m.chat,
          {
            video: { url: videoUrl },
            caption: `🎥 Video dari ${author?.nickname || "TikTok"}`,
          },
          { quoted: m }
        );
      }

      if (flag === "--audio") {
        if (!musicUrl) throw "❌ Audio tidak tersedia.";

        const filenameAudio = path.join(tempDir, `audio-${crypto.randomBytes(6).toString("hex")}.mp4`);

        // Download audio mp4 dengan wget
        await downloadWithWget(musicUrl, filenameAudio);

        // Kirim audio sebagai reply
        await sock.sendMessage(
          m.chat,
          {
            audio: { url: filenameAudio },
            mimetype: "audio/mp4",
          },
          { quoted: m }
        );

        await fs.unlink(filenameAudio);
        return;
      }

      // Tanpa flag: kirim info + tombol pilihan
      const caption = `👤 Author: ${author?.nickname || "-"}
📄 Deskripsi: ${desc || "-"}
👍 Likes: ${statistics?.likeCount || "0"}
💬 Komentar: ${statistics?.commentCount || "0"}
🔄 Share: ${statistics?.shareCount || "0"}`;

      const buttons = [
        { buttonId: `.tiktok --video ${validUrl}`, buttonText: { displayText: "▶️ Video" }, type: 3 },
        { buttonId: `.tiktok --audio ${validUrl}`, buttonText: { displayText: "🎵 Audio" }, type: 3 },
      ];

      await sock.sendMessage(
        m.chat,
        {
          text: caption,
          footer: "Pilih tombol untuk download Video atau Audio",
          buttons,
          headerType: 1,
          viewOnce: true,
        },
        { quoted: m }
      );
    } catch (error) {
      await m.reply(
        `❌ Terjadi kesalahan: ${error.message || error}\n\nCoba lagi nanti atau laporkan ke admin jika masalah berlanjut.`
      );
    }
  },
};
