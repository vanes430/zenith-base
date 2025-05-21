import axios from "axios";
import FormData from "form-data";

export default {
  cmd: ["upscale", "hd", "remini"],
  name: "upscale",
  category: "tools",
  description: "Meningkatkan kualitas gambar menggunakan AI",
  execute: async (m, { client }) => {
    const quoted = m.isQuoted ? m.quoted : m;

    if (!/image\/(jpe?g|png)/.test(quoted.mime)) {
      return m.reply(
        `Reply/Kirim gambar dengan caption ${m.prefix + m.command}\nFormat yang didukung: JPEG/PNG`,
      );
    }

    try {
      m.reply("Sedang memproses gambar...");

      const media = await quoted.download();
      const fileSize = media.length;

      if (fileSize > 5 * 1024 * 1024) {
        return m.reply("Ukuran gambar terlalu besar! Maksimal 5MB");
      }

      try {
        const enhancedImage = await enhance(media, "enhance");
        await m.reply(enhancedImage, {
          caption: "✨ Berhasil meningkatkan kualitas gambar!",
          quoted: m,
        });
      } catch (enhanceError) {
        try {
          const recoloredImage = await enhance(media, "recolor");
          await m.reply(recoloredImage, {
            caption: "✨ Berhasil memproses gambar dengan mode recolor!",
            quoted: m,
          });
        } catch (recolorError) {
          throw new Error("Semua metode pemrosesan gagal");
        }
      }
    } catch (error) {
      client.logger.error(error);
      m.reply(`❌ Terjadi kesalahan: ${error.message}`);
    }
  },
};

const enhance = (urlPath, method) => {
  return new Promise(async (resolve, reject) => {
    const validMethods = ["enhance", "recolor", "dehaze"];
    if (!validMethods.includes(method)) {
      method = validMethods[0];
    }

    const Form = new FormData();
    const scheme = `https://inferenceengine.vyro.ai/${method}`;

    const headers = {
      "User-Agent": "okhttp/4.9.3",
      clientection: "Keep-Alive",
      "Accept-Encoding": "gzip",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache",
    };

    try {
      Form.append("model_version", 1, {
        "Content-Transfer-Encoding": "binary",
        contentType: "multipart/form-data; charset=utf-8",
      });

      Form.append("image", Buffer.from(urlPath), {
        filename: `enhance_image_${Date.now()}.jpg`,
        contentType: "image/jpeg",
      });

      const timeout = 30000;

      Form.submit(
        {
          url: scheme,
          host: "inferenceengine.vyro.ai",
          path: `/${method}`,
          protocol: "https:",
          headers: headers,
          timeout: timeout,
        },
        function (err, res) {
          if (err) {
            return reject(new Error(`Gagal mengirim request: ${err.message}`));
          }

          const data = [];
          res.on("data", (chunk) => data.push(chunk));

          res.on("end", () => {
            const resultBuffer = Buffer.concat(data);
            if (resultBuffer.length === 0) {
              reject(new Error("Hasil pemrosesan kosong"));
            } else {
              resolve(resultBuffer);
            }
          });

          res.on("error", (e) => {
            reject(new Error(`Error saat menerima data: ${e.message}`));
          });

          setTimeout(() => {
            reject(
              new Error("Request timeout setelah " + timeout / 1000 + " detik"),
            );
          }, timeout);
        },
      );
    } catch (error) {
      reject(new Error(`Error saat memproses request: ${error.message}`));
    }
  });
};
