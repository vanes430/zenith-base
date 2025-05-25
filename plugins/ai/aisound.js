import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import fetch from "node-fetch";

export default {
  cmd: ["aisound"],
  name: "aisound",
  category: "ai",
  description: "Convert text to speech dengan voice random via Pollinations AI (GET API)",
  execute: async (m, { Func, client }) => {
    const availableVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

    if (!m.text || m.text.trim() === "") {
      return m.reply(
        Func.example(
          m.prefix,
          m.command,
          "Halo, bagaimana kabarmu hari ini?"
        )
      );
    }

    const prompt = m.text.trim();

    if (prompt.length < 5) {
      return m.reply("Tolong masukkan teks minimal 5 karakter untuk dibuat suara.");
    }

    // Pilih voice random
    const voice = availableVoices[Math.floor(Math.random() * availableVoices.length)];

    const tempDir = path.resolve("./temp");

    try {
      await m.react("⏳");

      // Encode prompt agar aman di URL
      const promptEncoded = encodeURIComponent(prompt);

      // Endpoint GET
      const url = `https://text.pollinations.ai/${promptEncoded}?model=openai-audio&voice=${voice}`;

      const response = await fetch(url);

      if (response.status === 429) {
        await m.react("❌");
        return m.reply("Model AI sedang sibuk, coba lagi nanti.");
      }

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Pastikan folder temp ada
      try {
        await fs.access(tempDir);
      } catch {
        await fs.mkdir(tempDir, { recursive: true });
      }

      // Nama file random
      const fileName = crypto.randomBytes(4).toString("hex") + ".mp3";
      const filePath = path.join(tempDir, fileName);

      // Simpan file audio sementara
      await fs.writeFile(filePath, buffer);

      await m.react("✅");

      const jid = m.chat || m.from;
      if (!jid) {
        await m.react("❌");
        return m.reply("Tidak dapat menentukan tujuan pengiriman pesan.");
      }

      // Kirim audio
      await client.sendMessage(
        jid,
        {
          audio: { url: filePath },
          mimetype: "audio/mpeg",
          ptt: true,
          fileName,
        },
        { quoted: m }
      );

      // Hapus file sementara
      await fs.unlink(filePath);
    } catch (err) {
      await m.react("❌");
      await m.reply("Terjadi kesalahan saat membuat suara. Silakan coba lagi nanti.");
      console.error("Error aisound:", err);
    }
  },
};
