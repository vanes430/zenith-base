import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

import { pipeline } from "stream";
import { promisify } from "util";
const streamPipeline = promisify(pipeline);

export default {
  cmd: ["wget"],
  name: "wget",
  category: "utility",
  description: "Download file dari URL lalu kirim ke chat dengan tipe media sesuai MIME.",
  execute: async (m, { client }) => {
    if (!m.text || m.text.trim() === "") {
      return m.reply("Usage: wget <url>");
    }

    const url = m.text.trim();

    // Validasi sederhana URL
    if (!/^https?:\/\/.+/i.test(url)) {
      return m.reply("URL tidak valid. Pastikan diawali dengan http:// atau https://");
    }

    try {
      await m.react("⏳");

      // Fetch header dulu untuk dapatkan MIME type
      const headResp = await fetch(url, { method: "HEAD" });
      if (!headResp.ok) {
        await m.react("❌");
        return m.reply(`Gagal mengakses URL: ${headResp.status}`);
      }
      const contentType = headResp.headers.get("content-type") || "";

      // Siapkan folder temp
      const tempDir = path.resolve("./temp");
      await fs.mkdir(tempDir, { recursive: true });

      // Generate nama file dengan ekstensi sesuai MIME type (fallback .bin)
      const ext = (() => {
        if (contentType.startsWith("image/")) return contentType.split("/")[1].split(";")[0];
        if (contentType.startsWith("video/")) return contentType.split("/")[1].split(";")[0];
        if (contentType.startsWith("audio/")) return contentType.split("/")[1].split(";")[0];
        if (contentType === "application/pdf") return "pdf";
        return "bin";
      })();

      const filename = `wget-${crypto.randomBytes(4).toString("hex")}.${ext}`;
      const filepath = path.join(tempDir, filename);

      // Download file stream ke lokal
      const resp = await fetch(url);
      if (!resp.ok) {
        await m.react("❌");
        return m.reply(`Gagal download file: ${resp.status}`);
      }

      await streamPipeline(resp.body, await fs.open(filepath, "w").then(fh => fh.createWriteStream()));

      await m.react("✅");

      const jid = m.chat || m.from;
      if (!jid) {
        await m.react("❌");
        return m.reply("Tidak dapat menentukan tujuan pengiriman pesan.");
      }

      // Kirim file sesuai tipe MIME
      let message = {};
      if (contentType.startsWith("image/")) {
        message = { image: { url: filepath } };
      } else if (contentType.startsWith("video/")) {
        message = { video: { url: filepath } };
      } else if (contentType.startsWith("audio/")) {
        message = { audio: { url: filepath, mimetype: contentType } };
      } else {
        message = { document: { url: filepath, mimetype: contentType, fileName: filename } };
      }

      await client.sendMessage(jid, message, { quoted: m });

      // Hapus file lokal setelah kirim
      await fs.unlink(filepath);

    } catch (err) {
      await m.react("❌");
      await m.reply("Terjadi kesalahan saat mengunduh file.");
      console.error("[wget] Error:", err);
    }
  },
};
