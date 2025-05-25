import fs from "fs";
import config from "../../src/configs/config.js";

const databaseFolderPath = "./temp/";

export default {
  cmd: ["mute"],
  name: "mute",
  category: "main",
  description: "Mute/unmute group chat",
  isOwner: true,
  isGroup: true,
  async execute(m, { Func: func }) {
    // Cari groupId yang valid
    const groupId = (m.chat && m.chat.endsWith("@g.us")) ? m.chat :
                    (m.from && m.from.endsWith("@g.us")) ? m.from : null;
    if (!groupId) return m.reply("Perintah ini hanya bisa digunakan di grup.");

    // Path file database
    const databasePath = databaseFolderPath + config.database;

    // Baca database
    let database;
    try {
      database = JSON.parse(fs.readFileSync(databasePath, "utf8"));
    } catch (err) {
      return m.reply("Gagal membaca database. Cek file & format JSON.");
    }

    // Pastikan group ada di database.groups
    if (!database.groups || !database.groups[groupId]) {
      return m.reply("Grup ini belum terdaftar di database.");
    }
    const groupData = database.groups[groupId];

    // Parsing argumen secara tepat
    // Contoh: .mute on  -> args: ['mute','on']
    // Contoh: .mute     -> args: ['mute']
    const bodyNoPrefix = m.body.startsWith(m.prefix)
      ? m.body.slice(m.prefix.length)
      : m.body;
    const args = bodyNoPrefix.trim().split(/\s+/); // Pisah dengan spasi
    const option = args[1]?.toLowerCase(); // "on" | "off" | undefined

    // Jika tanpa argumen: tampilkan status mute
    if (!option) {
      const status = groupData.mute ? "Aktif" : "Non-Aktif";
      return m.reply(`Status mute grup ini: ${status}`);
    }

    // .mute on
    if (option === "on") {
      if (groupData.mute) return m.reply("Grup ini sudah dalam status mute.");
      groupData.mute = true;
      try {
        fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
      } catch {
        return m.reply("Gagal menyimpan perubahan database.");
      }
      return m.reply("Mute untuk grup ini diaktifkan.");
    }

    // .mute off
    if (option === "off") {
      if (!groupData.mute) return m.reply("Grup ini sudah non-mute.");
      groupData.mute = false;
      try {
        fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
      } catch {
        return m.reply("Gagal menyimpan perubahan database.");
      }
      return m.reply("Mute untuk grup ini dimatikan.");
    }

    // Argument lain (salah)
    return m.reply("Argument tidak valid. Gunakan '.mute', '.mute on', atau '.mute off'.");
  },
};
