import axios from "axios";
import FormData from "form-data";

const apiKeys = [
  "t4DJWibUPdxTbCiZs6wXUTMB",
  "Divb33Vh3YANNFJMPkv4QJs3",
  "61N7EMLJURGuTdYpavHwkWTC",
];

const getRandomApiKey = () => {
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
};

const isValidImage = (mime) => {
  const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  return validTypes.includes(mime);
};

const handler = async (m, { conn }) => {
  try {
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mime || "";

    if (!isValidImage(mime)) {
      return m.reply(
        "❌ Format tidak didukung!\n\n📝 Penggunaan:\nBalas/kirim gambar dengan caption:\n!removebg atau !remove_bg\n\n✅ Format yang didukung: JPG, JPEG, PNG, WEBP",
      );
    }

    const processingMsg = await m.reply("⏳ Sedang memproses gambar...");

    const media = await q.download();
    if (!media) {
      throw new Error("Gagal mengunduh media");
    }

    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("image_file", media, `${Date.now()}.${mime.split("/")[1]}`);

    const config = {
      method: "post",
      url: "https://api.remove.bg/v1.0/removebg",
      data: formData,
      responseType: "arraybuffer",
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": getRandomApiKey(),
      },
      encoding: null,
    };

    const response = await axios(config);

    if (response.status === 200) {
      const image = Buffer.from(response.data);

      if (processingMsg.key) {
        await conn.sendMessage(m.chat, { delete: processingMsg.key });
      }

      await conn.sendFile(
        m.chat,
        image,
        "removebg.png",
        "✅ Background berhasil dihapus!",
        m,
      );
    } else {
      throw new Error(`Server error: ${response.status}`);
    }
  } catch (error) {
    console.error("Remove BG Error:", error);
    let errorMessage = "❌ Gagal memproses gambar. ";

    if (error.response) {
      if (error.response.status === 402) {
        errorMessage += "API key limit tercapai, coba lagi nanti.";
      } else if (error.response.status === 401) {
        errorMessage += "API key tidak valid.";
      } else {
        errorMessage += "Terjadi kesalahan pada server.";
      }
    } else if (error.code === "ECONNREFUSED") {
      errorMessage += "Tidak dapat terhubung ke server.";
    } else {
      errorMessage += "Silakan coba lagi nanti.";
    }

    await m.reply(errorMessage);
  }
};

export default {
  cmd: ["removebg", "remove_bg"],
  name: "removebg",
  category: ["tools"],
  description: "Menghapus background dari gambar",
  execute: handler,
};
