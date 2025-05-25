import axios from "axios";

export default {
  cmd: ["infoch"],
  name: "infoch",
  category: "main",
  description: "Ambil metadata channel dan kirim info lengkap + icon sebagai gambar",
  async execute(m, { client }) {
    const text = (m.text || "").trim();

    if (!text) {
      return m.reply("Pesan kosong, mohon sertakan ID channel atau link channel yang valid.");
    }

    const match = text.match(/0029[a-zA-Z0-9]+/);
    if (!match) {
      return m.reply("ID channel tidak ditemukan di pesan. Pastikan menyertakan ID channel yang valid dimulai dengan '0029'.");
    }
    const channelId = match[0];

    try {
      const metadata = await client.newsletterMetadata("invite", channelId);

      const {
        id,
        name,
        picture,
        preview,
        subscribers,
        reaction_codes,
        verification,
        state,
      } = metadata;

      const iconUrl = preview || picture;

      const captionLines = [
        `Nama : ${name}`,
        `ID : ${id}`,
        `Sub : ${subscribers}`,
        `React : ${reaction_codes || "Tidak ada"}`,
        `Verif : ${verification || "Tidak ada"}`,
        `Status : ${state || "Tidak diketahui"}`,
      ];

      const caption = captionLines.join("\n");

      if (!iconUrl) {
        return m.reply(caption + "\n(Tidak ada icon channel)");
      }

      // Download icon sebagai buffer
      const response = await axios.get(iconUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(response.data, "binary");

      await client.sendMessage(
        m.chat,
        {
          image: imageBuffer,
          caption,
        },
        { quoted: m }
      );
    } catch (error) {
      console.error("[infoch] Error ambil metadata channel:", error);
      if (error?.status === 404) {
        return m.reply("Channel tidak ditemukan. Pastikan ID channel benar dan bot sudah join.");
      }
      if (error?.status === 403) {
        return m.reply("Bot tidak memiliki izin mengakses channel ini.");
      }
      return m.reply("Gagal mengambil metadata channel. Pastikan ID valid dan bot memiliki akses.");
    }
  },
};
