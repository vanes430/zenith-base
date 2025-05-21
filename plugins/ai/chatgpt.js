export default {
  cmd: ["ai", "openai"],
  name: "openai",
  category: "ai",
  description: "ChatGPT-3 Chat",
  execute: async (m, { API, Func }) => {
    if (!m.text)
      return m.reply(Func.example(m.prefix, m.command, "Apa Itu Cinta?"));

    try {
      const response = await API.call("/ai/chatgpt", {
        text: m.text,
      });

      if (response.status !== 200) throw Func.format(response);

      const reply = response.result;
      m.reply(reply);
    } catch (err) {
      m.reply(
        "Terjadi kesalahan saat mencoba memproses permintaan Anda. Silakan coba lagi nanti.",
      );
      console.error(err);
    }
  },
};
