import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export default {
  cmd: ["aigen"],
  name: "aigen",
  category: "ai",
  description:
    "Generate gambar dari teks menggunakan AI dengan flag --turbo untuk model turbo dan --unsafe untuk mode NSFW.",
  execute: async (m, { Func, client }) => {
    const defaultModel = "flux";
    const safeDefault = true;
    const tempDir = path.resolve("./temp");

    if (!m.text || m.text.trim() === "") {
      return m.reply(
        Func.example(m.prefix, m.command, "pemandangan gunung di senja hari")
      );
    }

    let input = m.text.trim();
    let model = defaultModel;
    let safe = safeDefault;

    // Cek flag --turbo
    if (input.includes("--turbo")) {
      model = "turbo";
      input = input.replace(/--turbo/g, "").trim();
    }

    // Cek flag --unsafe
    if (input.includes("--unsafe")) {
      safe = false;
      input = input.replace(/--unsafe/g, "").trim();
    }

    if (input.length === 0) {
      return m.reply("Mohon masukkan prompt teks setelah flag.");
    }

    // Validasi karakter input (huruf, angka, spasi, dan tanda baca tertentu)
    const allowedCharsRegex = /^[a-zA-Z0-9\s.,!?:;\-'"()]+$/;
    if (!allowedCharsRegex.test(input)) {
      return m.reply(
        "Teks hanya boleh mengandung huruf, angka, spasi, dan tanda baca berikut: . , ! ? : ; - ' \" ( )"
      );
    }

    try {
      await m.react("⏳");

      // Generate seed random integer dengan panjang 2 sampai 9 digit
      const seedLength = Math.floor(Math.random() * 2) + 2; // 2..9 digit
      const seed = Math.floor(Math.random() * Math.pow(10, seedLength));

      // Encode prompt untuk URL
      const promptEncoded = encodeURIComponent(input);

      // Buat URL dengan flag safe dan private
      let url = `https://image.pollinations.ai/prompt/${promptEncoded}?model=${model}&safe=${safe}&nologo=true&seed=${seed}&private=true`;

      // Jika safe=false (unsafe mode), tambahkan &unsafe=true ke URL
      if (!safe) {
        url += "&unsafe=true";
      }

      // Request gambar ke API
      const response = await fetch(url);

      // Penanganan error HTTP
      if (response.status === 429) {
        await m.react("❌");
        return m.reply("Model AI sedang sibuk, coba lagi nanti.");
      }
      if (response.status >= 500) {
        await m.react("❌");
        return m.reply(
          `Terjadi gangguan server (${response.status}). Silakan coba lagi nanti.`
        );
      }
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      // Ambil data gambar
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Pastikan folder temp ada
      await fs.mkdir(tempDir, { recursive: true });

      // Simpan file sementara
      const fileName = crypto.randomBytes(4).toString("hex") + ".png";
      const filePath = path.join(tempDir, fileName);
      await fs.writeFile(filePath, buffer);

      await m.react("✅");

      // Kirim gambar ke chat
      const jid = m.chat || m.from;
      if (!jid) {
        await m.react("❌");
        return m.reply("Tidak dapat menentukan tujuan pengiriman pesan.");
      }

      await client.sendMessage(
        jid,
        {
          image: { url: filePath },
          caption: `🖼️ *Hasil Gambar*\n\n📄 Prompt: ${input}\n⚙️ Model: ${model}\n🎲 Seed: ${seed}\n⚠️ Unsafe mode: ${!safe}`,
        },
        { quoted: m }
      );

      // Hapus file sementara
      await fs.unlink(filePath);
    } catch (err) {
      await m.react("❌");
      await m.reply("Terjadi kesalahan saat membuat gambar. Silakan coba lagi nanti.");
      console.error("Error aigen:", err);
    }
  },
};
