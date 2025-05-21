export default {
  cmd: ["gemini"],
  name: ["gemini"],
  category: "ai",
  description: "Gunakan AI Google Gemini untuk menghasilkan teks cerdas.",
  execute: async (m, { API, Func }) => {
    if (!m.text)
      return m.reply(Func.example(m.prefix, m.command, "Hallo Gemini"));

    try {
      const response = await API.call("/ai/gemini", {
        text: m.text,
      });
      m.reply(`${response.result}`);
    } catch (error) {
      m.reply(
        "Maaf, terjadi kesalahan pada sistem AI. Silakan coba lagi nanti.",
      );
    }
  },
};
