export default {
  cmd: ["openai"],
  name: "openai",
  category: "ai",
  description: "ChatGPT AI chat mode",
  execute: async (m, { Func }) => {
    const validModels = ["openai", "openai-fast", "openai-small", "openai-large", "openai-roblox", "mirexa", "searchgpt"];
    const defaultModel = "openai";

    if (!m.text || m.text.trim() === "") {
      return m.reply(
        Func.example(
          m.prefix,
          m.command,
          "Apa itu kecerdasan buatan?"
        ) +
          `\n\nModel valid: ${validModels.join(", ")}\n` +
          `Gunakan flag --model untuk ganti model, contoh:\n` +
          `${m.prefix}${m.command} --mistral Jelaskan cuaca hari ini.`
      );
    }

    const text = m.text.trim();

    // Cek apakah dia pakai flag model --modelName di awal
    let model = defaultModel;
    let prompt = text;

    const modelFlagMatch = text.match(/^--(\w+)\s+(.*)/);
    if (modelFlagMatch) {
      const requestedModel = modelFlagMatch[1].toLowerCase();
      if (!validModels.includes(requestedModel)) {
        return m.reply(
          `Model "${requestedModel}" tidak valid.\nModel valid: ${validModels.join(", ")}`
        );
      }
      model = requestedModel;
      prompt = modelFlagMatch[2].trim();

      if (!prompt) {
        return m.reply(
          "Masukkan teks pertanyaan setelah model.\nContoh:\n" +
            Func.example(m.prefix, m.command, `--${model} Apa itu Pancasila?`)
        );
      }
    }

    // Filter input prompt: hanya alfanumerik, spasi, dan tanda baca umum ini saja:
    // . , ! ? : ; - ' " ( )
    const allowedCharsRegex = /^[a-zA-Z0-9\s.,!?:;\-'"()]+$/;

    if (!allowedCharsRegex.test(prompt)) {
      return m.reply(
        "Teks hanya boleh mengandung huruf, angka, spasi, dan tanda baca berikut: . , ! ? : ; - ' \" ( )\n" +
          "Tolong hindari karakter berbahaya untuk keamanan sistem."
      );
    }

    try {
      // React loading
      await m.react("⏳");

      const promptEncoded = encodeURIComponent(prompt);
      const url = `https://text.pollinations.ai/${promptEncoded}?model=${model}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const resultText = await response.text();

      // Optionally remove react or add success react here (depends on your bot framework)
      await m.react("✅");

      await m.reply(resultText);
    } catch (err) {
      await m.reply(
        "Terjadi kesalahan saat mencoba memproses permintaan Anda. Silakan coba lagi nanti."
      );
      console.error(err);
    }
  },
};
