import fetch from "node-fetch";

export default {
  cmd: ["imageai"],
  name: "imageai",
  category: "ai",
  description: "Generate gambar dari teks dengan model AI random dari daftar yang tersedia.",
  execute: async (m, { Func, client }) => {
    const availableModels = ["flux", "midjourney", "flux-schnell", "dall-e-3"];

    if (!m.text || m.text.trim() === "") {
      return m.reply(
        Func.example(m.prefix, "imageai", "pemandangan gunung di senja hari")
      );
    }

    const prompt = m.text.trim();

    // Validasi karakter input prompt
    const allowedCharsRegex = /^[a-zA-Z0-9\s.,!?:;\-'"()]+$/;
    if (!allowedCharsRegex.test(prompt)) {
      return m.reply(
        "Teks hanya boleh mengandung huruf, angka, spasi, dan tanda baca berikut: . , ! ? : ; - ' \" ( )"
      );
    }

    try {
      await m.react("⏳");

      // Pilih model random dari availableModels
      const model =
        availableModels[Math.floor(Math.random() * availableModels.length)];

      const body = {
        prompt,
        model,
        response_format: "url",
        private: true,
      };

      const response = await fetch("http://localhost:10001/v1/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        await m.react("❌");
        return m.reply("Model AI sedang sibuk, coba lagi nanti.");
      } else if (response.status >= 500) {
        await m.react("❌");
        return m.reply(`Terjadi gangguan server (${response.status}). Silakan coba lagi nanti.`);
      } else if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error("Response API tidak mengandung data gambar.");
      }

      const imageUrl = data.data[0].url;
      if (!imageUrl) {
        throw new Error("Response API tidak mengandung URL gambar.");
      }

      await m.react("✅");

      const jid = m.chat || m.from;
      if (!jid) {
        await m.react("❌");
        return m.reply("Tidak dapat menentukan tujuan pengiriman pesan.");
      }

      // Kirim gambar langsung via URL, tanpa download dulu
      await client.sendMessage(
        jid,
        {
          image: { url: imageUrl },
          caption: `🖼️ *Hasil Gambar*\n\n📄 Prompt: ${prompt}\n⚙️ Model: ${model}`,
        },
        { quoted: m }
      );

    } catch (err) {
      await m.react("❌");
      await m.reply(
        "Terjadi kesalahan saat membuat gambar. Silakan coba lagi nanti."
      );
      console.error("[imageai] Error:", err);
    }
  },
};
