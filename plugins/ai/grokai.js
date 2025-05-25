export default {
  cmd: ["grokai"],
  name: "grokai",
  category: "ai",
  description: "Grok AI chat mode",
  execute: async (m, { Func }) => {
    const model = "grok";

    if (!m.text || m.text.trim() === "") {
      return m.reply(
        Func.example(
          m.prefix,
          m.command,
          "Apa itu kecerdasan buatan?"
        ) +
          `\n\nModel yang digunakan: ${model}`
      );
    }

    const prompt = m.text.trim();

    const allowedCharsRegex = /^[a-zA-Z0-9\s.,!?:;\-'"()]+$/;
    if (!allowedCharsRegex.test(prompt)) {
      return m.reply(
        "Teks hanya boleh mengandung huruf, angka, spasi, dan tanda baca berikut: . , ! ? : ; - ' \" ( )\n" +
          "Tolong hindari karakter berbahaya untuk keamanan sistem."
      );
    }

    try {
      await m.react("⏳");

      const promptEncoded = encodeURIComponent(prompt);
      const url = `https://text.pollinations.ai/${promptEncoded}?model=${model}`;

      const response = await fetch(url);

      if (response.status === 429) {
        await m.react("❌");
        return m.reply(
          "Saat ini model AI sibuk, coba lagi nanti."
        );
      }

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const resultText = await response.text();

      await m.react("✅");
      await m.reply(resultText);
    } catch (err) {
      await m.react("❌");
      await m.reply(
        "Terjadi kesalahan saat mencoba memproses permintaan Anda. Silakan coba lagi nanti."
      );
      console.error("Error grokai:", err);
    }
  },
};
